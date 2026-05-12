import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import KanbanCard from './KanbanCard'
import { MoreHorizontal, Plus } from 'lucide-react'
import styles from './KanbanBoard.module.css' // Reusing some board styles or will create new

export default function KanbanColumn({ id, title, color, tasks = [] }) {
  const { setNodeRef } = useDroppable({ id })

  return (
    <div className={styles.column}>
      <div className={styles.columnHeader}>
        <div className={styles.columnTitleWrap}>
          <div className={styles.columnIndicator} style={{ backgroundColor: color }} />
          <h3 className={styles.columnTitle}>{title}</h3>
          <span className={styles.columnCount}>{tasks.length}</span>
        </div>
        <div className={styles.columnActions}>
          <button className={styles.iconBtn}><Plus size={14} /></button>
          <button className={styles.iconBtn}><MoreHorizontal size={14} /></button>
        </div>
      </div>

      <div ref={setNodeRef} className={styles.columnBody}>
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <KanbanCard key={task.id} task={task} />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className={styles.emptyColumn}>Drop tasks here</div>
        )}
      </div>
    </div>
  )
}
