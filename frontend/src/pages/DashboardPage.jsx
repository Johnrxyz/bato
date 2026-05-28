import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '@/api/reports'
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge'
import { Link } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import {
  CheckSquare, Clock, AlertTriangle, TrendingUp, Plus, Activity, Users, Flame
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, CartesianGrid
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
  const [prodView, setProdView] = useState('tasks') // 'tasks' | 'time'

  const { data: dashboardData, isLoading: loadingDash } = useQuery({
    queryKey: ['reports', 'dashboard'],
    queryFn: () => reportsApi.dashboard().then((r) => r.data),
  })

  const { data: productivity, isLoading: loadingProd } = useQuery({
    queryKey: ['reports', 'productivity'],
    queryFn: () => reportsApi.productivity().then((r) => r.data),
  })

  const { data: overdueTasks, isLoading: loadingOverdue } = useQuery({
    queryKey: ['reports', 'overdue'],
    queryFn: () => reportsApi.overdue().then((r) => r.data),
  })

  const { data: workload, isLoading: loadingWorkload } = useQuery({
    queryKey: ['reports', 'workload'],
    queryFn: () => reportsApi.workload().then((r) => r.data),
  })

  if (loadingDash || loadingProd || loadingOverdue || loadingWorkload) {
    return <div className={styles.loading}>Loading dashboard…</div>
  }

  const tc = dashboardData?.task_counts ?? {}
  const statusChartData = (dashboardData?.status_distribution ?? []).filter((d) => d.count > 0)

  // Format productivity data
  const safeFormatDate = (dateStr) => {
    try {
      return format(parseISO(dateStr), 'MMM d')
    } catch {
      return dateStr
    }
  }

  const prodChartData = prodView === 'tasks'
    ? (productivity?.tasks_completed_by_day || []).map(d => ({ date: safeFormatDate(d.day), value: d.count }))
    : (productivity?.time_logged_by_day || []).map(d => ({ date: safeFormatDate(d.day), value: Math.round(d.total_seconds / 3600 * 10) / 10 }))

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <h2 className={styles.pageTitle}>Dashboard</h2>
      </div>

      {/* Metrics row */}
      <section className={styles.metrics} aria-label="Task summary">
        <MetricCard label="Total Tasks"    value={tc.total}       icon={CheckSquare} />
        <MetricCard label="In Progress"    value={tc.in_progress} icon={TrendingUp}  variant="accent" />
        <MetricCard label="Overdue"        value={tc.overdue}     icon={AlertTriangle} variant="danger" />
        <MetricCard label="Done This Week" value={dashboardData?.completed_this_week} icon={CheckSquare} variant="success" />
        <MetricCard
          label="Time This Week"
          value={formatDuration(dashboardData?.time_logged_this_week_seconds ?? 0)}
          icon={Clock}
        />
      </section>

      <div className={styles.grid}>
        
        {/* Productivity Trend */}
        <section className={`${styles.card} ${styles.chartCard}`}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitleWrap}>
              <Activity size={16} className={styles.cardIcon} />
              <h3 className={styles.cardTitle}>Productivity Trend (Last 30 days)</h3>
            </div>
            <div className={styles.toggleGroup}>
              <button 
                className={`${styles.toggleBtn} ${prodView === 'tasks' ? styles.active : ''}`}
                onClick={() => setProdView('tasks')}
              >
                Tasks
              </button>
              <button 
                className={`${styles.toggleBtn} ${prodView === 'time' ? styles.active : ''}`}
                onClick={() => setProdView('time')}
              >
                Time Logged
              </button>
            </div>
          </div>
          <div className={styles.chartWrapLg}>
            {prodChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={prodChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--brand-primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-md)' }}
                    formatter={(val) => [prodView === 'tasks' ? val : `${val} hrs`, prodView === 'tasks' ? 'Tasks' : 'Time']}
                  />
                  <Area type="monotone" dataKey="value" stroke="var(--brand-primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.emptyChart}>No productivity data yet.</div>
            )}
          </div>
        </section>

        {/* Task Distribution */}
        <section className={`${styles.card} ${styles.distributionCard}`}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitleWrap}>
              <Flame size={16} className={styles.cardIcon} />
              <h3 className={styles.cardTitle}>Current Status</h3>
            </div>
          </div>
          <div className={styles.chartWrap}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={statusChartData} barSize={24} margin={{ left: -20 }}>
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: 'var(--color-surface-raised)' }} contentStyle={{ borderRadius: 8 }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {statusChartData.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? 'var(--color-border-strong)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Action Required: Overdue */}
        <section className={`${styles.card} ${styles.overdueCard}`}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitleWrap}>
              <AlertTriangle size={16} className={styles.cardIconDanger} />
              <h3 className={styles.cardTitle}>Action Required</h3>
            </div>
          </div>
          <div className={styles.overdueList}>
            {(overdueTasks || []).slice(0, 5).map(task => (
              <div key={task.id} className={styles.overdueItem}>
                <div className={styles.overdueInfo}>
                  <Link to={`/projects/${task.project?.id || ''}`} className={styles.overdueTitle}>
                    {task.title}
                  </Link>
                  <span className={styles.overdueProject}>{task.project?.title || 'Personal'}</span>
                </div>
                <div className={styles.overdueDays}>
                  {format(parseISO(task.due_date), 'MMM d')}
                </div>
              </div>
            ))}
            {overdueTasks?.length === 0 && (
              <div className={styles.emptyList}>No overdue tasks! You're on track. 🎉</div>
            )}
            {overdueTasks?.length > 5 && (
              <div className={styles.moreOverdue}>+ {overdueTasks.length - 5} more</div>
            )}
          </div>
        </section>

        {/* Projects */}
        <section className={`${styles.card} ${styles.projectsCard}`}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Active Projects</h3>
            <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
              <Link to="/projects" className={styles.viewAll}>View all</Link>
              <button className={styles.addBtnMini} title="New Project" onClick={() => setProjectModalOpen(true)}><Plus size={14} /></button>
            </div>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {(dashboardData?.projects ?? []).slice(0, 5).map((p) => (
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
                    </td>
                  </tr>
                ))}
                {!dashboardData?.projects?.length && (
                  <tr>
                    <td colSpan={3} className={styles.empty}>No projects yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Team Workload */}
        <section className={`${styles.card} ${styles.workloadCard}`}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitleWrap}>
              <Users size={16} className={styles.cardIcon} />
              <h3 className={styles.cardTitle}>Team Workload</h3>
            </div>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Team Member</th>
                  <th>Total Tasks</th>
                  <th>In Progress</th>
                  <th>Completed</th>
                  <th>Overdue</th>
                </tr>
              </thead>
              <tbody>
                {(workload || []).map((w) => (
                  <tr key={w.assignees__id}>
                    <td className={styles.memberName}>
                      {w.assignees__full_name || w.assignees__email}
                    </td>
                    <td className={styles.workloadNum}>{w.total}</td>
                    <td className={styles.workloadNum}>{w.in_progress}</td>
                    <td className={styles.workloadNum}>{w.done}</td>
                    <td className={w.overdue > 0 ? styles.workloadNumDanger : styles.workloadNum}>{w.overdue}</td>
                  </tr>
                ))}
                {!workload?.length && (
                  <tr>
                    <td colSpan={5} className={styles.empty}>No active team assignments.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
