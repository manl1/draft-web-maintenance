import { useState, useEffect, useRef } from 'react'
import flatpickr from 'flatpickr'
import 'flatpickr/dist/flatpickr.min.css'
import './Locations.css'

// ===== Add Location Modal =====
function AddLocationModal({ isOpen, onClose }) {
  const [animClass, setAnimClass] = useState('animating-in')
  const startDateRef = useRef(null)
  const endDateRef = useRef(null)

  useEffect(() => {
    if (isOpen) setAnimClass('animating-in')
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const config = { dateFormat: 'm/d/Y', allowInput: true, locale: { firstDayOfWeek: 0 } }
    const instances = []
    if (startDateRef.current) instances.push(flatpickr(startDateRef.current, config))
    if (endDateRef.current) instances.push(flatpickr(endDateRef.current, config))
    return () => instances.forEach(fp => fp.destroy())
  }, [isOpen])

  const handleClose = () => {
    setAnimClass('animating-out')
    setTimeout(() => { onClose(); setAnimClass('animating-in') }, 200)
  }

  if (!isOpen) return null

  return (
    <div className="add-loc-overlay active" onClick={handleClose}>
      <div className={`add-loc-modal ${animClass}`} onClick={e => e.stopPropagation()}>
        <div className="add-loc-header">
          <h2>Add Location</h2>
          <p>Fill in the fields below to create and add a new Location</p>
        </div>

        <div className="add-loc-body">
          <div className="add-loc-field">
            <label className="add-loc-label">Location</label>
            <select className="add-loc-select" defaultValue="">
              <option value="" disabled>Location</option>
              <option>No Options</option>
            </select>
          </div>

          <div className="add-loc-field">
            <label className="add-loc-label">Asset</label>
            <select className="add-loc-select" defaultValue="">
              <option value="" disabled>Asset</option>
              <option>No Options</option>
            </select>
          </div>

          <div className="add-loc-field">
            <label className="add-loc-label">Status</label>
            <select className="add-loc-select" defaultValue="">
              <option value="" disabled>Status</option>
              {['Active', 'Inactive', 'Under Maintenance'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>

          <div className="add-loc-field">
            <label className="add-loc-label">Project Code</label>
            <input type="text" className="add-loc-input" placeholder="Project Code" />
          </div>

          <div className="add-loc-field">
            <label className="add-loc-label">Condition</label>
            <select className="add-loc-select" defaultValue="">
              <option value="" disabled>Condition</option>
              {['Good', 'Fair', 'Poor'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>

          <div className="add-loc-row">
            <div className="add-loc-field">
              <label className="add-loc-label">Start Date</label>
              <input ref={startDateRef} type="text" className="add-loc-input" placeholder="mm/dd/yyyy" />
            </div>
            <div className="add-loc-field">
              <label className="add-loc-label">End Date</label>
              <input ref={endDateRef} type="text" className="add-loc-input" placeholder="mm/dd/yyyy" />
            </div>
          </div>
        </div>

        <div className="add-loc-footer">
          <button className="add-loc-submit-btn" onClick={handleClose}>Add</button>
        </div>
      </div>
    </div>
  )
}

// ===== Main Locations Page =====
function Locations() {
  // Map View tidak bisa active, hanya List View
  const [activeTab, setActiveTab] = useState('list')
  const [addLocOpen, setAddLocOpen] = useState(false)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  return (
    <>
      <div className="locations-wrapper">
        {/* Toolbar */}
        <div className="loc-toolbar">
          <div className="loc-view-tabs">
            <button
              className={`loc-tab-button ${activeTab === 'list' ? 'active' : ''}`}
              onClick={() => setActiveTab('list')}
            >
              List View
            </button>
            {/* Map View: tidak pernah active, hanya hover */}
            <button className="loc-tab-button loc-map-btn">
              Map View
            </button>
          </div>
          <div className="loc-toolbar-actions">
            <button className="loc-refresh-button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </button>
            <button className="loc-create-button" onClick={() => setAddLocOpen(true)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Location
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="loc-table-container">
          <div className="loc-table-scroll">
            <table className="locations-table">
              <thead>
                <tr>
                  <th>LOCATION</th><th>ASSET</th><th>STATUS</th>
                  <th>PROJECT CODE</th><th>CONDITION</th><th>START</th><th>END</th>
                </tr>
              </thead>
              <tbody>
                <tr className="empty-row">
                  <td colSpan="7">
                    <div className="empty-state">
                      <p className="empty-title">Locations let you manage more efficiently assets and workers</p>
                      <p className="empty-subtitle">Press the '+' button to create a Location</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="loc-table-footer"></div>
        </div>

        {/* Pagination */}
        <div className="loc-pagination">
          <div className="loc-pagination-info">
            <span>Rows per page:</span>
            <select className="loc-rows-select" value={rowsPerPage} onChange={e => setRowsPerPage(e.target.value)}>
              {[10, 25, 50, 100].map(n => <option key={n}>{n}</option>)}
            </select>
            <span className="loc-page-info">0-0 of 0</span>
          </div>
          <div className="loc-pagination-controls">
            <button className="loc-pagination-btn" disabled>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <button className="loc-pagination-btn" disabled>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </div>
        </div>
      </div>

      <AddLocationModal isOpen={addLocOpen} onClose={() => setAddLocOpen(false)} />
    </>
  )
}

export default Locations
