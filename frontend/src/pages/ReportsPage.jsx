import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '@/api/reports'
import {
  LineChart, Line, AreaChart, Area, PieChart, Pie, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts'
import { Download, Calendar, Filter } from 'lucide-react'
import styles from './ReportsPage.module.css'

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#94A3B8']

export default function ReportsPage() {
  const { data: dashboardData } = useQuery({
    queryKey: ['reports', 'dashboard'],
    queryFn: () => reportsApi.dashboard().then(res => res.data)
  })

  const { data: productivityData } = useQuery({
    queryKey: ['reports', 'productivity'],
    queryFn: () => reportsApi.productivity({ days: 30 }).then(res => res.data)
  })

  const { data: workloadData } = useQuery({
    queryKey: ['reports', 'workload'],
    queryFn: () => reportsApi.workload().then(res => res.data)
  })

  const statusDistribution = (dashboardData?.status_distribution || []).map(d => ({
    name: d.label,
    value: d.count
  }))

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <h1>Analytics</h1>
          <p>Detailed performance and workload insights</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.secondaryBtn}><Calendar size={14} /> Last 30 Days</button>
          <button className={styles.secondaryBtn}><Filter size={14} /> Filter</button>
          <button className={styles.primaryBtn}><Download size={14} /> Export</button>
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.mainGrid}>
          {/* Productivity Trend */}
          <section className={`${styles.card} ${styles.fullWidth} animate-fade-in`}>
            <h3 className={styles.cardTitle}>Productivity Trend</h3>
            <div className={styles.chartWrap}>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={productivityData?.tasks_completed_by_day || []}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-lg)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="var(--color-accent)" 
                    fillOpacity={1} 
                    fill="url(#colorCount)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Task Distribution */}
          <section className={`${styles.card} animate-fade-in`} style={{ animationDelay: '100ms' }}>
            <h3 className={styles.cardTitle}>Status Distribution</h3>
            <div className={styles.chartWrap}>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* User Workload */}
          <section className={`${styles.card} animate-fade-in`} style={{ animationDelay: '200ms' }}>
            <h3 className={styles.cardTitle}>User Workload</h3>
            <div className={styles.chartWrap}>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={workloadData || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <YAxis 
                    dataKey="assignees__full_name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11 }}
                    width={80}
                  />
                  <Tooltip cursor={{ fill: 'var(--color-muted)' }} />
                  <Bar dataKey="total" fill="var(--color-accent)" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
