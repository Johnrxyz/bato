import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Kanban } from 'lucide-react'
import { projectsApi } from '@/api/projects'
import { StatusBadge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { useUIStore } from '@/store/uiStore'
import styles from './ProjectsPage.module.css'

export default function ProjectsPage() {
  const setProjectModalOpen = useUIStore((s) => s.setProjectModalOpen)
  const { data, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list().then((r) => r.data.results),
  })

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>Projects</h2>
        <Button size="sm" onClick={() => setProjectModalOpen(true)}>
          <Plus size={14} strokeWidth={2} /> New project
        </Button>
      </div>

      {isLoading && <p className={styles.empty}>Loading projects…</p>}

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Progress</th>
            <th>Tasks</th>
            <th>Due date</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((p) => (
            <tr key={p.id}>
              <td>
                <Link to={`/projects/${p.id}`} className={styles.name}>
                  <span className={styles.identifier}>{p.identifier}</span>
                  {p.title}
                </Link>
              </td>
              <td><StatusBadge status={p.status} /></td>
              <td>
                <div className={styles.progress}>
                  <div className={styles.bar}>
                    <div className={styles.fill} style={{ width: `${p.completion_percentage}%` }} />
                  </div>
                  <span>{p.completion_percentage}%</span>
                </div>
              </td>
              <td className={styles.num}>{p.task_count}</td>
              <td className={styles.date}>{p.due_date ?? '—'}</td>
              <td>
                <Link to={`/projects/${p.id}/kanban`} className={styles.kanbanLink} title="Open Kanban board">
                  <Kanban size={14} strokeWidth={1.75} />
                </Link>
              </td>
            </tr>
          ))}
          {!isLoading && !data?.length && (
            <tr><td colSpan={6} className={styles.emptyRow}>No projects yet</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
