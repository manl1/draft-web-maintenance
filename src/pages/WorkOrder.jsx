import { useState, useEffect, useRef } from 'react'
import flatpickr from 'flatpickr'
import 'flatpickr/dist/flatpickr.min.css'
import './WorkOrder.css'

// ===== Priority Modal =====
function PriorityModal({ isOpen, onClose, anchorRef, priority, onChange }) {
  const [pos, setPos] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (isOpen && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + 8, left: rect.left })
    }
  }, [isOpen])

  if (!isOpen) return null

  const options = ['None', 'Low', 'Medium', 'High']

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div
        className="modal-content priority-modal animating-in"
        style={{ position: 'fixed', top: pos.top, left: pos.left }}
        onClick={e => e.stopPropagation()}
      >
        {options.map(opt => (
          <div className="priority-option" key={opt}>
            <input
              type="checkbox"
              id={`priority-${opt.toLowerCase()}`}
              className="priority-checkbox"
              checked={priority.includes(opt)}
              onChange={() => onChange(opt)}
            />
            <label htmlFor={`priority-${opt.toLowerCase()}`}>{opt}</label>
          </div>
        ))}
      </div>
    </div>
  )
}

// ===== Status Modal =====
function StatusModal({ isOpen, onClose, anchorRef, status, onChange }) {
  const [pos, setPos] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (isOpen && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + 8, left: rect.left })
    }
  }, [isOpen])

  if (!isOpen) return null

  const options = ['Open', 'In Progress', 'On Hold', 'Complete']

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div
        className="modal-content status-modal animating-in"
        style={{ position: 'fixed', top: pos.top, left: pos.left }}
        onClick={e => e.stopPropagation()}
      >
        {options.map(opt => (
          <div className="status-option" key={opt}>
            <input
              type="checkbox"
              id={`status-${opt.toLowerCase().replace(' ', '-')}`}
              className="status-checkbox"
              checked={status.includes(opt)}
              onChange={() => onChange(opt)}
            />
            <label htmlFor={`status-${opt.toLowerCase().replace(' ', '-')}`}>{opt}</label>
          </div>
        ))}
      </div>
    </div>
  )
}

// ===== Filter Sidebar =====
function FilterSidebar({ isOpen, onClose }) {
  const [visible, setVisible] = useState(false)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (isOpen) { setVisible(true); setClosing(false) }
  }, [isOpen])

  const handleClose = () => {
    setClosing(true)
    setTimeout(() => { setVisible(false); setClosing(false); onClose() }, 350)
  }

  const dateIds = [
    'date-created-start', 'date-created-end',
    'completed-on-start', 'completed-on-end',
    'updated-at-start', 'updated-at-end'
  ]

  useEffect(() => {
    if (!visible) return
    const instances = []
    dateIds.forEach(id => {
      const el = document.getElementById(id)
      if (el) instances.push(flatpickr(el, {
        dateFormat: 'm/d/Y', showMonths: 2,
        allowInput: true, locale: { firstDayOfWeek: 0 }
      }))
    })
    return () => instances.forEach(fp => fp.destroy())
  }, [visible])

  if (!visible) return null

  return (
    <>
      <div className={`filter-overlay active ${closing ? 'closing' : ''}`} onClick={handleClose} />
      <div
        className={`filter-sidebar ${!closing ? 'active' : ''} ${closing ? 'closing' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="filter-header"><h2>More Filters</h2></div>
        <div className="filter-content">
          {['Type','Category','Team','Created By','Completed By','Primary Worker','Additional Workers','Contractor'].map(label => (
            <div className="filter-section" key={label}>
              <label className="filter-label">{label}</label>
              <select className="filter-select"><option value="">No Options</option></select>
            </div>
          ))}
          {['Asset','Location'].map(label => (
            <div className="filter-section" key={label}>
              <label className="filter-label">{label}</label>
              <div className="filter-search">
                <input type="text" placeholder={`Search ${label.toLowerCase()}...`} className="filter-search-input" />
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
              </div>
            </div>
          ))}
          <div className="filter-section">
            <label className="filter-checkbox-label">
              <input type="checkbox" className="filter-checkbox" /><span>Archived</span>
            </label>
          </div>
          <div className="filter-section-title">Dates</div>
          {[
            { label: 'Date created:', start: 'date-created-start', end: 'date-created-end' },
            { label: 'Completed On:', start: 'completed-on-start', end: 'completed-on-end' },
            { label: 'Updated At:', start: 'updated-at-start', end: 'updated-at-end' },
          ].map(({ label, start, end }) => (
            <div className="filter-section" key={label}>
              <label className="filter-label">{label}</label>
              <div className="filter-date-range">
                <input type="text" placeholder="Start" className="filter-date-input" id={start} />
                <span className="date-separator">to</span>
                <input type="text" placeholder="End" className="filter-date-input" id={end} />
              </div>
            </div>
          ))}
          <div className="filter-footer">
            <button className="filter-save-btn" onClick={handleClose}>Save</button>
          </div>
        </div>
      </div>
    </>
  )
}

// ===== Add Work Order Modal =====
function AddWorkOrderModal({ isOpen, onClose }) {
  const [animClass, setAnimClass] = useState('animating-in')
  const [fileName, setFileName] = useState('Drag a unique file here')
  const fileInputRef = useRef(null)
  const dueDateRef = useRef(null)
  const startDateRef = useRef(null)

  useEffect(() => {
    if (isOpen) setAnimClass('animating-in')
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const instances = []
    if (dueDateRef.current) instances.push(flatpickr(dueDateRef.current, {
      enableTime: true, dateFormat: 'm/d/Y H:i',
      allowInput: true, time_24hr: true, locale: { firstDayOfWeek: 0 }
    }))
    if (startDateRef.current) instances.push(flatpickr(startDateRef.current, {
      enableTime: true, dateFormat: 'm/d/Y H:i',
      allowInput: true, time_24hr: true, locale: { firstDayOfWeek: 0 }
    }))
    return () => instances.forEach(fp => fp.destroy())
  }, [isOpen])

  const handleClose = () => {
    setAnimClass('animating-out')
    setTimeout(() => { onClose(); setAnimClass('animating-in') }, 200)
  }

  if (!isOpen) return null

  const selectFields = [
    { label: 'Priority', options: ['None', 'Low', 'Medium', 'High'] },
    { label: 'Category', options: [] },
    { label: 'Primary Worker', options: [] },
    { label: 'Additional Workers', options: [] },
    { label: 'Contractors', options: [] },
    { label: 'Team', options: [] },
    { label: 'Asset Status', options: [] },
  ]

  return (
    <div className="add-wo-overlay active" onClick={handleClose}>
      <div className={`add-wo-modal ${animClass}`} onClick={e => e.stopPropagation()}>
        <div className="add-wo-header">
          <h2>Add Work Order</h2>
          <p>Fill in the fields below to create and add a new Work Order</p>
        </div>
        <div className="add-wo-body">
          <div className="add-wo-field">
            <label className="add-wo-label">Title *</label>
            <input type="text" className="add-wo-input" placeholder="Title *" />
          </div>
          <div className="add-wo-field">
            <label className="add-wo-label">Description</label>
            <textarea className="add-wo-textarea" placeholder="Description" />
          </div>
          <div className="add-wo-field">
            <div className="add-wo-image-section">
              <div className="add-wo-image-header">
                <span className="add-wo-image-title">Image</span>
                <span className="add-wo-image-subtitle">Upload</span>
              </div>
              <div
                className="add-wo-dropzone"
                onClick={() => fileInputRef.current.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault()
                  const file = e.dataTransfer.files[0]
                  if (file) setFileName(file.name)
                }}
              >
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <polyline points="16 16 12 12 8 16" />
                  <line x1="12" y1="12" x2="12" y2="21" />
                  <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                </svg>
                <p>{fileName}</p>
                <input ref={fileInputRef} type="file" accept="image/*" hidden
                  onChange={e => { if (e.target.files[0]) setFileName(e.target.files[0].name) }} />
              </div>
            </div>
          </div>
          <div className="add-wo-field">
            <label className="add-wo-label">Due Date:</label>
            <input ref={dueDateRef} type="text" className="add-wo-input add-wo-datetime" placeholder="mm/dd/yyyy hh:mm" />
          </div>
          <div className="add-wo-field">
            <label className="add-wo-label">Expected start date:</label>
            <input ref={startDateRef} type="text" className="add-wo-input add-wo-datetime" placeholder="mm/dd/yyyy hh:mm" />
          </div>
          <div className="add-wo-field">
            <label className="add-wo-label">Estimated Duration in Hours</label>
            <input type="text" className="add-wo-input" placeholder="Estimated Duration in Hours" />
          </div>
          {selectFields.map(({ label, options }) => (
            <div className="add-wo-field" key={label}>
              <label className="add-wo-label">{label}</label>
              <select className="add-wo-select" defaultValue="">
                <option value="" disabled>{label}</option>
                {options.length > 0 ? options.map(o => <option key={o}>{o}</option>) : <option value="">No Options</option>}
              </select>
            </div>
          ))}
          {['Location', 'Asset'].map(label => (
            <div className="add-wo-field add-wo-search-field" key={label}>
              <label className="add-wo-label">{label}</label>
              <input type="text" className="add-wo-input" placeholder={label} />
              <svg className="add-wo-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
            </div>
          ))}
        </div>
        <div className="add-wo-footer">
          <button className="add-wo-submit-btn" onClick={handleClose}>Add</button>
        </div>
      </div>
    </div>
  )
}

// ===== Main WorkOrder Page =====
function WorkOrder() {
  const [activeTab, setActiveTab] = useState('list')
  const [priorityOpen, setPriorityOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [addWoOpen, setAddWoOpen] = useState(false)
  const [selectedPriority, setSelectedPriority] = useState([])
  const [selectedStatus, setSelectedStatus] = useState([])
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const priorityBtnRef = useRef(null)
  const statusBtnRef = useRef(null)

  const togglePriority = val => setSelectedPriority(prev =>
    prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val])
  const toggleStatus = val => setSelectedStatus(prev =>
    prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val])

  return (
    <>
      <div className="wo-wrapper">
        {/* Toolbar */}
        <div className="toolbar">
          <div className="view-tabs">
            <button className={`tab-button ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}>List View</button>
            <button className={`tab-button ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>Calendar View</button>
          </div>
          <div className="toolbar-actions">
            <button className="create-button" onClick={() => { setPriorityOpen(false); setStatusOpen(false); setAddWoOpen(true) }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Work Order
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="filters-bar">
          <div className="filter-buttons">
            <button className={`filter-btn ${filterOpen ? 'active' : ''}`} onClick={() => { setPriorityOpen(false); setStatusOpen(false); setFilterOpen(true) }}>Filter</button>
            <button ref={priorityBtnRef} className={`filter-btn ${priorityOpen ? 'active' : ''}`} onClick={() => { setStatusOpen(false); setPriorityOpen(p => !p) }}>
              Priority {selectedPriority.length > 0 && `(${selectedPriority.length})`}
            </button>
            <button ref={statusBtnRef} className={`filter-btn ${statusOpen ? 'active' : ''}`} onClick={() => { setPriorityOpen(false); setStatusOpen(p => !p) }}>
              Status {selectedStatus.length > 0 && `(${selectedStatus.length})`}
            </button>
          </div>
          <div className="search-bar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input type="text" placeholder="Search" />
          </div>
        </div>

        {/* Table */}
        <div className="table-container">
          <table className="work-order-table">
            <thead>
              <tr>
                <th>ID</th><th>STATUS</th><th>TITLE</th><th>PRIORITY</th><th>DESCRIPTION</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
          <div className="empty-state">
            <p className="empty-title">Work Orders are tasks or jobs, that can be scheduled or assigned to someone</p>
            <p className="empty-subtitle">Press the '+' button to create a Work Order</p>
          </div>
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
          <div className="pagination-controls">
            <button className="pagination-btn" disabled>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <button className="pagination-btn" disabled>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </div>
        </div>
      </div>

      <PriorityModal isOpen={priorityOpen} onClose={() => setPriorityOpen(false)} anchorRef={priorityBtnRef} priority={selectedPriority} onChange={togglePriority} />
      <StatusModal isOpen={statusOpen} onClose={() => setStatusOpen(false)} anchorRef={statusBtnRef} status={selectedStatus} onChange={toggleStatus} />
      <FilterSidebar isOpen={filterOpen} onClose={() => setFilterOpen(false)} />
      <AddWorkOrderModal isOpen={addWoOpen} onClose={() => setAddWoOpen(false)} />
    </>
  )
}

export default WorkOrder
