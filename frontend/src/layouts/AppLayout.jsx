import { Outlet } from 'react-router-dom'
import Sidebar from '@/components/navigation/Sidebar'
import Topbar from '@/components/navigation/Topbar'
import CreateProjectModal from '@/components/project/CreateProjectModal'
import { useUIStore } from '@/store/uiStore'
import styles from './AppLayout.module.css'

export default function AppLayout() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const projectModalOpen = useUIStore((s) => s.projectModalOpen)
  const setProjectModalOpen = useUIStore((s) => s.setProjectModalOpen)

  return (
    <div className={`${styles.root} ${collapsed ? styles.collapsed : ''}`}>
      <Sidebar />
      <div className={styles.body}>
        <Topbar />
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
      <CreateProjectModal 
        isOpen={projectModalOpen} 
        onClose={() => setProjectModalOpen(false)} 
      />
    </div>
  )
}
