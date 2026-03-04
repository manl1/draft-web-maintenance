import { useState, useEffect, useRef } from 'react'
import flatpickr from 'flatpickr'
import 'flatpickr/dist/flatpickr.min.css'
import './Locations.css'

const API = 'http://localhost:3000'

// ===== Add Location Modal =====
function AddLocationModal({ isOpen, onClose, onSuccess }) {
  const [animClass, setAnimClass] = useState('animating-in')
  const startDateRef = useRef(null)
  const endDateRef = useRef(null)
  const startFpRef = useRef(null)
  const endFpRef = useRef(null)

  const [cities, setCities] = useState([])
  const [sites, setSites] = useState([])
  const [areas, setAreas] = useState([])
  const [assets, setAssets] = useState([])
  const [assetWarning, setAssetWarning] = useState(null) // { location, project_code }

  const [form, setForm] = useState({
    city: '', site: '', area: '', location_id: '',
    asset_id: '', asset_status: '', project_code: '',
    asset_condition: '', start_date: '', end_date: ''
  })

  useEffect(() => {
    if (!isOpen) return
    setAnimClass('animating-in')
    setForm({ city: '', site: '', area: '', location_id: '', asset_id: '', asset_status: '', project_code: '', asset_condition: '', start_date: '', end_date: '' })
    setSites([])
    setAreas([])
    setAssetWarning(null)
    fetch(`${API}/api/locations/cities`).then(r => r.json()).then(setCities).catch(console.error)
    fetch(`${API}/api/assets`).then(r => r.json()).then(data => { if (Array.isArray(data)) setAssets(data) }).catch(console.error)
  }, [isOpen])

  useEffect(() => {
    if (!form.city) { setSites([]); setAreas([]); return }
    fetch(`${API}/api/locations/sites/${encodeURIComponent(form.city)}`).then(r => r.json()).then(setSites).catch(console.error)
    setForm(f => ({ ...f, site: '', area: '', location_id: '' }))
    setAreas([])
  }, [form.city])

  useEffect(() => {
    if (!form.city || !form.site) { setAreas([]); return }
    fetch(`${API}/api/locations/areas/${encodeURIComponent(form.city)}/${encodeURIComponent(form.site)}`).then(r => r.json()).then(setAreas).catch(console.error)
    setForm(f => ({ ...f, area: '', location_id: '' }))
  }, [form.site])

  const handleAreaChange = (area) => {
    const found = areas.find(a => a.area === area)
    setForm(f => ({ ...f, area, location_id: found ? found.location_id : '' }))
  }

  useEffect(() => {
    if (!isOpen) return
    const config = { dateFormat: 'Y-m-d', allowInput: true }
    if (startDateRef.current) startFpRef.current = flatpickr(startDateRef.current, { ...config, onChange: ([d]) => setForm(f => ({ ...f, start_date: d ? d.toISOString().split('T')[0] : '' })) })
    if (endDateRef.current) endFpRef.current = flatpickr(endDateRef.current, { ...config, onChange: ([d]) => setForm(f => ({ ...f, end_date: d ? d.toISOString().split('T')[0] : '' })) })
    return () => { startFpRef.current?.destroy(); endFpRef.current?.destroy() }
  }, [isOpen])

  const setField = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const handleAssetChange = (asset_id) => {
    setField('asset_id', asset_id)
    setAssetWarning(null)
    if (!asset_id) return
    // Check if asset is currently active at another location
    fetch(`${API}/api/locations/check-asset/${asset_id}`)
      .then(r => r.json())
      .then(data => {
        if (data.conflict) {
          setAssetWarning({ location: data.active_location, project_code: data.project_code })
        }
      })
      .catch(() => {})
  }

  const handleClose = () => {
    setAnimClass('animating-out')
    setTimeout(() => { onClose(); setAnimClass('animating-in') }, 200)
  }

  const handleSubmit = () => {
    if (!form.city) return alert('Please select a location!')
    if (!form.asset_id) return alert('Please select an asset!')
    if (!form.project_code) return alert('Project Code is required!')
    if (assetWarning) return alert(`Asset is currently in use at ${assetWarning.location}. Please complete the existing assignment first.`)
    fetch(`${API}/api/locations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
      .then(r => r.json())
      .then(data => {
        if (data.message?.includes('successfully')) { handleClose(); onSuccess() }
        else alert(data.message || 'Failed to add location')
      })
      .catch(err => alert('Error: ' + err.message))
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
            <select className={`add-loc-select${!form.city ? ' placeholder' : ''}`} value={form.city} onChange={e => setField('city', e.target.value)}>
              <option value="" disabled>Location</option>
              {cities.map(c => <option key={c.city} value={c.city}>{c.city}</option>)}
            </select>
          </div>
          <div className="add-loc-field">
            <label className="add-loc-label">Site</label>
            <select className={`add-loc-select${!form.site ? ' placeholder' : ''}`} value={form.site} onChange={e => setField('site', e.target.value)} disabled={!form.city}>
              <option value="" disabled>{!form.city ? 'Select a location first' : 'Site'}</option>
              {sites.map(s => <option key={s.site} value={s.site}>{s.site}</option>)}
            </select>
          </div>
          <div className="add-loc-field">
            <label className="add-loc-label">Area</label>
            <select className={`add-loc-select${!form.area ? ' placeholder' : ''}`} value={form.area} onChange={e => handleAreaChange(e.target.value)} disabled={!form.site}>
              <option value="" disabled>{!form.site ? 'Select a site first' : 'Area'}</option>
              {areas.map(a => <option key={a.area} value={a.area}>{a.area}</option>)}
            </select>
          </div>
          <div className="add-loc-field">
            <label className="add-loc-label">Asset</label>
            <select className={`add-loc-select${!form.asset_id ? ' placeholder' : ''}`} value={form.asset_id} onChange={e => handleAssetChange(e.target.value)}>
              <option value="" disabled>Asset</option>
              {assets.map(a => <option key={a.asset_id} value={a.asset_id}>{a.asset_name}</option>)}
            </select>
            {assetWarning && (
              <div style={{ marginTop: '8px', padding: '10px 14px', backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" style={{ flexShrink: 0, marginTop: '1px' }}>
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <div>
                  <p style={{ margin: '0 0 2px 0', fontSize: '13px', fontWeight: '600', color: '#9a3412' }}>Asset Already In Use</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#c2410c', lineHeight: '1.5' }}>
                    This asset is currently active at <strong>{assetWarning.location}</strong> (Project: <strong>{assetWarning.project_code}</strong>). It cannot be assigned to another location.
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="add-loc-field">
            <label className="add-loc-label">Status</label>
            <select className={`add-loc-select${!form.asset_status ? ' placeholder' : ''}`} value={form.asset_status} onChange={e => setField('asset_status', e.target.value)}>
              <option value="" disabled>Status</option>
              {['Standby', 'In Use', 'Under Maintenance', 'Disposed'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="add-loc-field">
            <label className="add-loc-label">Project Code</label>
            <input type="text" className="add-loc-input" placeholder="Project Code" value={form.project_code} onChange={e => setField('project_code', e.target.value)} />
          </div>
          <div className="add-loc-field">
            <label className="add-loc-label">Condition</label>
            <select className={`add-loc-select${!form.asset_condition ? ' placeholder' : ''}`} value={form.asset_condition} onChange={e => setField('asset_condition', e.target.value)}>
              <option value="" disabled>Condition</option>
              {['Good', 'Minor Issue', 'Major Issue', 'Not Operable'].map(o => <option key={o}>{o}</option>)}
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
          <button className="add-loc-submit-btn" onClick={handleSubmit}>Add</button>
        </div>
      </div>
    </div>
  )
}

// ===== SlideDown animation wrapper =====
function SlideDown({ open, children }) {
  const ref = useRef(null)
  const initialized = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Skip very first render — just show state
    if (!initialized.current) {
      initialized.current = true
      el.style.height = open ? 'auto' : '0px'
      el.style.overflow = 'hidden'
      return
    }

    if (open) {
      el.style.height = '0px'
      el.style.overflow = 'hidden'
      requestAnimationFrame(() => {
        const h = el.scrollHeight
        el.style.transition = 'height 0.3s ease'
        el.style.height = `${h}px`
        const onEnd = () => {
          el.style.height = 'auto'
          el.style.transition = ''
          el.removeEventListener('transitionend', onEnd)
        }
        el.addEventListener('transitionend', onEnd)
      })
    } else {
      const h = el.scrollHeight
      el.style.height = `${h}px`
      el.style.overflow = 'hidden'
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.transition = 'height 0.3s ease'
          el.style.height = '0px'
          const onEnd = () => {
            el.style.transition = ''
            el.removeEventListener('transitionend', onEnd)
          }
          el.addEventListener('transitionend', onEnd)
        })
      })
    }
  }, [open])

  return (
    <div ref={ref} style={{ overflow: 'hidden', width: '100%' }}>
      {children}
    </div>
  )
}


// ===== Location Detail Panel =====
function LocationDetailPanel({ movement, onClose, onEdit, onDelete, onComplete }) {
  const [visible, setVisible] = useState(false)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (movement) { setVisible(true); setClosing(false) }
  }, [movement])

  const handleClose = () => {
    setClosing(true)
    setTimeout(() => { setVisible(false); setClosing(false); onClose() }, 350)
  }

  if (!visible || !movement) return null

  const formatDate = (d) => d ? new Date(d).toISOString().split('T')[0] : '-'

  const statusColor = (s) =>
    s === 'Standby' ? '#22c55e' : s === 'In Use' ? '#3b82f6' :
    s === 'Under Maintenance' ? '#eab308' : s === 'Disposed' ? '#ef4444' : '#94a3b8'

  const conditionColor = (c) =>
    c === 'Good' ? '#22c55e' : c === 'Minor Issue' ? '#eab308' :
    c === 'Major Issue' ? '#f97316' : c === 'Not Operable' ? '#ef4444' : '#94a3b8'

  return (
    <>
      <div className={`loc-panel-overlay active ${closing ? 'closing' : ''}`} onClick={handleClose} />
      <div className={`loc-detail-panel ${!closing ? 'active' : ''} ${closing ? 'closing' : ''}`}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="asset-detail-header">
          <div className="asset-detail-title-area">
            <h2 className="asset-detail-name">{movement.asset_name}</h2>
            <p className="asset-detail-tag">{movement.location_city} › {movement.location_site} › {movement.location_area}</p>
          </div>
          <div className="asset-detail-actions">
            <button className="asset-detail-edit-btn" title="Edit" onClick={() => { handleClose(); onEdit(movement) }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button className="asset-detail-delete-btn" title="Delete" onClick={() => { handleClose(); onDelete(movement) }}>
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

          {/* Status & Condition badges */}
          <div className="asset-detail-badges">
            <span style={{ backgroundColor: statusColor(movement.asset_status) }} className="asset-detail-badge">
              {movement.asset_status || '-'}
            </span>
            <span style={{ backgroundColor: conditionColor(movement.asset_condition) }} className="asset-detail-badge">
              {movement.asset_condition || '-'}
            </span>
          </div>

          {/* Location Info */}
          <div className="asset-detail-section-title">Location</div>
          <div className="asset-detail-grid">
            <div className="asset-detail-field">
              <span className="asset-detail-label">City</span>
              <span className="asset-detail-value">{movement.location_city || '-'}</span>
            </div>
            <div className="asset-detail-field">
              <span className="asset-detail-label">Site</span>
              <span className="asset-detail-value">{movement.location_site || '-'}</span>
            </div>
            <div className="asset-detail-field asset-detail-field--full">
              <span className="asset-detail-label">Area</span>
              <span className="asset-detail-value">{movement.location_area || '-'}</span>
            </div>
          </div>

          {/* Project Info */}
          <div className="asset-detail-section-title">Project</div>
          <div className="asset-detail-grid">
            <div className="asset-detail-field asset-detail-field--full">
              <span className="asset-detail-label">Project Code</span>
              <span className="asset-detail-value">{movement.project_code || '-'}</span>
            </div>
            <div className="asset-detail-field">
              <span className="asset-detail-label">Start Date</span>
              <span className="asset-detail-value">{formatDate(movement.start_date)}</span>
            </div>
            <div className="asset-detail-field">
              <span className="asset-detail-label">End Date</span>
              <span className="asset-detail-value">{formatDate(movement.end_date)}</span>
            </div>
          </div>

          {/* Complete Section */}
          <div className="loc-complete-section">
            <div className="loc-complete-info">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <div>
                <p className="loc-complete-title">Mark as Complete</p>
                <p className="loc-complete-desc">The asset will be released from this location and its status will change to Standby.</p>
              </div>
            </div>
            <button className="loc-complete-btn" onClick={() => { handleClose(); onComplete(movement) }}>
              Complete
            </button>
          </div>

        </div>
      </div>
    </>
  )
}

// ===== Edit Movement Modal =====
function EditMovementModal({ isOpen, movement, onClose, onSuccess }) {
  const [animClass, setAnimClass] = useState('animating-in')
  const [cities, setCities] = useState([])
  const [sites, setSites] = useState([])
  const [areas, setAreas] = useState([])
  const [form, setForm] = useState({})
  const startRef = useRef(null)
  const endRef = useRef(null)
  const startFp = useRef(null)
  const endFp = useRef(null)

  useEffect(() => {
    if (!isOpen || !movement) return
    setAnimClass('animating-in')
    setForm({
      city: movement.location_city || '',
      site: movement.location_site || '',
      area: movement.location_area || '',
      location_id: movement.location_id || '',
      project_code: movement.project_code || '',
      asset_condition: movement.asset_condition || '',
      asset_status: movement.asset_status || '',
      start_date: movement.start_date ? new Date(movement.start_date).toISOString().split('T')[0] : '',
      end_date: movement.end_date ? new Date(movement.end_date).toISOString().split('T')[0] : '',
    })
    fetch(`${API}/api/locations/cities`).then(r => r.json()).then(setCities).catch(console.error)
  }, [isOpen, movement])

  useEffect(() => {
    if (!form.city) { setSites([]); return }
    fetch(`${API}/api/locations/sites/${encodeURIComponent(form.city)}`).then(r => r.json()).then(setSites)
  }, [form.city])

  useEffect(() => {
    if (!form.city || !form.site) { setAreas([]); return }
    fetch(`${API}/api/locations/areas/${encodeURIComponent(form.city)}/${encodeURIComponent(form.site)}`).then(r => r.json()).then(setAreas)
  }, [form.site])

  useEffect(() => {
    if (!isOpen) return
    const cfg = { dateFormat: 'Y-m-d', allowInput: true }
    if (startRef.current) startFp.current = flatpickr(startRef.current, { ...cfg, defaultDate: form.start_date, onChange: ([d]) => setForm(f => ({ ...f, start_date: d ? d.toISOString().split('T')[0] : '' })) })
    if (endRef.current) endFp.current = flatpickr(endRef.current, { ...cfg, defaultDate: form.end_date, onChange: ([d]) => setForm(f => ({ ...f, end_date: d ? d.toISOString().split('T')[0] : '' })) })
    return () => { startFp.current?.destroy(); endFp.current?.destroy() }
  }, [isOpen])

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const handleAreaChange = (area) => {
    const found = areas.find(a => a.area === area)
    setForm(f => ({ ...f, area, location_id: found ? found.location_id : '' }))
  }
  const handleClose = () => {
    setAnimClass('animating-out')
    setTimeout(() => { onClose(); setAnimClass('animating-in') }, 200)
  }
  const handleSubmit = () => {
    if (!form.project_code) return alert('Project Code is required!')
    fetch(`${API}/api/locations/${movement.asset_movement_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
      .then(r => r.json())
      .then(data => {
        if (data.message?.includes('successfully')) { handleClose(); onSuccess() }
        else alert(data.message || 'Something went wrong')
      })
      .catch(err => alert('Error: ' + err.message))
  }

  if (!isOpen) return null
  return (
    <div className="add-loc-overlay active" onClick={handleClose}>
      <div className={`add-loc-modal ${animClass}`} onClick={e => e.stopPropagation()}>
        <div className="add-loc-header">
          <h2>Edit Asset Movement</h2>
          <p>Edit the location, project, or dates for this asset</p>
        </div>
        <div className="add-loc-body">
          <div className="add-loc-field"><label className="add-loc-label">Asset</label>
            <input className="add-loc-input" value={movement?.asset_name || ''} disabled style={{ backgroundColor: '#f8fafc', color: '#94a3b8' }} />
          </div>
          <div className="add-loc-field"><label className="add-loc-label">City</label>
            <select className={`add-loc-select${!form.city ? ' placeholder' : ''}`} value={form.city} onChange={e => setField('city', e.target.value)}>
              <option value="" disabled>City</option>
              {cities.map(c => <option key={c.city} value={c.city}>{c.city}</option>)}
            </select>
          </div>
          <div className="add-loc-field"><label className="add-loc-label">Site</label>
            <select className={`add-loc-select${!form.site ? ' placeholder' : ''}`} value={form.site} onChange={e => setField('site', e.target.value)} disabled={!form.city}>
              <option value="" disabled>{!form.city ? 'Select a city first' : 'Site'}</option>
              {sites.map(s => <option key={s.site} value={s.site}>{s.site}</option>)}
            </select>
          </div>
          <div className="add-loc-field"><label className="add-loc-label">Area</label>
            <select className={`add-loc-select${!form.area ? ' placeholder' : ''}`} value={form.area} onChange={e => handleAreaChange(e.target.value)} disabled={!form.site}>
              <option value="" disabled>{!form.site ? 'Select a site first' : 'Area'}</option>
              {areas.map(a => <option key={a.area} value={a.area}>{a.area}</option>)}
            </select>
          </div>
          <div className="add-loc-field"><label className="add-loc-label">Status</label>
            <select className={`add-loc-select${!form.asset_status ? ' placeholder' : ''}`} value={form.asset_status} onChange={e => setField('asset_status', e.target.value)}>
              <option value="" disabled>Status</option>
              {['In Use','Under Maintenance','Disposed'].map(o => <option key={o}>{o}</option>)}
            </select>
            <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
              To change the status to Standby, use the <strong>Complete</strong> button on the asset detail.
            </p>
          </div>
          <div className="add-loc-field"><label className="add-loc-label">Project Code</label>
            <input type="text" className="add-loc-input" placeholder="Project Code" value={form.project_code} onChange={e => setField('project_code', e.target.value)} />
          </div>
          <div className="add-loc-field"><label className="add-loc-label">Condition</label>
            <select className={`add-loc-select${!form.asset_condition ? ' placeholder' : ''}`} value={form.asset_condition} onChange={e => setField('asset_condition', e.target.value)}>
              <option value="" disabled>Condition</option>
              {['Good','Minor Issue','Major Issue','Not Operable'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="add-loc-row">
            <div className="add-loc-field"><label className="add-loc-label">Start Date</label>
              <input ref={startRef} type="text" className="add-loc-input" placeholder="yyyy-mm-dd" />
            </div>
            <div className="add-loc-field"><label className="add-loc-label">End Date</label>
              <input ref={endRef} type="text" className="add-loc-input" placeholder="yyyy-mm-dd" />
            </div>
          </div>
        </div>
        <div className="add-loc-footer"><button className="add-loc-submit-btn" onClick={handleSubmit}>Save</button></div>
      </div>
    </div>
  )
}

// ===== Delete Movement Modal =====
function DeleteMovementModal({ isOpen, movement, onClose, onSuccess }) {
  const [animClass, setAnimClass] = useState('animating-in')
  useEffect(() => { if (isOpen) setAnimClass('animating-in') }, [isOpen])
  const handleClose = () => { setAnimClass('animating-out'); setTimeout(() => { onClose(); setAnimClass('animating-in') }, 200) }
  const handleDelete = () => {
    fetch(`${API}/api/locations/${movement.asset_movement_id}`, { method: 'DELETE' })
      .then(r => r.json())
      .then(() => { handleClose(); onSuccess() })
      .catch(err => alert('Error: ' + err.message))
  }
  if (!isOpen) return null
  return (
    <div className="add-loc-overlay active" onClick={handleClose}>
      <div className={`asset-delete-modal ${animClass}`} onClick={e => e.stopPropagation()}>
        <div className="asset-delete-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </div>
        <h3 className="asset-delete-title">Delete Asset Movement?</h3>
        <p className="asset-delete-desc">Delete movement record for <strong>{movement?.asset_name}</strong>? The asset will remain in the database.</p>
        <div className="asset-delete-actions">
          <button className="asset-delete-cancel-btn" onClick={handleClose}>Cancel</button>
          <button className="asset-delete-confirm-btn" onClick={handleDelete}>Delete</button>
        </div>
      </div>
    </div>
  )
}

// ===== Complete Confirm Modal =====
function CompleteConfirmModal({ isOpen, movement, onClose, onSuccess }) {
  const [animClass, setAnimClass] = useState('animating-in')
  useEffect(() => { if (isOpen) setAnimClass('animating-in') }, [isOpen])
  const handleClose = () => { setAnimClass('animating-out'); setTimeout(() => { onClose(); setAnimClass('animating-in') }, 200) }
  const handleComplete = () => {
    fetch(`${API}/api/locations/${movement.asset_movement_id}/complete`, { method: 'PUT' })
      .then(r => r.json())
      .then(data => {
        if (data.message?.includes('successfully')) { handleClose(); onSuccess() }
        else alert(data.message || 'Something went wrong')
      })
      .catch(err => alert('Error: ' + err.message))
  }
  if (!isOpen) return null
  return (
    <div className="add-loc-overlay active" onClick={handleClose}>
      <div className={`asset-delete-modal ${animClass}`} onClick={e => e.stopPropagation()}>
        <div className="asset-delete-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <h3 className="asset-delete-title">Mark as Complete?</h3>
        <p className="asset-delete-desc">
          Asset <strong>{movement?.asset_name}</strong> will be marked as complete for project <strong>{movement?.project_code}</strong>.
          Asset status will change to <strong>Standby</strong>.
        </p>
        <div className="asset-delete-actions">
          <button className="asset-delete-cancel-btn" onClick={handleClose}>Cancel</button>
          <button className="asset-delete-confirm-btn" style={{ backgroundColor: '#6366f1' }} onClick={handleComplete}>Complete</button>
        </div>
      </div>
    </div>
  )
}

// ===== Main Locations Page =====
function Locations() {
  const [searchQuery, setSearchQuery] = useState('')
  const [addLocOpen, setAddLocOpen] = useState(false)
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(false)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [collapsed, setCollapsed] = useState({})
  const [isReady, setIsReady] = useState(false)
  const [selectedMovement, setSelectedMovement] = useState(null)
  const [editMovement, setEditMovement] = useState(null)
  const [deleteMovement, setDeleteMovement] = useState(null)
  const [completeMovement, setCompleteMovement] = useState(null)
  const fetchLocations = () => {
    setIsReady(false)
    setLoading(true)
    const fetchStart = Date.now()
    fetch(`${API}/api/locations`)
      .then(r => r.json())
      .then(data => {
        const elapsed = Date.now() - fetchStart
        const minDuration = 400 // show data at half animation duration
        const remaining = Math.max(0, minDuration - elapsed)
        setTimeout(() => {
          if (Array.isArray(data)) {
            const initCollapsed = {}
            const seen = new Set()
            data.forEach(loc => {
              const city = loc.location_city
              const site = loc.location_site || ''
              const area = loc.location_area || ''
              if (!city) return
              const ck = 'city:' + city
              const sk = 'site:' + city + ':' + site
              const ak = 'area:' + city + ':' + site + ':' + area
              if (!seen.has(ck)) { seen.add(ck); initCollapsed[ck] = true }
              if (site && !seen.has(sk)) { seen.add(sk); initCollapsed[sk] = true }
              if (area && !seen.has(ak)) { seen.add(ak); initCollapsed[ak] = true }
            })
            setCollapsed(initCollapsed)
            setLocations(data)
          } else {
            setLocations([])
          }
          setLoading(false)
          setTimeout(() => setIsReady(true), 50)
        }, remaining)
      })
      .catch(() => { setLocations([]); setLoading(false); setIsReady(true) })
  }

  useEffect(() => { fetchLocations() }, [])

  const formatDate = (d) => d ? new Date(d).toISOString().split('T')[0] : '-'

  const statusColor = (s) =>
    s === 'Standby' ? '#22c55e' : s === 'In Use' ? '#3b82f6' :
    s === 'Under Maintenance' ? '#eab308' : s === 'Disposed' ? '#ef4444' : '#94a3b8'

  const conditionColor = (c) =>
    c === 'Good' ? '#22c55e' : c === 'Minor Issue' ? '#eab308' :
    c === 'Major Issue' ? '#f97316' : c === 'Not Operable' ? '#ef4444' : '#94a3b8'

  const buildTree = (data) => {
    const tree = {}
    data.forEach(loc => {
      const city = loc.location_city
      const site = loc.location_site || ''
      const area = loc.location_area || ''
      if (!city) return
      if (!tree[city]) tree[city] = {}
      if (!tree[city][site]) tree[city][site] = {}
      if (!tree[city][site][area]) tree[city][site][area] = []
      // Push tiap asset dengan info lokasi
      if (loc.assets && loc.assets.length > 0) {
        loc.assets.forEach(a => {
          tree[city][site][area].push({
            ...a,
            location_city: city,
            location_site: site,
            location_area: area,
            location_id: loc.location_id
          })
        })
      }
    })
    return tree
  }

  const tree = buildTree(locations)

  // Default all nodes collapsed — prevents flash on first render
  const allKeys = {}
  Object.entries(tree).forEach(([city, sites]) => {
    allKeys['city:' + city] = true
    Object.entries(sites).forEach(([site, areas]) => {
      allKeys['site:' + city + ':' + site] = true
      Object.keys(areas).forEach(area => {
        allKeys['area:' + city + ':' + site + ':' + area] = true
      })
    })
  })
  const effectiveCollapsed = { ...allKeys, ...collapsed }
  const toggleCollapse = (key) => {
    setCollapsed(prev => {
      const isNowCollapsed = !prev[key]
      const next = { ...prev, [key]: isNowCollapsed }
      if (isNowCollapsed) {
        // Set semua descendant ke collapsed agar saat expand lagi mulai dari awal
        if (key.startsWith('city:')) {
          const cityName = key.slice(5)
          const sites = tree[cityName] || {}
          Object.keys(sites).forEach(site => {
            next['site:' + cityName + ':' + site] = true
            Object.keys(sites[site] || {}).forEach(area => {
              next['area:' + cityName + ':' + site + ':' + area] = true
            })
          })
        } else if (key.startsWith('site:')) {
          const parts = key.slice(5).split(':')
          const areas = (tree[parts[0]] || {})[parts[1]] || {}
          Object.keys(areas).forEach(area => {
            next['area:' + parts[0] + ':' + parts[1] + ':' + area] = true
          })
        }
      }
      return next
    })
  }
  const isOpen = (key) => !effectiveCollapsed[key]

  // Arrow: L-shape sudut 90°, rotate saat expand
  const Arrow = ({ open }) => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
      stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      style={{ transition: 'transform 0.3s ease', transform: open ? 'rotate(90deg)' : 'rotate(0deg)', flexShrink: 0 }}>
      <polyline points="2,1 2,9 11,9" />
      <polyline points="8,6.5 11,9 8,11.5" />
    </svg>
  )

  const Badge = ({ text, color }) => (
    <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: 'white', textTransform: 'uppercase', backgroundColor: color }}>
      {text || '-'}
    </span>
  )

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

  const renderTree = () => {
    if (locations.length === 0) return (
      <div className="empty-state">
        <p className="empty-title">Locations let you manage assets and workers more efficiently</p>
        <p className="empty-subtitle">Press the '+' button to add a new Location</p>
      </div>
    )

    const q = searchQuery.trim().toLowerCase()
    const isSearching = q.length > 0

    return Object.entries(tree).map(([city, sites]) => {
      // While searching: filter only city/site/area that have matching assets
      // Not searching: show ALL city/site/area even if empty
      let filteredSites = {}
      if (isSearching) {
        Object.entries(sites).forEach(([site, areas]) => {
          const filteredAreas = {}
          Object.entries(areas).forEach(([area, areaRows]) => {
            const matched = areaRows.filter(r => r.asset_name?.toLowerCase().includes(q))
            if (matched.length > 0) filteredAreas[area] = matched
          })
          if (Object.keys(filteredAreas).length > 0) filteredSites[site] = filteredAreas
        })
        if (Object.keys(filteredSites).length === 0) return null
      } else {
        // Show all sites & areas as-is (including empty ones)
        filteredSites = sites
      }

      const cityKey = `city:${city}`
      const cityOpen = isSearching ? true : isOpen(cityKey)

      // Count total assets across city for badge
      const cityAssetCount = Object.values(filteredSites).reduce((acc, areas) =>
        acc + Object.values(areas).reduce((a, rows) => a + rows.length, 0), 0)

      return (
        <div key={cityKey} className="loc-city-block">
          {/* City row */}
          <div className="loc-city-row" onClick={() => !isSearching && toggleCollapse(cityKey)}>
            <div className="loc-tree-cell">
              <Arrow open={cityOpen} />
              <span className="loc-city-label">{city}</span>
              {cityAssetCount > 0 && (
                <span style={{ marginLeft: '8px', fontSize: '11px', fontWeight: '600', color: '#6366f1', backgroundColor: '#eef2ff', padding: '2px 8px', borderRadius: '10px' }}>
                  {cityAssetCount} asset{cityAssetCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          <SlideDown open={cityOpen}>
            {Object.entries(filteredSites).map(([site, areas]) => {
              const siteKey = `site:${city}:${site}`
              const siteOpen = isSearching ? true : isOpen(siteKey)

              const siteAssetCount = Object.values(areas).reduce((a, rows) => a + rows.length, 0)

              return (
                <div key={siteKey}>
                  {/* Site row */}
                  <div className="loc-site-row" onClick={() => !isSearching && toggleCollapse(siteKey)}>
                    <div className="loc-tree-cell loc-indent-1">
                      <Arrow open={siteOpen} />
                      <span className="loc-site-label">{site}</span>
                      {siteAssetCount > 0 && (
                        <span style={{ marginLeft: '8px', fontSize: '11px', fontWeight: '600', color: '#64748b', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '10px' }}>
                          {siteAssetCount}
                        </span>
                      )}
                    </div>
                  </div>

                  <SlideDown open={siteOpen}>
                    {Object.entries(areas).map(([area, areaRows]) => {
                      const areaKey = `area:${city}:${site}:${area}`
                      const areaOpen = isSearching ? true : isOpen(areaKey)
                      const displayRows = isSearching
                        ? areaRows.filter(r => r.asset_name?.toLowerCase().includes(q))
                        : areaRows

                      return (
                        <div key={areaKey}>
                          {/* Area row */}
                          <div className="loc-area-row" onClick={() => !isSearching && toggleCollapse(areaKey)}>
                            <div className="loc-tree-cell loc-indent-2">
                              <Arrow open={areaOpen} />
                              <span className="loc-area-label">{area}</span>
                              {displayRows.length > 0 && (
                                <span style={{ marginLeft: '8px', fontSize: '11px', fontWeight: '600', color: '#94a3b8', backgroundColor: '#f8fafc', padding: '2px 8px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                  {displayRows.length}
                                </span>
                              )}
                            </div>
                          </div>

                          <SlideDown key={`sd-area-${areaKey}`} open={areaOpen}>
                            {displayRows.length === 0 ? (
                              <div style={{ padding: '16px 70px', fontSize: '13px', color: '#94a3b8', fontStyle: 'italic', borderBottom: '1px solid #f1f5f9', backgroundColor: 'white' }}>
                                No assets assigned to this area
                              </div>
                            ) : (
                              <table className="loc-asset-table">
                                <thead>
                                  <tr>
                                    <th>ASSET</th>
                                    <th>STATUS</th>
                                    <th>PROJECT CODE</th>
                                    <th>CONDITION</th>
                                    <th>START</th>
                                    <th>END</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {displayRows.map(row => (
                                    <tr key={row.asset_movement_id} className="loc-asset-row" onClick={() => setSelectedMovement(row)} style={{ cursor: "pointer" }}>
                                      <td>{highlightText(row.asset_name || '-', searchQuery)}</td>
                                      <td><Badge text={row.asset_status} color={statusColor(row.asset_status)} /></td>
                                      <td>{row.project_code || '-'}</td>
                                      <td><Badge text={row.asset_condition} color={conditionColor(row.asset_condition)} /></td>
                                      <td>{formatDate(row.start_date)}</td>
                                      <td>{formatDate(row.end_date)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </SlideDown>
                        </div>
                      )
                    })}
                  </SlideDown>
                </div>
              )
            })}
          </SlideDown>
        </div>
      )
    })
  }

  return (
    <>
      <div className="locations-wrapper">
        <div className="loc-toolbar">
          <div className="loc-view-tabs">
            <button className="loc-tab-button active">List View</button>
            <div className="loc-search-container">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input type="text" placeholder="Search asset..." className="loc-search-input"
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
          </div>
          <div className="loc-toolbar-actions">
            <button className="loc-refresh-button" onClick={fetchLocations}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                style={{ animation: loading ? 'locSpin 0.8s linear infinite' : 'none' }}>
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

        <div className="loc-table-container">
          {/* Header fix — tidak ikut scroll */}
          <div className="loc-table-header-wrap">
            <div className="loc-header-title">ASSET MOVEMENT LOCATION</div>
          </div>
          {/* Body scroll */}
          <div className="loc-table-scroll">
            {isReady ? renderTree() : null}
          </div>
          <div className="loc-table-footer"></div>
        </div>

      </div>

      <AddLocationModal isOpen={addLocOpen} onClose={() => setAddLocOpen(false)} onSuccess={fetchLocations} />
      <LocationDetailPanel
        movement={selectedMovement}
        onClose={() => setSelectedMovement(null)}
        onEdit={m => setEditMovement(m)}
        onDelete={m => setDeleteMovement(m)}
        onComplete={m => setCompleteMovement(m)}
      />
      <EditMovementModal
        isOpen={!!editMovement}
        movement={editMovement}
        onClose={() => setEditMovement(null)}
        onSuccess={fetchLocations}
      />
      <DeleteMovementModal
        isOpen={!!deleteMovement}
        movement={deleteMovement}
        onClose={() => setDeleteMovement(null)}
        onSuccess={fetchLocations}
      />
      <CompleteConfirmModal
        isOpen={!!completeMovement}
        movement={completeMovement}
        onClose={() => setCompleteMovement(null)}
        onSuccess={fetchLocations}
      />
    </>
  )
}

export default Locations