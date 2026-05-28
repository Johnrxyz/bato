import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { projectsApi } from '@/api/projects'
import { StatusBadge } from '@/components/ui/Badge'
import { Kanban, ChevronRight } from 'lucide-react'
import Button from '@/components/ui/Button'
import TaskBoard from '@/components/project/TaskBoard'
import TaskPanel from '@/components/project/TaskPanel'
import styles from './ProjectDetailPage.module.css'

export default function ProjectDetailPage() {
  const { projectId } = useParams()

  const { data: project, isLoading } = useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => projectsApi.get(projectId).then((r) => r.data),
  })

  if (isLoading) return <div className={styles.loading}>Loading project…</div>
  if (!project) return <div className={styles.loading}>Project not found.</div>

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.breadcrumb}>
          <Link to="/projects" className={styles.breadcrumbLink}>Projects</Link>
          <ChevronRight size={14} className={styles.breadcrumbSeparator} />
          <span className={styles.breadcrumbCurrent}>{project.title}</span>
        </div>
        <div className={styles.meta}>
          <span className={styles.identifier}>{project.identifier}</span>
          <StatusBadge status={project.status} />
        </div>
        <div className={styles.headerContent}>
          <div>
            <h2 className={styles.title}>{project.title}</h2>
            {project.description && (
              <p className={styles.description}>{project.description}</p>
            )}
          </div>
          <div className={styles.actions}>
            <Link to={`/projects/${projectId}/kanban`}>
              <Button size="sm" variant="secondary">
                <Kanban size={14} strokeWidth={1.75} /> Kanban board
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <TaskBoard tasks={project.tasks} projectId={projectId} members={project.members} />

      <section className={styles.stats} style={{ marginTop: '2rem' }}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Completion</span>
          <span className={styles.statValue}>{project.completion_percentage}%</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Total tasks</span>
          <span className={styles.statValue}>{project.task_count}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Done</span>
          <span className={styles.statValue}>{project.completed_task_count}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Members</span>
          <span className={styles.statValue}>{project.members?.length ?? 0}</span>
        </div>
      </section>
      <TaskPanel />
    </div>
  )
}
