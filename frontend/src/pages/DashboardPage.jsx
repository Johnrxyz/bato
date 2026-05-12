import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '@/api/reports'
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge'
import { Link } from 'react-router-dom'
import {
  BarChart2, CheckSquare, Clock, AlertTriangle, TrendingUp, Plus
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { useUIStore } from '@/store/uiStore'
import styles from './DashboardPage.module.css'

function MetricCard({ label, value, icon: Icon, variant }) {
  return (
    <div className={`${styles.metric} ${styles[variant] ?? ''}`}>
      <div className={styles.metricTop}>
        <span className={styles.metricLabel}>{label}</span>
        <Icon size={14} strokeWidth={1.75} className={styles.metricIcon} />
      </div>
      <span className={styles.metricValue}>{value ?? '—'}</span>
    </div>
  )
}

const STATUS_COLORS = {
  todo: 'var(--color-border-strong)',
  in_progress: 'var(--color-accent)',
  in_review: 'var(--color-warning)',
  done: 'var(--color-success)',
  cancelled: 'var(--color-text-disabled)',
}

export default function DashboardPage() {
  const setProjectModalOpen = useUIStore((s) => s.setProjectModalOpen)
  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'dashboard'],
    queryFn: () => reportsApi.dashboard().then((r) => r.data),
  })

  if (isLoading) {
    return <div className={styles.loading}>Loading dashboard…</div>
  }

  const tc = data?.task_counts ?? {}
  const chartData = (data?.status_distribution ?? []).filter((d) => d.count > 0)

  return (
    <div className={styles.page}>
      {/* Metrics row */}
      <section className={styles.metrics} aria-label="Task summary">
        <MetricCard label="Total Tasks"    value={tc.total}       icon={CheckSquare} />
        <MetricCard label="In Progress"    value={tc.in_progress} icon={TrendingUp}  variant="accent" />
        <MetricCard label="Overdue"        value={tc.overdue}     icon={AlertTriangle} variant="danger" />
        <MetricCard label="Done This Week" value={data?.completed_this_week} icon={CheckSquare} variant="success" />
        <MetricCard
          label="Time This Week"
          value={formatDuration(data?.time_logged_this_week_seconds ?? 0)}
          icon={Clock}
        />
      </section>

      <div className={styles.grid}>
        {/* Status distribution chart */}
        <section className={styles.card}>
          <h3 className={styles.cardTitle}>Task distribution</h3>
          <div className={styles.chartWrap}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} barSize={28}>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    border: '1px solid var(--color-border)',
                    borderRadius: 4,
                    boxShadow: 'var(--shadow-md)',
                  }}
                  cursor={{ fill: 'var(--color-muted)' }}
                />
                <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                  {chartData.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? 'var(--color-border-strong)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Projects table */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Projects</h3>
            <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
              <Link to="/projects" className={styles.viewAll}>View all</Link>
              <button className={styles.addBtnMini} title="New Project" onClick={() => setProjectModalOpen(true)}><Plus size={14} /></button>
            </div>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Project</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Tasks</th>
              </tr>
            </thead>
            <tbody>
              {(data?.projects ?? []).slice(0, 6).map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link to={`/projects/${p.id}`} className={styles.projectLink}>
                      {p.title}
                    </Link>
                  </td>
                  <td><StatusBadge status={p.status} /></td>
                  <td>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${p.completion_percentage}%` }}
                      />
                    </div>
                    <span className={styles.progressLabel}>{p.completion_percentage}%</span>
                  </td>
                  <td className={styles.taskCount}>{p.total}</td>
                </tr>
              ))}
              {!data?.projects?.length && (
                <tr>
                  <td colSpan={4} className={styles.empty}>No projects yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  )
}

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h === 0) return `${m}m`
  return `${h}h ${m}m`
}
