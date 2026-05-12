import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core'
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable'
import { tasksApi } from '@/api/tasks'
import { projectsApi } from '@/api/projects'
import KanbanColumn from '@/components/project/KanbanColumn'
import KanbanCard from '@/components/project/KanbanCard'
import CreateTaskModal from '@/components/project/CreateTaskModal'
import { Plus, Filter, Search, LayoutGrid, List as ListIcon } from 'lucide-react'
import styles from './KanbanPage.module.css'

const COLUMNS = [
  { id: 'todo', title: 'To Do', color: 'var(--status-todo)' },
  { id: 'in_progress', title: 'In Progress', color: 'var(--status-in-progress)' },
  { id: 'in_review', title: 'In Review', color: 'var(--status-in-review)' },
  { id: 'done', title: 'Done', color: 'var(--status-done)' },
]

export default function KanbanPage() {
  const { projectId } = useParams()
  const queryClient = useQueryClient()
  const [activeTask, setActiveTask] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: projectId ? ['tasks', 'kanban', projectId] : ['tasks', 'kanban'],
    queryFn: () => {
      const promise = projectId ? tasksApi.list({ project: projectId }) : tasksApi.list()
      return promise.then(res => res.data.results || res.data)
    }
  })

  const createTask = useMutation({
    mutationFn: (title) => tasksApi.create({ title, project: projectId, status: 'todo' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks', 'kanban'])
    }
  })

  const updateTask = useMutation({
    mutationFn: ({ id, status, position }) => tasksApi.reorder(id, { status, position }),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks', 'kanban'])
    }
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const tasksByStatus = useMemo(() => {
    const filtered = tasks.filter(t => 
      t.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
    return COLUMNS.reduce((acc, col) => {
      acc[col.id] = filtered.filter(t => t.status === col.id).sort((a, b) => a.position - b.position)
      return acc
    }, {})
  }, [tasks, searchQuery])

  const handleDragStart = (event) => {
    const { active } = event
    setActiveTask(tasks.find(t => t.id === active.id))
  }

  const handleDragOver = (event) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id
    const overId = over.id

    if (activeId === overId) return

    // Logic for jumping between columns is handled in onDragEnd for simplicity in this demo
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const activeId = active.id
    const overId = over.id

    const activeTask = tasks.find(t => t.id === activeId)
    if (!activeTask) return

    // If dropped on a column
    if (COLUMNS.find(c => c.id === overId)) {
      if (activeTask.status !== overId) {
        updateTask.mutate({ id: activeId, status: overId, position: 0 })
      }
      return
    }

    // If dropped on another task
    const overTask = tasks.find(t => t.id === overId)
    if (overTask) {
      const newStatus = overTask.status
      // Simple position logic: put it just above the item it was dropped on
      const newPosition = overTask.position - 0.1
      if (activeTask.status !== newStatus || Math.abs(activeTask.position - newPosition) > 0.01) {
        updateTask.mutate({ id: activeId, status: newStatus, position: newPosition })
      }
    }
  }

  const handleAddTask = () => {
    setIsModalOpen(true)
  }

  if (isLoading) return <div className={styles.loading}>Loading Board...</div>

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <h1>Board</h1>
          <div className={styles.viewTabs}>
            <button className={styles.tabActive}><LayoutGrid size={14} /> Kanban</button>
            <button className={styles.tab}><ListIcon size={14} /> List</button>
          </div>
        </div>
        
        <div className={styles.controls}>
          <div className={styles.searchBox}>
            <Search size={14} />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className={styles.filterBtn}><Filter size={14} /> Filter</button>
          <button className={styles.addBtn} onClick={handleAddTask}><Plus size={16} /> New Task</button>
        </div>
      </header>

      <div className={styles.boardWrap}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className={styles.board}>
            {COLUMNS.map(col => (
              <KanbanColumn 
                key={col.id} 
                id={col.id} 
                title={col.title} 
                color={col.color}
                tasks={tasksByStatus[col.id]}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={{
            sideEffects: defaultDropAnimationSideEffects({
              styles: { active: { opacity: '0.5' } }
            })
          }}>
            {activeTask ? (
              <KanbanCard task={activeTask} isOverlay />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <CreateTaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        projectId={projectId} 
      />
    </div>
  )
}
