import { useState, useEffect, useRef } from 'react'
import flatpickr from 'flatpickr'
import 'flatpickr/dist/flatpickr.min.css'
import './Locations.css'

const API = ''

// ===== Add Location Modal =====
function AddLocationModal({ isOpen, onClose, onSuccess }) {
  const [animClass, setAnimClass] = useState('animating-in')
  const startDateRef = useRef(null)
  const endDateRef = useRef(null)
  const startFpRef = useRef(null)
  const endFpRef = useRef(null)

  const [sites, setSites] = useState([])
  const [areas, setAreas] = useState([])
  const [subAreas, setSubAreas] = useState([])
  const [assets, setAssets] = useState([])
  const [assetSearch, setAssetSearch] = useState('')

  const [form, setForm] = useState({
    site: '', area: '', sub_area: '', location_id: '',
    selectedAssets: [],
    asset_status: '', project_code: '',
    asset_condition: '', start_date: '', end_date: ''
  })

  useEffect(() => {
    if (!isOpen) return
    setAnimClass('animating-in')
    setForm({ site: '', area: '', sub_area: '', location_id: '', selectedAssets: [], asset_status: '', project_code: '', asset_condition: '', start_date: '', end_date: '' })
    setSites([])
    setAreas([])
    setSubAreas([])
    setAssetSearch('')
    fetch(`${API}/api/locations/sites`).then(r => r.json()).then(setSites).catch(console.error)
    fetch(`${API}/api/assets`).then(r => r.json()).then(data => { if (Array.isArray(data)) setAssets(data) }).catch(console.error)
  }, [isOpen])

  useEffect(() => {
    if (!form.site) { setAreas([]); setSubAreas([]); return }
    fetch(`${API}/api/locations/areas/${encodeURIComponent(form.site)}`).then(r => r.json()).then(setAreas).catch(console.error)
    setForm(f => ({ ...f, area: '', sub_area: '', location_id: '' }))
    setSubAreas([])
  }, [form.site])

  useEffect(() => {
    if (!form.site || !form.area) { setSubAreas([]); return }
    fetch(`${API}/api/locations/subareas/${encodeURIComponent(form.site)}/${encodeURIComponent(form.area)}`).then(r => r.json()).then(setSubAreas).catch(console.error)
    setForm(f => ({ ...f, sub_area: '', location_id: '' }))
  }, [form.area])

  const handleSubAreaChange = (sub_area) => {
    const found = subAreas.find(s => s.sub_area === sub_area)
    setForm(f => ({ ...f, sub_area, location_id: found ? found.location_id : '' }))
  }

  useEffect(() => {
    if (!isOpen) return
    const config = { dateFormat: 'Y-m-d', allowInput: true }
    if (startDateRef.current) startFpRef.current = flatpickr(startDateRef.current, { ...config, onChange: ([d]) => setForm(f => ({ ...f, start_date: d ? d.toISOString().split('T')[0] : '' })) })
    if (endDateRef.current) endFpRef.current = flatpickr(endDateRef.current, { ...config, onChange: ([d]) => setForm(f => ({ ...f, end_date: d ? d.toISOString().split('T')[0] : '' })) })
    return () => { startFpRef.current?.destroy(); endFpRef.current?.destroy() }
  }, [isOpen])

  const setField = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const toggleAsset = (asset_id) => {
    setForm(f => {
      const sel = f.selectedAssets
      return { ...f, selectedAssets: sel.includes(asset_id) ? sel.filter(id => id !== asset_id) : [...sel, asset_id] }
    })
  }

  const toggleAll = () => {
    const filtered = filteredAssets.map(a => a.asset_id)
    const allSelected = filtered.every(id => form.selectedAssets.includes(id))
    setForm(f => ({
      ...f,
      selectedAssets: allSelected
        ? f.selectedAssets.filter(id => !filtered.includes(id))
        : [...new Set([...f.selectedAssets, ...filtered])]
    }))
  }

  const handleClose = () => {
    setAnimClass('animating-out')
    setTimeout(() => { onClose(); setAnimClass('animating-in') }, 200)
  }

  const filteredAssets = assetSearch.trim()
    ? assets.filter(a => a.asset_name?.toLowerCase().includes(assetSearch.toLowerCase()) || a.tag_number?.toLowerCase().includes(assetSearch.toLowerCase()))
    : assets

  const handleSubmit = async () => {
    if (!form.site) return alert('Please select a site!')
    if (form.selectedAssets.length === 0) return alert('Please select at least one asset!')
    if (!form.project_code) return alert('Project Code is required!')

    try {
      const results = await Promise.all(form.selectedAssets.map(asset_id =>
        fetch(`${API}/api/locations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ site: form.site, area: form.area, sub_area: form.sub_area, location_id: form.location_id, asset_id, asset_status: form.asset_status, project_code: form.project_code, asset_condition: form.asset_condition, start_date: form.start_date, end_date: form.end_date })
        }).then(r => r.json())
      ))
      const failed = results.filter(r => !r.message?.includes('successfully'))
      if (failed.length > 0) {
        alert(`${form.selectedAssets.length - failed.length} asset(s) added. ${failed.length} failed: ${failed.map(r => r.message).join(', ')}`)
      }
      handleClose()
      onSuccess()
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  if (!isOpen) return null

  const allFilteredSelected = filteredAssets.length > 0 && filteredAssets.every(a => form.selectedAssets.includes(a.asset_id))

  return (
    <div className="add-loc-overlay active" onClick={handleClose}>
      <div className={`add-loc-modal ${animClass}`} onClick={e => e.stopPropagation()}>
        <div className="add-loc-header">
          <h2>Add Asset Movement</h2>
          <p>Assign one or more assets to a location and project</p>
        </div>
        <div className="add-loc-body">
          <div className="add-loc-field">
            <label className="add-loc-label">Site</label>
            <select className={`add-loc-select${!form.site ? ' placeholder' : ''}`} value={form.site} onChange={e => setField('site', e.target.value)}>
              <option value="" disabled>Site</option>
              {sites.map(s => <option key={s.site} value={s.site}>{s.site}</option>)}
            </select>
          </div>
          <div className="add-loc-field">
            <label className="add-loc-label">Area</label>
            <select className={`add-loc-select${!form.area ? ' placeholder' : ''}`} value={form.area} onChange={e => setField('area', e.target.value)} disabled={!form.site}>
              <option value="" disabled>{!form.site ? 'Select a site first' : 'Area'}</option>
              {areas.map(a => <option key={a.area} value={a.area}>{a.area}</option>)}
            </select>
          </div>
          <div className="add-loc-field">
            <label className="add-loc-label">Sub Area</label>
            <select className={`add-loc-select${!form.sub_area ? ' placeholder' : ''}`} value={form.sub_area} onChange={e => handleSubAreaChange(e.target.value)} disabled={!form.area}>
              <option value="" disabled>{!form.area ? 'Select an area first' : 'Sub Area'}</option>
              {subAreas.map(s => <option key={s.sub_area} value={s.sub_area}>{s.sub_area}</option>)}
            </select>
          </div>

          {/* Asset multi-select dengan checkbox */}
          <div className="add-loc-field">
            <label className="add-loc-label">
              Assets
              {form.selectedAssets.length > 0 && (
                <span style={{ marginLeft: '8px', fontSize: '12px', color: '#6366f1', fontWeight: '600' }}>
                  {form.selectedAssets.length} selected
                </span>
              )}
            </label>
            {/* Search box */}
            <div className="add-loc-asset-search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input type="text" placeholder="Search asset..." value={assetSearch}
                onChange={e => setAssetSearch(e.target.value)}
                className="add-loc-asset-search-input" />
            </div>
            {/* List checkbox */}
            <div className="add-loc-asset-list">
              {/* Select all */}
              <div className="add-loc-asset-item add-loc-asset-all" onClick={toggleAll}>
                <input type="checkbox" className="add-loc-asset-cb"
                  checked={allFilteredSelected}
                  onChange={toggleAll}
                  onClick={e => e.stopPropagation()} />
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>
                  {allFilteredSelected ? 'Deselect All' : 'Select All'}
                </span>
              </div>
              {filteredAssets.length === 0 ? (
                <div style={{ padding: '12px 16px', fontSize: '13px', color: '#94a3b8' }}>No assets found</div>
              ) : filteredAssets.map(a => (
                <div key={a.asset_id} className={`add-loc-asset-item ${form.selectedAssets.includes(a.asset_id) ? 'selected' : ''}`}
                  onClick={() => toggleAsset(a.asset_id)}>
                  <input type="checkbox" className="add-loc-asset-cb"
                    checked={form.selectedAssets.includes(a.asset_id)}
                    onChange={() => toggleAsset(a.asset_id)}
                    onClick={e => e.stopPropagation()} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.asset_name}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{a.tag_number}</div>
                  </div>
                  <span style={{
                    fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '4px', flexShrink: 0,
                    backgroundColor: a.asset_status === 'Standby' ? '#dcfce7' : a.asset_status === 'In Use' ? '#dbeafe' : '#f1f5f9',
                    color: a.asset_status === 'Standby' ? '#16a34a' : a.asset_status === 'In Use' ? '#2563eb' : '#64748b'
                  }}>{a.asset_status}</span>
                </div>
              ))}
            </div>
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
          <button className="add-loc-submit-btn" onClick={handleSubmit}>
            Add{form.selectedAssets.length > 1 ? ` (${form.selectedAssets.length} Assets)` : ''}
          </button>
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
            <p className="asset-detail-tag">{movement.location_site} › {movement.location_area} › {movement.location_sub_area}</p>
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
              <span className="asset-detail-label">Sub Area</span>
              <span className="asset-detail-value">{movement.location_sub_area || '-'}</span>
            </div>
            <div className="asset-detail-field">
              <span className="asset-detail-label">Sub Area</span>
              <span className="asset-detail-value">{movement.location_sub_area || '-'}</span>
            </div>
            <div className="asset-detail-field asset-detail-field--full">
              <span className="asset-detail-label">Sub Area</span>
              <span className="asset-detail-value">{movement.location_sub_area || '-'}</span>
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
  const [sites, setSites] = useState([])
  const [areas, setAreas] = useState([])
  const [subAreas, setSubAreas] = useState([])
  const [form, setForm] = useState({})
  const startRef = useRef(null)
  const endRef = useRef(null)
  const startFp = useRef(null)
  const endFp = useRef(null)

  useEffect(() => {
    if (!isOpen || !movement) return
    setAnimClass('animating-in')
    setForm({
      site: movement.location_site || '',
      area: movement.location_area || '',
      sub_area: movement.location_sub_area || '',
      location_id: movement.location_id || '',
      project_code: movement.project_code || '',
      asset_condition: movement.asset_condition || '',
      asset_status: movement.asset_status || '',
      start_date: movement.start_date ? new Date(movement.start_date).toISOString().split('T')[0] : '',
      end_date: movement.end_date ? new Date(movement.end_date).toISOString().split('T')[0] : '',
    })
    fetch(`${API}/api/locations/sites`).then(r => r.json()).then(setSites).catch(console.error)
  }, [isOpen, movement])

  useEffect(() => {
    if (!form.site) { setAreas([]); setSubAreas([]); return }
    fetch(`${API}/api/locations/areas/${encodeURIComponent(form.site)}`).then(r => r.json()).then(setAreas)
  }, [form.site])

  useEffect(() => {
    if (!form.site || !form.area) { setSubAreas([]); return }
    fetch(`${API}/api/locations/subareas/${encodeURIComponent(form.site)}/${encodeURIComponent(form.area)}`).then(r => r.json()).then(setSubAreas)
  }, [form.area])

  useEffect(() => {
    if (!isOpen) return
    const cfg = { dateFormat: 'Y-m-d', allowInput: true }
    if (startRef.current) startFp.current = flatpickr(startRef.current, { ...cfg, defaultDate: form.start_date, onChange: ([d]) => setForm(f => ({ ...f, start_date: d ? d.toISOString().split('T')[0] : '' })) })
    if (endRef.current) endFp.current = flatpickr(endRef.current, { ...cfg, defaultDate: form.end_date, onChange: ([d]) => setForm(f => ({ ...f, end_date: d ? d.toISOString().split('T')[0] : '' })) })
    return () => { startFp.current?.destroy(); endFp.current?.destroy() }
  }, [isOpen])

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const handleSubAreaChange = (sub_area) => {
    const found = subAreas.find(s => s.sub_area === sub_area)
    setForm(f => ({ ...f, sub_area, location_id: found ? found.location_id : '' }))
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
          <div className="add-loc-field"><label className="add-loc-label">Site</label>
            <select className={`add-loc-select${!form.site ? ' placeholder' : ''}`} value={form.site} onChange={e => setField('site', e.target.value)}>
              <option value="" disabled>Site</option>
              {sites.map(s => <option key={s.site} value={s.site}>{s.site}</option>)}
            </select>
          </div>
          <div className="add-loc-field"><label className="add-loc-label">Area</label>
            <select className={`add-loc-select${!form.area ? ' placeholder' : ''}`} value={form.area} onChange={e => setField('area', e.target.value)} disabled={!form.site}>
              <option value="" disabled>{!form.site ? 'Select a site first' : 'Area'}</option>
              {areas.map(a => <option key={a.area} value={a.area}>{a.area}</option>)}
            </select>
          </div>
          <div className="add-loc-field"><label className="add-loc-label">Sub Area</label>
            <select className={`add-loc-select${!form.sub_area ? ' placeholder' : ''}`} value={form.sub_area} onChange={e => handleSubAreaChange(e.target.value)} disabled={!form.area}>
              <option value="" disabled>{!form.area ? 'Select an area first' : 'Sub Area'}</option>
              {subAreas.map(s => <option key={s.sub_area} value={s.sub_area}>{s.sub_area}</option>)}
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
  const [addNewLocOpen, setAddNewLocOpen] = useState(false)
  const fetchLocations = () => {
    setIsReady(false)
    setLoading(true)
    const fetchStart = Date.now()
    fetch(`${API}/api/locations`)
      .then(r => r.json())
      .then(data => {
        const elapsed = Date.now() - fetchStart
        const minDuration = 400
        const remaining = Math.max(0, minDuration - elapsed)
        setTimeout(() => {
          if (Array.isArray(data)) {
            // Init all nodes collapsed (all locations, including empty ones)
            const initCollapsed = {}
            const seen = new Set()
            data.forEach(loc => {
              const site = loc.location_site
              const area = loc.location_area || ''
              const sub = loc.location_sub_area || ''
              if (!site) return
              const sk = 'site:' + site
              const ak = 'area:' + site + ':' + area
              const subk = 'sub:' + site + ':' + area + ':' + sub
              if (!seen.has(sk)) { seen.add(sk); initCollapsed[sk] = true }
              if (!seen.has(ak)) { seen.add(ak); initCollapsed[ak] = true }
              if (!seen.has(subk)) { seen.add(subk); initCollapsed[subk] = true }
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
      const site = loc.location_site
      const area = loc.location_area || ''
      const sub_area = loc.location_sub_area || ''
      if (!site) return
      if (!tree[site]) tree[site] = {}
      if (!tree[site][area]) tree[site][area] = {}
      // Always create the sub_area entry (even if empty) so all locations appear
      if (!tree[site][area][sub_area]) tree[site][area][sub_area] = []
      if (loc.assets && loc.assets.length > 0) {
        loc.assets.forEach(a => {
          tree[site][area][sub_area].push({
            ...a,
            location_site: site,
            location_area: area,
            location_sub_area: sub_area,
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
  Object.entries(tree).forEach(([site, areas]) => {
    allKeys['site:' + site] = true
    Object.entries(areas).forEach(([area, subAreas]) => {
      allKeys['area:' + site + ':' + area] = true
      Object.keys(subAreas).forEach(sub_area => {
        allKeys['sub:' + site + ':' + area + ':' + sub_area] = true
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
        if (key.startsWith('site:')) {
          const siteName = key.slice(5)
          const areas = tree[siteName] || {}
          Object.keys(areas).forEach(area => {
            next['area:' + siteName + ':' + area] = true
            Object.keys(areas[area] || {}).forEach(sub => {
              next['sub:' + siteName + ':' + area + ':' + sub] = true
            })
          })
        } else if (key.startsWith('area:')) {
          const parts = key.slice(5).split(':')
          const subAreas = (tree[parts[0]] || {})[parts[1]] || {}
          Object.keys(subAreas).forEach(sub => {
            next['sub:' + parts[0] + ':' + parts[1] + ':' + sub] = true
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

    return Object.entries(tree).map(([site, areas]) => {
      let filteredAreas = {}
      if (isSearching) {
        Object.entries(areas).forEach(([area, subAreas]) => {
          const filteredSubs = {}
          Object.entries(subAreas).forEach(([sub, subRows]) => {
            const matched = subRows.filter(r => r.asset_name?.toLowerCase().includes(q))
            if (matched.length > 0) filteredSubs[sub] = matched
          })
          if (Object.keys(filteredSubs).length > 0) filteredAreas[area] = filteredSubs
        })
        if (Object.keys(filteredAreas).length === 0) return null
      } else {
        filteredAreas = areas
      }

      const siteKey = `site:${site}`
      const siteOpen = isSearching ? true : isOpen(siteKey)

      // Count only actual assets (not empty sub areas)
      const siteAssetCount = Object.values(filteredAreas).reduce((acc, subAreas) =>
        acc + Object.values(subAreas).reduce((a, rows) => a + rows.length, 0), 0)

      return (
        <div key={siteKey} className="loc-city-block">
          {/* Site row (level 1) */}
          <div className="loc-city-row" onClick={() => !isSearching && toggleCollapse(siteKey)}>
            <div className="loc-tree-cell">
              <Arrow open={siteOpen} />
              <span className="loc-city-label">{site}</span>
              {siteAssetCount > 0 && (
                <span style={{ marginLeft: '8px', fontSize: '11px', fontWeight: '600', color: '#6366f1', backgroundColor: '#eef2ff', padding: '2px 8px', borderRadius: '10px' }}>
                  {siteAssetCount} asset{siteAssetCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          <SlideDown open={siteOpen}>
            {Object.entries(filteredAreas).map(([area, subAreas]) => {
              const areaKey = `area:${site}:${area}`
              const areaOpen = isSearching ? true : isOpen(areaKey)

              const areaAssetCount = Object.values(subAreas).reduce((a, rows) => a + rows.length, 0)

              return (
                <div key={areaKey}>
                  {/* Area row (level 2) */}
                  <div className="loc-site-row" onClick={() => !isSearching && toggleCollapse(areaKey)}>
                    <div className="loc-tree-cell loc-indent-1">
                      <Arrow open={areaOpen} />
                      <span className="loc-site-label">{area}</span>
                      {areaAssetCount > 0 && (
                        <span style={{ marginLeft: '8px', fontSize: '11px', fontWeight: '600', color: '#64748b', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '10px' }}>
                          {areaAssetCount}
                        </span>
                      )}
                    </div>
                  </div>

                        <SlideDown open={areaOpen}>
                    {Object.entries(subAreas).map(([sub_area, subRows]) => {
                      const subKey = `sub:${site}:${area}:${sub_area}`
                      const subOpen = isSearching ? true : isOpen(subKey)
                      const displayRows = isSearching
                        ? subRows.filter(r => r.asset_name?.toLowerCase().includes(q))
                        : subRows

                      // During search, skip sub areas with no matching assets
                      if (isSearching && displayRows.length === 0) return null

                      return (
                        <div key={subKey}>
                          {/* Sub Area row (level 3) */}
                          <div className="loc-area-row" onClick={() => !isSearching && toggleCollapse(subKey)}>
                            <div className="loc-tree-cell loc-indent-2">
                              <Arrow open={subOpen} />
                              <span className="loc-area-label">{sub_area}</span>
                              {displayRows.length > 0 && (
                                <span style={{ marginLeft: '8px', fontSize: '11px', fontWeight: '600', color: '#94a3b8', backgroundColor: '#f8fafc', padding: '2px 8px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                  {displayRows.length}
                                </span>
                              )}
                            </div>
                          </div>

                          <SlideDown key={`sd-sub-${subKey}`} open={subOpen}>
                            {displayRows.length === 0 ? (
                              <div style={{ padding: '14px 70px', fontSize: '13px', color: '#94a3b8', fontStyle: 'italic', borderBottom: '1px solid #f1f5f9', backgroundColor: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2">
                                  <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                                </svg>
                                No assets assigned to this sub area
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
            <button className="loc-add-location-btn" onClick={() => setAddNewLocOpen(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Location
            </button>
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
              Movement
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
      <AddNewLocationModal isOpen={addNewLocOpen} onClose={() => setAddNewLocOpen(false)} onSuccess={fetchLocations} />
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

// ===== Autocomplete Input Field =====
function AutocompleteInput({ label, field, placeholder, value, onChange, suggestions, onSelect, activeField, setActiveField }) {
  const ref = useRef(null)
  const isActive = activeField === field
  const filtered = suggestions.filter(s => s && s.toLowerCase().includes(value.toLowerCase()) && s.toLowerCase() !== value.toLowerCase())

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setActiveField(null) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="add-loc-field" ref={ref} style={{ position: 'relative' }}>
      <label className="add-loc-label">{label}</label>
      <input
        type="text"
        className="add-loc-input"
        placeholder={placeholder}
        value={value}
        onChange={e => { onChange(e.target.value); setActiveField(field) }}
        onFocus={() => setActiveField(field)}
        autoComplete="off"
      />
      {isActive && filtered.length > 0 && (
        <div className="loc-autocomplete-dropdown">
          {filtered.slice(0, 8).map((s, i) => (
            <div key={i} className="loc-autocomplete-item" onMouseDown={() => { onSelect(s); setActiveField(null) }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ flexShrink: 0 }}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ===== Add New Location Modal (insert to locations table) =====
function AddNewLocationModal({ isOpen, onClose, onSuccess }) {
  const [animClass, setAnimClass] = useState('animating-in')
  const [form, setForm] = useState({ fl_code: '', city: '', site: '', area: '', sub_area: '' })
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState({ fl_code: [], city: [], site: [], area: [], sub_area: [] })
  const [activeField, setActiveField] = useState(null)
  const [dupWarning, setDupWarning] = useState(false)
  const debounceRef = useRef({})

  useEffect(() => {
    if (!isOpen) return
    setAnimClass('animating-in')
    setForm({ fl_code: '', city: '', site: '', area: '', sub_area: '' })
    setDupWarning(false)
    setActiveField(null)
    // Pre-fetch all distinct values on open
    fetch(`${API}/api/locations/suggestions`).then(r => r.json()).then(data => {
      setSuggestions(data)
    }).catch(() => {})
  }, [isOpen])

  // Check duplicate whenever all key fields filled
  useEffect(() => {
    if (!form.site) { setDupWarning(false); return }
    clearTimeout(debounceRef.current.dup)
    debounceRef.current.dup = setTimeout(() => {
      fetch(`${API}/api/locations/check-duplicate?site=${encodeURIComponent(form.site)}&area=${encodeURIComponent(form.area)}&sub_area=${encodeURIComponent(form.sub_area)}`)
        .then(r => r.json())
        .then(d => setDupWarning(d.exists))
        .catch(() => {})
    }, 400)
  }, [form.site, form.area, form.sub_area])

  const handleClose = () => {
    setAnimClass('animating-out')
    setTimeout(() => { onClose(); setAnimClass('animating-in') }, 200)
  }

  const setField = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const handleSubmit = async () => {
    if (!form.site) return alert('Site is required!')
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/locations/new-location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) return alert(data.message || 'Failed to add location')
      handleClose()
      onSuccess()
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const fields = [
    { label: 'FL Code', field: 'fl_code', placeholder: 'e.g. GSK-WSU01-DA' },
    { label: 'City', field: 'city', placeholder: 'e.g. Gresik' },
    { label: 'Site *', field: 'site', placeholder: 'e.g. Workshop Utama' },
    { label: 'Area', field: 'area', placeholder: 'e.g. Demolition Area' },
    { label: 'Sub Area', field: 'sub_area', placeholder: 'e.g. Area A' },
  ]

  return (
    <div className="add-loc-overlay active" onClick={handleClose}>
      <div className={`add-loc-modal ${animClass}`} style={{ width: '480px' }} onClick={e => e.stopPropagation()}>
        <div className="add-loc-header">
          <h2>Add New Location</h2>
          <p>Add a new location entry to the database</p>
        </div>
        <div className="add-loc-body">
          {fields.map(({ label, field, placeholder }) => (
            <AutocompleteInput
              key={field}
              label={label}
              field={field}
              placeholder={placeholder}
              value={form[field]}
              onChange={val => setField(field, val)}
              onSelect={val => setField(field, val)}
              suggestions={suggestions[field] || []}
              activeField={activeField}
              setActiveField={setActiveField}
            />
          ))}

          {dupWarning && (
            <div className="loc-dup-warning">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <span>A location with this Site / Area / Sub Area already exists. Adding it may create a duplicate.</span>
            </div>
          )}
        </div>
        <div className="add-loc-footer">
          <button className="add-loc-submit-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : 'Add Location'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Locations