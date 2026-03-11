import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import './Layout.css'

// Mapping path ke nama halaman
const pageTitles = {
  '/': 'Home',
  '/work-order': 'Work Order',
  '/assets': 'Assets',
  '/locations': 'Locations',
  '/tracking': 'Tracking',
  '/dashboard': 'Dashboard',
}

function Layout() {
  const location = useLocation()
  const pageTitle = pageTitles[location.pathname] || 'Dashboard'

  return (
    <div className="container">
      <Sidebar />

      <div className="main-content">
        <div className="header">
          <h1 className="page-title">{pageTitle}</h1>
        </div>

        <div className="content">
          {/* Setiap halaman akan dirender di sini */}
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default Layout
