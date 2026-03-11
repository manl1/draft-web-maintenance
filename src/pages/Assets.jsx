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

  // Fetch types when category changes
  useEffect(() => {
    if (!filters.asset_category_id) { setTypes([]); return }
    fetch(`${API}/api/asset-types/${filters.asset_category_id}`)
      .then(r => r.json()).then(setTypes).catch(console.error)
  }, [filters.asset_category_id])

  // Flatpickr for date inputs
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
                {!filters.asset_category_id ? 'Select a category first' : 'Search type...'}
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

  // Fetch categories & manufacturers when modal opens
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

  // Fetch types when category changes
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
    // Validate required fields
    if (!form.tag_number) return alert('Tag Number is required!')
    if (!selectedCategoryId) return alert('Category is required!')
    if (!form.asset_type_id) return alert('Type is required!')
    if (!form.asset_name) return alert('Name is required!')
    if (!form.model) return alert('Model is required!')
    if (!form.serial_number) return alert('Serial Number is required!')
    if (!form.production_year) return alert('Production Year is required!')
    if (!form.acquisition_year) return alert('Acquisition Year is required!')
    if (!form.capacity) return alert('Capacity is required!')
    if (!form.criticality) return alert('Criticality is required!')
    if (!form.asset_status) return alert('Status is required!')
    if (!form.expired_date_silo) return alert('Expired Date Silo is required!')
    if (!form.asset_manufacturer_id) return alert('Manufacturer is required!')

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
          alert(data.message || 'Failed to add asset')
        }
      })
      .catch(err => alert('Failed to add asset: ' + err.message))
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
                  {!selectedCategoryId ? 'Select a category first' : 'Type'}
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

// ===== Asset Detail Panel =====
function AssetDetailPanel({ asset, onClose, onEdit, onDelete }) {
  const [visible, setVisible] = useState(false)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (asset) { setVisible(true); setClosing(false) }
  }, [asset])

  const handleClose = () => {
    setClosing(true)
    setTimeout(() => { setVisible(false); setClosing(false); onClose() }, 350)
  }

  if (!visible || !asset) return null

  const formatDate = (d) => d ? new Date(d).toISOString().split('T')[0] : '-'

  const statusColor =
    asset.asset_status === 'Standby' ? '#22c55e' :
    asset.asset_status === 'In Use' ? '#3b82f6' :
    asset.asset_status === 'Under Maintenance' ? '#eab308' :
    asset.asset_status === 'Disposed' ? '#ef4444' : '#94a3b8'

  const critColor =
    asset.criticality === 'Low' ? '#22c55e' :
    asset.criticality === 'Medium' ? '#eab308' :
    asset.criticality === 'High' ? '#ef4444' : '#94a3b8'

  return (
    <>
      <div className={`asset-detail-overlay active ${closing ? 'closing' : ''}`} onClick={handleClose} />
      <div className={`asset-detail-panel ${!closing ? 'active' : ''} ${closing ? 'closing' : ''}`}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="asset-detail-header">
          <div className="asset-detail-title-area">
            <h2 className="asset-detail-name">{asset.asset_name}</h2>
            <p className="asset-detail-tag">{asset.tag_number}</p>
          </div>
          <div className="asset-detail-actions">
            <button className="asset-detail-edit-btn" onClick={() => { handleClose(); onEdit(asset) }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button className="asset-detail-delete-btn" onClick={() => { handleClose(); onDelete(asset) }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="asset-detail-body">

          {/* Status & Criticality badges */}
          <div className="asset-detail-badges">
            <span style={{ backgroundColor: statusColor }} className="asset-detail-badge">
              {asset.asset_status}
            </span>
            <span style={{ backgroundColor: critColor }} className="asset-detail-badge">
              {asset.criticality}
            </span>
          </div>

          {/* Asset Information */}
          <div className="asset-detail-section-title">Asset Information</div>
          <div className="asset-detail-grid">
            <div className="asset-detail-field">
              <span className="asset-detail-label">Tag Number</span>
              <span className="asset-detail-value">{asset.tag_number || '-'}</span>
            </div>
            <div className="asset-detail-field">
              <span className="asset-detail-label">Name</span>
              <span className="asset-detail-value">{asset.asset_name || '-'}</span>
            </div>
            <div className="asset-detail-field">
              <span className="asset-detail-label">Category</span>
              <span className="asset-detail-value">{asset.category || '-'}</span>
            </div>
            <div className="asset-detail-field">
              <span className="asset-detail-label">Type</span>
              <span className="asset-detail-value">{asset.type || '-'}</span>
            </div>
            <div className="asset-detail-field">
              <span className="asset-detail-label">Model</span>
              <span className="asset-detail-value">{asset.model || '-'}</span>
            </div>
            <div className="asset-detail-field">
              <span className="asset-detail-label">Capacity</span>
              <span className="asset-detail-value">{asset.capacity || '-'}</span>
            </div>
          </div>

          {/* More Information */}
          <div className="asset-detail-section-title">More Information</div>
          <div className="asset-detail-grid">
            <div className="asset-detail-field">
              <span className="asset-detail-label">Serial Number</span>
              <span className="asset-detail-value">{asset.serial_number || '-'}</span>
            </div>
            <div className="asset-detail-field">
              <span className="asset-detail-label">Manufacturer</span>
              <span className="asset-detail-value">{asset.manufacturer || '-'}</span>
            </div>
            <div className="asset-detail-field">
              <span className="asset-detail-label">Production Year</span>
              <span className="asset-detail-value">{formatDate(asset.production_year)}</span>
            </div>
            <div className="asset-detail-field">
              <span className="asset-detail-label">Acquisition Year</span>
              <span className="asset-detail-value">{formatDate(asset.acquisition_year)}</span>
            </div>
            <div className="asset-detail-field">
              <span className="asset-detail-label">Expired Date Silo</span>
              <span className="asset-detail-value">{formatDate(asset.expired_date_silo)}</span>
            </div>
            <div className="asset-detail-field asset-detail-field--full">
              <span className="asset-detail-label">Remarks</span>
              <span className="asset-detail-value">{asset.asset_remarks || '-'}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ===== Edit Asset Modal =====
function EditAssetModal({ isOpen, asset, onClose, onSuccess }) {
  const [animClass, setAnimClass] = useState('animating-in')
  const [categories, setCategories] = useState([])
  const [types, setTypes] = useState([])
  const [manufacturers, setManufacturers] = useState([])
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [form, setForm] = useState({})
  const prodYearRef = useRef(null); const acqYearRef = useRef(null); const expiredRef = useRef(null)
  const prodFpRef = useRef(null);   const acqFpRef = useRef(null);   const expFpRef = useRef(null)

  useEffect(() => {
    if (!isOpen || !asset) return
    setAnimClass('animating-in')

    setForm({
      tag_number: asset.tag_number || '',
      asset_name: asset.asset_name || '',
      asset_type_id: asset.asset_type_id ? String(asset.asset_type_id) : '',
      asset_manufacturer_id: asset.asset_manufacturer_id ? String(asset.asset_manufacturer_id) : '',
      model: asset.model || '',
      serial_number: asset.serial_number || '',
      production_year: asset.production_year ? new Date(asset.production_year).toISOString().split('T')[0] : '',
      acquisition_year: asset.acquisition_year ? new Date(asset.acquisition_year).toISOString().split('T')[0] : '',
      capacity: asset.capacity || '',
      criticality: asset.criticality || '',
      asset_status: asset.asset_status || '',
      expired_date_silo: asset.expired_date_silo ? new Date(asset.expired_date_silo).toISOString().split('T')[0] : '',
      asset_remarks: asset.asset_remarks || ''
    })

    // Set category directly from data (asset_category_id already present from query)
    if (asset.asset_category_id) setSelectedCategoryId(String(asset.asset_category_id))

    fetch(`${API}/api/asset-categories`).then(r => r.json()).then(setCategories).catch(console.error)
    fetch(`${API}/api/asset-manufacturers`).then(r => r.json()).then(setManufacturers).catch(console.error)
  }, [isOpen, asset])

  // Fetch types when selectedCategoryId changes
  useEffect(() => {
    if (!selectedCategoryId) { setTypes([]); return }
    fetch(`${API}/api/asset-types/${selectedCategoryId}`)
      .then(r => r.json()).then(setTypes).catch(console.error)
  }, [selectedCategoryId])

  useEffect(() => {
    if (!isOpen) return
    const config = { dateFormat: 'Y-m-d', allowInput: true }
    if (prodYearRef.current) {
      prodFpRef.current = flatpickr(prodYearRef.current, { ...config,
        defaultDate: form.production_year || null,
        onChange: ([d]) => setForm(f => ({ ...f, production_year: d ? d.toISOString().split('T')[0] : '' }))
      })
    }
    if (acqYearRef.current) {
      acqFpRef.current = flatpickr(acqYearRef.current, { ...config,
        defaultDate: form.acquisition_year || null,
        onChange: ([d]) => setForm(f => ({ ...f, acquisition_year: d ? d.toISOString().split('T')[0] : '' }))
      })
    }
    if (expiredRef.current) {
      expFpRef.current = flatpickr(expiredRef.current, { ...config,
        defaultDate: form.expired_date_silo || null,
        onChange: ([d]) => setForm(f => ({ ...f, expired_date_silo: d ? d.toISOString().split('T')[0] : '' }))
      })
    }
    return () => { prodFpRef.current?.destroy(); acqFpRef.current?.destroy(); expFpRef.current?.destroy() }
  }, [isOpen])

  const handleChange = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const handleClose = () => {
    setAnimClass('animating-out')
    setTimeout(() => { onClose(); setAnimClass('animating-in') }, 200)
  }

  const handleSubmit = () => {
    if (!form.tag_number) return alert('Tag Number is required!')
    if (!form.asset_type_id) return alert('Type is required!')
    if (!form.asset_name) return alert('Name is required!')
    if (!form.asset_manufacturer_id) return alert('Manufacturer is required!')

    fetch(`${API}/api/assets/${asset.asset_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
      .then(r => r.json())
      .then(data => {
        if (data.message?.includes('successfully')) { handleClose(); onSuccess() }
        else alert(data.message || 'Failed to update asset')
      })
      .catch(err => alert('Error: ' + err.message))
  }

  if (!isOpen) return null

  return (
    <div className="add-asset-overlay active" onClick={handleClose}>
      <div className={`add-asset-modal ${animClass}`} onClick={e => e.stopPropagation()}>
        <div className="add-asset-header">
          <h2>Edit Asset</h2>
          <p>Update the fields below to edit this asset</p>
        </div>
        <div className="add-asset-body">
          <div className="add-asset-section-title">Asset Information</div>
          <div className="add-asset-row">
            <div className="add-asset-field">
              <label className="add-asset-label">Tag Number *</label>
              <input type="text" className="add-asset-input" placeholder="Tag Number"
                value={form.tag_number || ''} onChange={e => handleChange('tag_number', e.target.value)} />
            </div>
            <div className="add-asset-field">
              <label className="add-asset-label">Name</label>
              <input type="text" className="add-asset-input" placeholder="Name"
                value={form.asset_name || ''} onChange={e => handleChange('asset_name', e.target.value)} />
            </div>
          </div>
          <div className="add-asset-row">
            <div className="add-asset-field">
              <label className="add-asset-label">Category</label>
              <select className={`add-asset-select${!selectedCategoryId ? ' placeholder' : ''}`}
                value={selectedCategoryId}
                onChange={e => { setSelectedCategoryId(e.target.value); handleChange('asset_type_id', '') }}>
                <option value="" disabled>Category</option>
                {categories.map(c => <option key={c.asset_category_id} value={c.asset_category_id}>{c.asset_category_name}</option>)}
              </select>
            </div>
            <div className="add-asset-field">
              <label className="add-asset-label">Type</label>
              <select className={`add-asset-select${!form.asset_type_id ? ' placeholder' : ''}`}
                value={form.asset_type_id || ''}
                onChange={e => handleChange('asset_type_id', e.target.value)}
                disabled={!selectedCategoryId}>
                <option value="" disabled>{!selectedCategoryId ? 'Select a category first' : 'Type'}</option>
                {types.map(t => <option key={t.asset_type_id} value={t.asset_type_id}>{t.asset_type_name}</option>)}
              </select>
            </div>
          </div>
          <div className="add-asset-row">
            <div className="add-asset-field">
              <label className="add-asset-label">Model</label>
              <input type="text" className="add-asset-input" placeholder="Model"
                value={form.model || ''} onChange={e => handleChange('model', e.target.value)} />
            </div>
            <div className="add-asset-field">
              <label className="add-asset-label">Capacity</label>
              <input type="text" className="add-asset-input" placeholder="Capacity"
                value={form.capacity || ''} onChange={e => handleChange('capacity', e.target.value)} />
            </div>
          </div>
          <div className="add-asset-row">
            <div className="add-asset-field">
              <label className="add-asset-label">Criticality</label>
              <select className={`add-asset-select${!form.criticality ? ' placeholder' : ''}`}
                value={form.criticality || ''} onChange={e => handleChange('criticality', e.target.value)}>
                <option value="" disabled>Criticality</option>
                {['Low', 'Medium', 'High'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="add-asset-field">
              <label className="add-asset-label">Status</label>
              <select className={`add-asset-select${!form.asset_status ? ' placeholder' : ''}`}
                value={form.asset_status || ''} onChange={e => handleChange('asset_status', e.target.value)}>
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
                value={form.serial_number || ''} onChange={e => handleChange('serial_number', e.target.value)} />
            </div>
            <div className="add-asset-field">
              <label className="add-asset-label">Manufacturer</label>
              <select className={`add-asset-select${!form.asset_manufacturer_id ? ' placeholder' : ''}`}
                value={form.asset_manufacturer_id || ''} onChange={e => handleChange('asset_manufacturer_id', e.target.value)}>
                <option value="" disabled>Manufacturer</option>
                {manufacturers.map(m => <option key={m.asset_manufacturer_id} value={m.asset_manufacturer_id}>{m.asset_manufacturer_name}</option>)}
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
              value={form.asset_remarks || ''} onChange={e => handleChange('asset_remarks', e.target.value)} />
          </div>
        </div>
        <div className="add-asset-footer">
          <button className="add-asset-submit-btn" onClick={handleSubmit}>Edit</button>
        </div>
      </div>
    </div>
  )
}

// ===== Delete Confirm Modal =====
function DeleteConfirmModal({ isOpen, asset, onClose, onSuccess }) {
  const [animClass, setAnimClass] = useState('animating-in')

  useEffect(() => { if (isOpen) setAnimClass('animating-in') }, [isOpen])

  const handleClose = () => {
    setAnimClass('animating-out')
    setTimeout(() => { onClose(); setAnimClass('animating-in') }, 200)
  }

  const handleDelete = () => {
    fetch(`${API}/api/assets/${asset.asset_id}`, { method: 'DELETE' })
      .then(r => r.json())
      .then(() => { handleClose(); onSuccess() })
      .catch(err => alert('Failed to delete: ' + err.message))
  }

  if (!isOpen) return null

  return (
    <div className="add-asset-overlay active" onClick={handleClose}>
      <div className={`asset-delete-modal ${animClass}`} onClick={e => e.stopPropagation()}>
        <div className="asset-delete-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </div>
        <h3 className="asset-delete-title">Delete Asset?</h3>
        <p className="asset-delete-desc">
          Are you sure you want to delete <strong>{asset?.asset_name}</strong>?
          This action cannot be undone.
        </p>
        <div className="asset-delete-actions">
          <button className="asset-delete-cancel-btn" onClick={handleClose}>Cancel</button>
          <button className="asset-delete-confirm-btn" onClick={handleDelete}>Delete</button>
        </div>
      </div>
    </div>
  )
}
function Assets() {
  const [filterOpen, setFilterOpen] = useState(false)
  const [addAssetOpen, setAddAssetOpen] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [editAsset, setEditAsset] = useState(null)
  const [deleteAsset, setDeleteAsset] = useState(null)
  const [assets, setAssets] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState(null) // null | 'asc' | 'desc'
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const filterBtnRef = useRef(null)
  const scrollRef = useRef(null)

  const [loading, setLoading] = useState(false)

  const fetchAssets = (filters = {}) => {
    setLoading(true)
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== '' && val !== null && val !== undefined) params.append(key, val)
    })
    const query = params.toString() ? `?${params.toString()}` : ''
    const fetchStart = Date.now()
    fetch(`${API}/api/assets${query}`)
      .then(r => r.json())
      .then(data => {
        const elapsed = Date.now() - fetchStart
        const minDuration = 400 
        const remaining = Math.max(0, minDuration - elapsed)
        setTimeout(() => {
          if (Array.isArray(data)) setAssets(data)
          else setAssets([])
          setLoading(false)
        }, remaining)
      })
      .catch(() => {
        setAssets([])
        setLoading(false)
      })
  }

  useEffect(() => { fetchAssets() }, [])

  // Filter assets by search query (frontend only)
  const getTagNum = (tag) => {
    const match = String(tag || '').match(/(\d+)$/)
    return match ? parseInt(match[1], 10) : 0
  }

  const filteredAssets = searchQuery.trim()
    ? assets.filter(a => a.asset_name?.toLowerCase().includes(searchQuery.toLowerCase()))
    : assets

  const displayedAssets = sortOrder
    ? [...filteredAssets].sort((a, b) =>
        sortOrder === 'asc'
          ? getTagNum(a.tag_number) - getTagNum(b.tag_number)
          : getTagNum(b.tag_number) - getTagNum(a.tag_number)
      )
    : filteredAssets

  const toggleSort = () => setSortOrder(prev => prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc')

  // Highlight text matching the search query
  const highlightText = (text, query) => {
    if (!query.trim() || !text) return <strong>{text}</strong>
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    return (
      <strong>
        {parts.map((part, i) =>
          regex.test(part)
            ? <mark key={i} style={{ backgroundColor: '#fde68a', color: '#92400e', borderRadius: '2px', padding: '0 1px' }}>{part}</mark>
            : part
        )}
      </strong>
    )
  }

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
              <input type="text" placeholder="Search" className="search-input"
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
          </div>
          <div className="toolbar-actions">
            <button className="refresh-button" onClick={fetchAssets}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }}>
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
          <div className="table-scroll" ref={scrollRef}>
            <table className="assets-table">
              <thead>
                <tr>
                  <th style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }} onClick={toggleSort}>
                    TAG
                    <span style={{ display: 'inline-flex', flexDirection: 'column', marginLeft: '6px', verticalAlign: 'middle', gap: '2px' }}>
                      <svg width="8" height="6" viewBox="0 0 8 6" fill={sortOrder === 'asc' ? '#6366f1' : '#cbd5e1'}>
                        <path d="M4 0L8 6H0L4 0Z"/>
                      </svg>
                      <svg width="8" height="6" viewBox="0 0 8 6" fill={sortOrder === 'desc' ? '#6366f1' : '#cbd5e1'}>
                        <path d="M4 6L0 0H8L4 6Z"/>
                      </svg>
                    </span>
                  </th><th>STATUS</th><th>NAME</th><th>CATEGORY</th><th>TYPE</th>
                  <th>MODEL</th><th>CAPACITY</th><th>CRITICALITY</th>
                  <th>EXPIRED DATE SILO</th><th>REMARKS</th>
                </tr>
              </thead>
              <tbody>
                {displayedAssets.length === 0 ? (
                  <tr className="empty-row">
                    <td colSpan="10">
                      <div className="empty-state">
                        <p className="empty-title">Assets are resources on which your company can intervene</p>
                        <p className="empty-subtitle">Press the '+' button to create a new Asset.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedAssets.map(a => {
                    // Format date: extract date part only (YYYY-MM-DD)
                    const expiredDate = a.expired_date_silo
                      ? new Date(a.expired_date_silo).toISOString().split('T')[0]
                      : '-'

                    // Truncate text longer than 27 characters
                    const truncate = (text) => {
                      if (!text) return '-'
                      return text.length > 27 ? text.slice(0, 27) + '...' : text
                    }

                    return (
                      <tr key={a.asset_id} onClick={() => setSelectedAsset(a)}
                        style={{ cursor: 'pointer' }}>
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
                        <td>{highlightText(a.asset_name, searchQuery)}</td>
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

      </div>

      <AssetFilterSidebar isOpen={filterOpen} onClose={() => setFilterOpen(false)} onApply={fetchAssets} />
      <AddAssetModal isOpen={addAssetOpen} onClose={() => setAddAssetOpen(false)} onSuccess={fetchAssets} />
      <AssetDetailPanel
        asset={selectedAsset}
        onClose={() => setSelectedAsset(null)}
        onEdit={a => setEditAsset(a)}
        onDelete={a => setDeleteAsset(a)}
      />
      <EditAssetModal
        isOpen={!!editAsset}
        asset={editAsset}
        onClose={() => setEditAsset(null)}
        onSuccess={fetchAssets}
      />
      <DeleteConfirmModal
        isOpen={!!deleteAsset}
        asset={deleteAsset}
        onClose={() => setDeleteAsset(null)}
        onSuccess={fetchAssets}
      />
    </>
  )
}

export default Assets
