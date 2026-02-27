import { useState, useEffect, useRef } from 'react'
import flatpickr from 'flatpickr'
import 'flatpickr/dist/flatpickr.min.css'
import './Assets.css'

const API = 'http://localhost:3000'

// ===== Filter Sidebar =====
function AssetFilterSidebar({ isOpen, onClose, onApply }) {
  const [visible, setVisible] = useState(false)
  const [closing, setClosing] = useState(false)
  const [categories, setCategories] = useState([])
  const [types, setTypes] = useState([])
  const [manufacturers, setManufacturers] = useState([])

  const [filters, setFilters] = useState({
    tag_number: '', asset_name: '', model: '', capacity: '',
    serial_number: '', asset_remarks: '', asset_category_id: '',
    asset_type_id: '', criticality: '', asset_status: '',
    asset_manufacturer_id: '',
    prod_start: '', prod_end: '', acq_start: '', acq_end: '',
    expired_start: '', expired_end: ''
  })

  const prodStartRef = useRef(null); const prodEndRef = useRef(null)
  const acqStartRef = useRef(null);  const acqEndRef = useRef(null)
  const expStartRef = useRef(null);  const expEndRef = useRef(null)
  const fpRefs = useRef([])

  useEffect(() => {
    if (isOpen) { setVisible(true); setClosing(false) }
  }, [isOpen])

  // Fetch categories & manufacturers saat sidebar dibuka
  useEffect(() => {
    if (!visible) return
    fetch(`${API}/api/asset-categories`).then(r => r.json()).then(setCategories).catch(console.error)
    fetch(`${API}/api/asset-manufacturers`).then(r => r.json()).then(setManufacturers).catch(console.error)
  }, [visible])

  // Fetch types saat category berubah
  useEffect(() => {
    if (!filters.asset_category_id) { setTypes([]); return }
    fetch(`${API}/api/asset-types/${filters.asset_category_id}`)
      .then(r => r.json()).then(setTypes).catch(console.error)
  }, [filters.asset_category_id])

  // Flatpickr untuk date inputs
  useEffect(() => {
    if (!visible) return
    fpRefs.current.forEach(fp => fp?.destroy())
    fpRefs.current = []
    const config = { dateFormat: 'Y-m-d', allowInput: true, locale: { firstDayOfWeek: 0 } }
    const pairs = [
      [prodStartRef, 'prod_start'], [prodEndRef, 'prod_end'],
      [acqStartRef, 'acq_start'],   [acqEndRef, 'acq_end'],
      [expStartRef, 'expired_start'], [expEndRef, 'expired_end']
    ]
    pairs.forEach(([ref, field]) => {
      if (ref.current) {
        fpRefs.current.push(flatpickr(ref.current, {
          ...config,
          onChange: ([date]) => setFilters(f => ({
            ...f, [field]: date ? date.toISOString().split('T')[0] : ''
          }))
        }))
      }
    })
    return () => fpRefs.current.forEach(fp => fp?.destroy())
  }, [visible])

  const setFilter = (field, value) => setFilters(f => ({ ...f, [field]: value }))

  const handleSave = () => {
    onApply(filters)
    handleClose()
  }

  const handleReset = () => {
    const empty = {
      tag_number: '', asset_name: '', model: '', capacity: '',
      serial_number: '', asset_remarks: '', asset_category_id: '',
      asset_type_id: '', criticality: '', asset_status: '',
      asset_manufacturer_id: '',
      prod_start: '', prod_end: '', acq_start: '', acq_end: '',
      expired_start: '', expired_end: ''
    }
    setFilters(empty)
    setTypes([])
    // Reset flatpickr
    fpRefs.current.forEach(fp => fp?.clear())
    onApply(empty)
    handleClose()
  }

  const handleClose = () => {
    setClosing(true)
    setTimeout(() => { setVisible(false); setClosing(false); onClose() }, 350)
  }

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

          {/* Text inputs */}
          {[
            { label: 'Tag Number', field: 'tag_number', placeholder: 'Search tag number...' },
            { label: 'Name', field: 'asset_name', placeholder: 'Search name...' },
            { label: 'Model', field: 'model', placeholder: 'Search model...' },
            { label: 'Capacity', field: 'capacity', placeholder: 'Search capacity...' },
            { label: 'Serial Number', field: 'serial_number', placeholder: 'Search serial number...' },
            { label: 'Remarks', field: 'asset_remarks', placeholder: 'Search remarks...' },
          ].map(({ label, field, placeholder }) => (
            <div className="asset-filter-section" key={field}>
              <label className="asset-filter-label">{label}</label>
              <input type="text" className="asset-filter-search-input" placeholder={placeholder}
                value={filters[field]} onChange={e => setFilter(field, e.target.value)} />
            </div>
          ))}

          {/* Category */}
          <div className="asset-filter-section">
            <label className="asset-filter-label">Category</label>
            <select className={`asset-filter-select${!filters.asset_category_id ? ' placeholder' : ''}`} value={filters.asset_category_id}
              onChange={e => { setFilter('asset_category_id', e.target.value); setFilter('asset_type_id', '') }}>
              <option value="">Search category...</option>
              {categories.map(c => (
                <option key={c.asset_category_id} value={c.asset_category_id}>{c.asset_category_name}</option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div className="asset-filter-section">
            <label className="asset-filter-label">Type</label>
            <select className={`asset-filter-select${!filters.asset_type_id ? ' placeholder' : ''}`} value={filters.asset_type_id}
              onChange={e => setFilter('asset_type_id', e.target.value)}
              disabled={!filters.asset_category_id}>
              <option value="">
                {!filters.asset_category_id ? 'Pilih Category dulu' : 'Search type...'}
              </option>
              {types.map(t => (
                <option key={t.asset_type_id} value={t.asset_type_id}>{t.asset_type_name}</option>
              ))}
            </select>
          </div>

          {/* Criticality */}
          <div className="asset-filter-section">
            <label className="asset-filter-label">Criticality</label>
            <select className={`asset-filter-select${!filters.criticality ? ' placeholder' : ''}`} value={filters.criticality}
              onChange={e => setFilter('criticality', e.target.value)}>
              <option value="">All</option>
              {['Low', 'Medium', 'High'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>

          {/* Status */}
          <div className="asset-filter-section">
            <label className="asset-filter-label">Status</label>
            <select className={`asset-filter-select${!filters.asset_status ? ' placeholder' : ''}`} value={filters.asset_status}
              onChange={e => setFilter('asset_status', e.target.value)}>
              <option value="">All</option>
              {['Standby', 'In Use', 'Under Maintenance', 'Disposed'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>

          <div className="asset-filter-section-title">More Informations</div>

          {/* Manufacturer */}
          <div className="asset-filter-section">
            <label className="asset-filter-label">Manufacturer</label>
            <select className={`asset-filter-select${!filters.asset_manufacturer_id ? ' placeholder' : ''}`} value={filters.asset_manufacturer_id}
              onChange={e => setFilter('asset_manufacturer_id', e.target.value)}>
              <option value="">Search manufacturer...</option>
              {manufacturers.map(m => (
                <option key={m.asset_manufacturer_id} value={m.asset_manufacturer_id}>{m.asset_manufacturer_name}</option>
              ))}
            </select>
          </div>

          {/* Date ranges */}
          {[
            { label: 'Production Year', startRef: prodStartRef, endRef: prodEndRef },
            { label: 'Acquisition Year', startRef: acqStartRef, endRef: acqEndRef },
            { label: 'Expired Date Silo', startRef: expStartRef, endRef: expEndRef },
          ].map(({ label, startRef, endRef }) => (
            <div className="asset-filter-section" key={label}>
              <label className="asset-filter-label">{label}</label>
              <div className="asset-filter-date-range">
                <input ref={startRef} type="text" placeholder="Start" className="asset-filter-date-input" />
                <span className="asset-date-separator">to</span>
                <input ref={endRef} type="text" placeholder="End" className="asset-filter-date-input" />
              </div>
            </div>
          ))}

          <div className="asset-filter-footer" style={{ display: 'flex', gap: '10px' }}>
            <button className="asset-filter-save-btn" onClick={handleSave}>Save</button>
            <button className="asset-filter-save-btn"
              style={{ backgroundColor: 'white', color: '#64748b', border: '1px solid #e2e8f0' }}
              onClick={handleReset}>Reset</button>
          </div>
        </div>
      </div>
    </>
  )
}

// ===== Add Asset Modal =====
function AddAssetModal({ isOpen, onClose, onSuccess }) {
  const [animClass, setAnimClass] = useState('animating-in')
  const [categories, setCategories] = useState([])
  const [types, setTypes] = useState([])
  const [manufacturers, setManufacturers] = useState([])
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [form, setForm] = useState({
    tag_number: '', asset_name: '', asset_type_id: '',
    asset_manufacturer_id: '', model: '', serial_number: '',
    production_year: '', acquisition_year: '', capacity: '',
    criticality: '', asset_status: '', expired_date_silo: '', asset_remarks: ''
  })
  const prodYearRef = useRef(null)
  const acqYearRef = useRef(null)
  const expiredRef = useRef(null)
  const prodFpRef = useRef(null)
  const acqFpRef = useRef(null)
  const expFpRef = useRef(null)

  // Fetch categories & manufacturers saat modal dibuka
  useEffect(() => {
    if (!isOpen) return
    setAnimClass('animating-in')
    setSelectedCategoryId('')
    setTypes([])
    setForm({
      tag_number: '', asset_name: '', asset_type_id: '',
      asset_manufacturer_id: '', model: '', serial_number: '',
      production_year: '', acquisition_year: '', capacity: '',
      criticality: '', asset_status: '', expired_date_silo: '', asset_remarks: ''
    })

    fetch(`${API}/api/asset-categories`)
      .then(r => r.json()).then(setCategories).catch(console.error)

    fetch(`${API}/api/asset-manufacturers`)
      .then(r => r.json()).then(setManufacturers).catch(console.error)
  }, [isOpen])

  // Fetch types saat category berubah
  useEffect(() => {
    if (!selectedCategoryId) { setTypes([]); return }
    fetch(`${API}/api/asset-types/${selectedCategoryId}`)
      .then(r => r.json()).then(setTypes).catch(console.error)
  }, [selectedCategoryId])

  // Flatpickr
  useEffect(() => {
    if (!isOpen) return
    const config = { dateFormat: 'Y-m-d', allowInput: true, locale: { firstDayOfWeek: 0 } }

    if (prodYearRef.current) {
      prodFpRef.current = flatpickr(prodYearRef.current, {
        ...config,
        onChange: ([date]) => setForm(f => ({ ...f, production_year: date ? date.toISOString().split('T')[0] : '' }))
      })
    }
    if (acqYearRef.current) {
      acqFpRef.current = flatpickr(acqYearRef.current, {
        ...config,
        onChange: ([date]) => setForm(f => ({ ...f, acquisition_year: date ? date.toISOString().split('T')[0] : '' }))
      })
    }
    if (expiredRef.current) {
      expFpRef.current = flatpickr(expiredRef.current, {
        ...config,
        onChange: ([date]) => setForm(f => ({ ...f, expired_date_silo: date ? date.toISOString().split('T')[0] : '' }))
      })
    }
    return () => {
      prodFpRef.current?.destroy()
      acqFpRef.current?.destroy()
      expFpRef.current?.destroy()
    }
  }, [isOpen])

  const handleChange = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const handleClose = () => {
    setAnimClass('animating-out')
    setTimeout(() => { onClose(); setAnimClass('animating-in') }, 200)
  }

  const handleSubmit = () => {
    // Validasi semua field wajib
    if (!form.tag_number) return alert('Tag Number wajib diisi!')
    if (!selectedCategoryId) return alert('Category wajib dipilih!')
    if (!form.asset_type_id) return alert('Type wajib dipilih!')
    if (!form.asset_name) return alert('Name wajib diisi!')
    if (!form.model) return alert('Model wajib diisi!')
    if (!form.serial_number) return alert('Serial Number wajib diisi!')
    if (!form.production_year) return alert('Production Year wajib diisi!')
    if (!form.acquisition_year) return alert('Acquisition Year wajib diisi!')
    if (!form.capacity) return alert('Capacity wajib diisi!')
    if (!form.criticality) return alert('Criticality wajib dipilih!')
    if (!form.asset_status) return alert('Status wajib dipilih!')
    if (!form.expired_date_silo) return alert('Expired Date Silo wajib diisi!')
    if (!form.asset_manufacturer_id) return alert('Manufacturer wajib dipilih!')

    fetch(`${API}/api/assets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
      .then(r => r.json())
      .then(data => {
        if (data.asset_id) {
          handleClose()
          onSuccess()
        } else {
          alert(data.message || 'Gagal menambahkan asset')
        }
      })
      .catch(err => alert('Gagal menambahkan asset: ' + err.message))
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
              <input type="text" className="add-asset-input" placeholder="Tag Number"
                value={form.tag_number} onChange={e => handleChange('tag_number', e.target.value)} />
            </div>
            <div className="add-asset-field">
              <label className="add-asset-label">Name</label>
              <input type="text" className="add-asset-input" placeholder="Name"
                value={form.asset_name} onChange={e => handleChange('asset_name', e.target.value)} />
            </div>
          </div>

          <div className="add-asset-row">
            <div className="add-asset-field">
              <label className="add-asset-label">Category</label>
              <select className={`add-asset-select${!selectedCategoryId ? ' placeholder' : ''}`} value={selectedCategoryId}
                onChange={e => {
                  setSelectedCategoryId(e.target.value)
                  handleChange('asset_type_id', '')
                }}>
                <option value="" disabled>Category</option>
                {categories.map(c => (
                  <option key={c.asset_category_id} value={c.asset_category_id}>
                    {c.asset_category_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="add-asset-field">
              <label className="add-asset-label">Type</label>
              <select className={`add-asset-select${!form.asset_type_id ? ' placeholder' : ''}`} value={form.asset_type_id}
                onChange={e => handleChange('asset_type_id', e.target.value)}
                disabled={!selectedCategoryId}>
                <option value="" disabled>
                  {!selectedCategoryId ? 'Pilih Category dulu' : 'Type'}
                </option>
                {types.map(t => (
                  <option key={t.asset_type_id} value={t.asset_type_id}>
                    {t.asset_type_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="add-asset-row">
            <div className="add-asset-field">
              <label className="add-asset-label">Model</label>
              <input type="text" className="add-asset-input" placeholder="Model"
                value={form.model} onChange={e => handleChange('model', e.target.value)} />
            </div>
            <div className="add-asset-field">
              <label className="add-asset-label">Capacity</label>
              <input type="text" className="add-asset-input" placeholder="Capacity"
                value={form.capacity} onChange={e => handleChange('capacity', e.target.value)} />
            </div>
          </div>

          <div className="add-asset-row">
            <div className="add-asset-field">
              <label className="add-asset-label">Criticality</label>
              <select className={`add-asset-select${!form.criticality ? ' placeholder' : ''}`} value={form.criticality}
                onChange={e => handleChange('criticality', e.target.value)}>
                <option value="" disabled>Criticality</option>
                {['Low', 'Medium', 'High'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="add-asset-field">
              <label className="add-asset-label">Status</label>
              <select className={`add-asset-select${!form.asset_status ? ' placeholder' : ''}`} value={form.asset_status}
                onChange={e => handleChange('asset_status', e.target.value)}>
                <option value="" disabled>Status</option>
                {['Standby', 'In Use', 'Under Maintenance', 'Disposed'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>

          <div className="add-asset-section-title">More Informations</div>

          <div className="add-asset-row">
            <div className="add-asset-field">
              <label className="add-asset-label">Serial Number</label>
              <input type="text" className="add-asset-input" placeholder="Serial Number"
                value={form.serial_number} onChange={e => handleChange('serial_number', e.target.value)} />
            </div>
            <div className="add-asset-field">
              <label className="add-asset-label">Manufacturer</label>
              <select className={`add-asset-select${!form.asset_manufacturer_id ? ' placeholder' : ''}`} value={form.asset_manufacturer_id}
                onChange={e => handleChange('asset_manufacturer_id', e.target.value)}>
                <option value="" disabled>Manufacturer</option>
                {manufacturers.map(m => (
                  <option key={m.asset_manufacturer_id} value={m.asset_manufacturer_id}>
                    {m.asset_manufacturer_name}
                  </option>
                ))}
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
            <textarea className="add-asset-textarea" placeholder="Remarks"
              value={form.asset_remarks} onChange={e => handleChange('asset_remarks', e.target.value)} />
          </div>
        </div>

        <div className="add-asset-footer">
          <button className="add-asset-submit-btn" onClick={handleSubmit}>Add</button>
        </div>
      </div>
    </div>
  )
}

// ===== Main Assets Page =====
function Assets() {
  const [filterOpen, setFilterOpen] = useState(false)
  const [addAssetOpen, setAddAssetOpen] = useState(false)
  const [assets, setAssets] = useState([])
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const filterBtnRef = useRef(null)

  const fetchAssets = (filters = {}) => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== '' && val !== null && val !== undefined) params.append(key, val)
    })
    const query = params.toString() ? `?${params.toString()}` : ''
    fetch(`${API}/api/assets${query}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setAssets(data)
        else setAssets([])
      })
      .catch(() => setAssets([]))
  }

  useEffect(() => { fetchAssets() }, [])

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
            <button className="refresh-button" onClick={fetchAssets}>
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
                  <th>TAG</th><th>STATUS</th><th>NAME</th><th>CATEGORY</th><th>TYPE</th>
                  <th>MODEL</th><th>CAPACITY</th><th>CRITICALITY</th>
                  <th>EXPIRED DATE SILO</th><th>REMARKS</th>
                </tr>
              </thead>
              <tbody>
                {assets.length === 0 ? (
                  <tr className="empty-row">
                    <td colSpan="10">
                      <div className="empty-state">
                        <p className="empty-title">Assets are resources on which your company can intervene</p>
                        <p className="empty-subtitle">Press the '+' button to create a new Asset.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  assets.map(a => {
                    // Format date: ambil hanya bagian tanggal (YYYY-MM-DD)
                    const expiredDate = a.expired_date_silo
                      ? new Date(a.expired_date_silo).toISOString().split('T')[0]
                      : '-'

                    // Truncate teks lebih dari 27 karakter
                    const truncate = (text) => {
                      if (!text) return '-'
                      return text.length > 27 ? text.slice(0, 27) + '...' : text
                    }

                    return (
                      <tr key={a.asset_id}>
                        <td>{a.tag_number}</td>
                        <td>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: 'white',
                            textTransform: 'uppercase',
                            backgroundColor:
                              a.asset_status === 'Standby' ? '#22c55e' :
                              a.asset_status === 'In Use' ? '#3b82f6' :
                              a.asset_status === 'Under Maintenance' ? '#eab308' :
                              a.asset_status === 'Disposed' ? '#ef4444' : '#94a3b8'
                          }}>
                            {a.asset_status}
                          </span>
                        </td>
                        <td><strong>{a.asset_name}</strong></td>
                        <td>{a.category}</td>
                        <td>{a.type}</td>
                        <td>{a.model}</td>
                        <td>{truncate(String(a.capacity ?? ''))}</td>
                        <td>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: 'white',
                            textTransform: 'uppercase',
                            backgroundColor:
                              a.criticality === 'Low' ? '#22c55e' :
                              a.criticality === 'Medium' ? '#eab308' :
                              a.criticality === 'High' ? '#ef4444' : '#94a3b8'
                          }}>
                            {a.criticality}
                          </span>
                        </td>
                        <td>{expiredDate}</td>
                        <td>{truncate(a.asset_remarks)}</td>
                      </tr>
                    )
                  })
                )}
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
            <span className="page-info">0-0 of {assets.length}</span>
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

      <AssetFilterSidebar isOpen={filterOpen} onClose={() => setFilterOpen(false)} onApply={fetchAssets} />
      <AddAssetModal
        isOpen={addAssetOpen}
        onClose={() => setAddAssetOpen(false)}
        onSuccess={fetchAssets}
      />
    </>
  )
}

export default Assets
