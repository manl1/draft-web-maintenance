import { useState, useEffect, useRef } from 'react'
import flatpickr from 'flatpickr'
import 'flatpickr/dist/flatpickr.min.css'
import './Assets.css'

// ===== Filter Sidebar =====
function AssetFilterSidebar({ isOpen, onClose, filterBtnRef }) {
  const [visible, setVisible] = useState(false)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (isOpen) { setVisible(true); setClosing(false) }
  }, [isOpen])

  const handleClose = () => {
    setClosing(true)
    setTimeout(() => { setVisible(false); setClosing(false); onClose() }, 350)
  }

  const filterDateIds = [
    'asset-prod-start', 'asset-prod-end',
    'asset-acq-start', 'asset-acq-end',
    'asset-expired-start', 'asset-expired-end'
  ]

  useEffect(() => {
    if (!visible) return
    const instances = []
    filterDateIds.forEach(id => {
      const el = document.getElementById(id)
      if (el) instances.push(flatpickr(el, {
        dateFormat: 'm/d/Y', allowInput: true, locale: { firstDayOfWeek: 0 }
      }))
    })
    return () => instances.forEach(fp => fp.destroy())
  }, [visible])

  if (!visible) return null

  return (
    <>
      <div className={`asset-filter-overlay active ${closing ? 'closing' : ''}`} onClick={handleClose} />
      <div
        className={`asset-filter-sidebar ${!closing ? 'active' : ''} ${closing ? 'closing' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="asset-filter-header"><h2>More Filters</h2></div>
        <div className="asset-filter-content">

          {[
            { label: 'Tag Number', placeholder: 'Search tag number...' },
            { label: 'Name', placeholder: 'Search name...' },
            { label: 'Type', placeholder: 'Search type...' },
            { label: 'Model', placeholder: 'Search model...' },
            { label: 'Capacity', placeholder: 'Search capacity...' },
            { label: 'Serial Number', placeholder: 'Search serial number...' },
            { label: 'Remarks', placeholder: 'Search remarks...' },
          ].map(({ label, placeholder }) => (
            <div className="asset-filter-section" key={label}>
              <label className="asset-filter-label">{label}</label>
              <input type="text" className="asset-filter-search-input" placeholder={placeholder} />
            </div>
          ))}

          <div className="asset-filter-section">
            <label className="asset-filter-label">Category</label>
            <select className="asset-filter-select"><option value="">No Options</option></select>
          </div>

          <div className="asset-filter-section">
            <label className="asset-filter-label">Criticality</label>
            <select className="asset-filter-select">
              <option value="">All</option>
              {['Low', 'Medium', 'High'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>

          <div className="asset-filter-section">
            <label className="asset-filter-label">Status</label>
            <select className="asset-filter-select">
              <option value="">All</option>
              {['Active', 'Inactive', 'Under Maintenance'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>

          <div className="asset-filter-section-title">More Informations</div>

          <div className="asset-filter-section">
            <label className="asset-filter-label">Manufacturer</label>
            <select className="asset-filter-select"><option value="">No Options</option></select>
          </div>

          {[
            { label: 'Production Year', start: 'asset-prod-start', end: 'asset-prod-end' },
            { label: 'Acquisition Year', start: 'asset-acq-start', end: 'asset-acq-end' },
            { label: 'Expired Date Silo', start: 'asset-expired-start', end: 'asset-expired-end' },
          ].map(({ label, start, end }) => (
            <div className="asset-filter-section" key={label}>
              <label className="asset-filter-label">{label}</label>
              <div className="asset-filter-date-range">
                <input type="text" placeholder="Start" className="asset-filter-date-input" id={start} />
                <span className="asset-date-separator">to</span>
                <input type="text" placeholder="End" className="asset-filter-date-input" id={end} />
              </div>
            </div>
          ))}

          <div className="asset-filter-footer">
            <button className="asset-filter-save-btn" onClick={handleClose}>Save</button>
          </div>
        </div>
      </div>
    </>
  )
}

// ===== Add Asset Modal =====
function AddAssetModal({ isOpen, onClose }) {
  const [animClass, setAnimClass] = useState('animating-in')
  const prodYearRef = useRef(null)
  const acqYearRef = useRef(null)
  const expiredRef = useRef(null)

  useEffect(() => {
    if (isOpen) setAnimClass('animating-in')
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const instances = []
    const config = { dateFormat: 'm/d/Y', allowInput: true, locale: { firstDayOfWeek: 0 } }
    if (prodYearRef.current) instances.push(flatpickr(prodYearRef.current, config))
    if (acqYearRef.current) instances.push(flatpickr(acqYearRef.current, config))
    if (expiredRef.current) instances.push(flatpickr(expiredRef.current, config))
    return () => instances.forEach(fp => fp.destroy())
  }, [isOpen])

  const handleClose = () => {
    setAnimClass('animating-out')
    setTimeout(() => { onClose(); setAnimClass('animating-in') }, 200)
  }

  if (!isOpen) return null

  return (
    <div className="add-asset-overlay active" onClick={handleClose}>
      <div className={`add-asset-modal ${animClass}`} onClick={e => e.stopPropagation()}>
        <div className="add-asset-header">
          <h2>Add Asset</h2>
          <p>Fill in the fields below to create and add a new asset</p>
        </div>

        <div className="add-asset-body">
          <div className="add-asset-section-title">Asset Information</div>

          <div className="add-asset-row">
            <div className="add-asset-field">
              <label className="add-asset-label">Tag Number *</label>
              <input type="text" className="add-asset-input" placeholder="Tag Number" />
            </div>
            <div className="add-asset-field">
              <label className="add-asset-label">Name</label>
              <input type="text" className="add-asset-input" placeholder="Name" />
            </div>
          </div>

          <div className="add-asset-row">
            <div className="add-asset-field">
              <label className="add-asset-label">Category</label>
              <select className="add-asset-select" defaultValue="">
                <option value="" disabled>Category</option>
                <option>No Options</option>
              </select>
            </div>
            <div className="add-asset-field">
              <label className="add-asset-label">Type</label>
              <input type="text" className="add-asset-input" placeholder="Type" />
            </div>
          </div>

          <div className="add-asset-row">
            <div className="add-asset-field">
              <label className="add-asset-label">Model</label>
              <input type="text" className="add-asset-input" placeholder="Model" />
            </div>
            <div className="add-asset-field">
              <label className="add-asset-label">Capacity</label>
              <input type="text" className="add-asset-input" placeholder="Capacity" />
            </div>
          </div>

          <div className="add-asset-row">
            <div className="add-asset-field">
              <label className="add-asset-label">Criticality</label>
              <select className="add-asset-select" defaultValue="">
                <option value="" disabled>Criticality</option>
                {['Low', 'Medium', 'High'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="add-asset-field">
              <label className="add-asset-label">Status</label>
              <select className="add-asset-select" defaultValue="">
                <option value="" disabled>Status</option>
                {['Active', 'Inactive', 'Under Maintenance'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>

          <div className="add-asset-section-title">More Informations</div>

          <div className="add-asset-row">
            <div className="add-asset-field">
              <label className="add-asset-label">Serial Number</label>
              <input type="text" className="add-asset-input" placeholder="Serial Number" />
            </div>
            <div className="add-asset-field">
              <label className="add-asset-label">Manufacturer</label>
              <select className="add-asset-select" defaultValue="">
                <option value="" disabled>Manufacturer</option>
                <option>No Options</option>
              </select>
            </div>
          </div>

          <div className="add-asset-row">
            <div className="add-asset-field">
              <label className="add-asset-label">Production Year</label>
              <input ref={prodYearRef} type="text" className="add-asset-input" placeholder="mm/dd/yyyy" />
            </div>
            <div className="add-asset-field">
              <label className="add-asset-label">Acquisition Year</label>
              <input ref={acqYearRef} type="text" className="add-asset-input" placeholder="mm/dd/yyyy" />
            </div>
          </div>

          <div className="add-asset-field">
            <label className="add-asset-label">Expired Date Silo</label>
            <input ref={expiredRef} type="text" className="add-asset-input" placeholder="mm/dd/yyyy" />
          </div>

          <div className="add-asset-field">
            <label className="add-asset-label">Remarks</label>
            <textarea className="add-asset-textarea" placeholder="Remarks" />
          </div>
        </div>

        <div className="add-asset-footer">
          <button className="add-asset-submit-btn" onClick={handleClose}>Add</button>
        </div>
      </div>
    </div>
  )
}

// ===== Main Assets Page =====
function Assets() {
  const [filterOpen, setFilterOpen] = useState(false)
  const [addAssetOpen, setAddAssetOpen] = useState(false)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const filterBtnRef = useRef(null)

  return (
    <>
      <div className="assets-wrapper">
        {/* Toolbar */}
        <div className="toolbar-section">
          <div className="asset-left-toolbar">
            <button
              ref={filterBtnRef}
              className={`asset-filter-btn ${filterOpen ? 'active' : ''}`}
              onClick={() => setFilterOpen(true)}
            >
              Filter
            </button>
            <div className="search-container">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input type="text" placeholder="Search" className="search-input" />
            </div>
          </div>
          <div className="toolbar-actions">
            <button className="refresh-button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </button>
            <button className="create-button" onClick={() => setAddAssetOpen(true)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Asset
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="table-container">
          <div className="table-scroll">
            <table className="assets-table">
              <thead>
                <tr>
                  <th>TAG</th><th>NAME</th><th>CATEGORY</th><th>TYPE</th>
                  <th>MODEL</th><th>CAPACITY</th><th>CRITICALITY</th>
                  <th>STATUS</th><th>EXPIRED DATE SILO</th><th>REMARKS</th>
                </tr>
              </thead>
              <tbody>
                <tr className="empty-row">
                  <td colSpan="10">
                    <div className="empty-state">
                      <p className="empty-title">Assets are resources on which your company can intervene</p>
                      <p className="empty-subtitle">Press the '+' button to create a new Asset.</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="table-footer"></div>
        </div>

        {/* Pagination */}
        <div className="pagination">
          <div className="pagination-info">
            <span>Rows per page:</span>
            <select className="rows-select" value={rowsPerPage} onChange={e => setRowsPerPage(e.target.value)}>
              {[10, 25, 50, 100].map(n => <option key={n}>{n}</option>)}
            </select>
            <span className="page-info">0-0 of 0</span>
          </div>
          <div className="pagination-controls-left">
            <button className="pagination-btn" disabled>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <button className="pagination-btn" disabled>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </div>
        </div>
      </div>

      <AssetFilterSidebar isOpen={filterOpen} onClose={() => setFilterOpen(false)} filterBtnRef={filterBtnRef} />
      <AddAssetModal isOpen={addAssetOpen} onClose={() => setAddAssetOpen(false)} />
    </>
  )
}

export default Assets
