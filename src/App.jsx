import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import WorkOrder from './pages/WorkOrder.jsx'
import Assets from './pages/Assets.jsx'
import Locations from './pages/Locations.jsx'
import Tracking from './pages/Tracking.jsx'
import Dashboard from './pages/Dashboard.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="work-order" element={<WorkOrder />} />
        <Route path="assets" element={<Assets />} />
        <Route path="locations" element={<Locations />} />
        <Route path="tracking" element={<Tracking />} />
        <Route path="dashboard" element={<Dashboard />} />
      </Route>
    </Routes>
  )
}

export default App
