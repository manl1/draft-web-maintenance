import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './Dashboard.css'

const API = ''

// ─── Helpers ───────────────────────────────────────────────
const fmt = (n) => Number(n || 0).toLocaleString('id-ID')
const fmtCurrency = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID')

// Status colors matching Assets.jsx exactly
const STATUS_COLORS = {
  'Standby':           '#22c55e',
  'In Use':            '#3b82f6',
  'Under Maintenance': '#eab308',
  'Disposed':          '#ef4444',
}

function statusBg(status) {
  return STATUS_COLORS[status] || '#94a3b8'
}

function statusClass(status) {
  if (!status) return 'pill-idle'
  const s = status.toLowerCase()
  if (s.includes('use'))         return 'pill-active'
  if (s.includes('maintenance')) return 'pill-maintenance'
  if (s.includes('dispos'))      return 'pill-disposed'
  if (s.includes('standby'))     return 'pill-standby'
  return 'pill-idle'
}

function SortIcon({ sortOrder }) {
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', marginLeft: 6, verticalAlign: 'middle', gap: 2 }}>
      <svg width="8" height="6" viewBox="0 0 8 6" fill={sortOrder === 'asc' ? '#6366f1' : '#cbd5e1'}>
        <path d="M4 0L8 6H0L4 0Z"/>
      </svg>
      <svg width="8" height="6" viewBox="0 0 8 6" fill={sortOrder === 'desc' ? '#6366f1' : '#cbd5e1'}>
        <path d="M4 6L0 0H8L4 6Z"/>
      </svg>
    </span>
  )
}

function scoreColor(score) {
  if (score >= 75) return 'score-green'
  if (score >= 45) return 'score-amber'
  return 'score-red'
}

function daysUntilClass(days) {
  if (days <= 3)  return 'urgent'
  if (days <= 14) return 'warning'
  return 'normal'
}

function intensityClass(level) {
  return `heat-${level}`
}

function highlightText(text, query) {
  if (!query.trim() || !text) return <span>{text}</span>
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)
  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part)
          ? <mark key={i} style={{ backgroundColor: '#fde68a', color: '#92400e', borderRadius: '2px', padding: '0 1px' }}>{part}</mark>
          : part
      )}
    </span>
  )
}

// ─── DashDropdown: modal dropdown like Tracking type modal ──
function DashDropdown({ isOpen, onClose, anchorRef, options, selected, onChange, allLabel = 'All' }) {
  const [pos, setPos] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (isOpen && anchorRef?.current) {
      const rect = anchorRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + 6, left: rect.left })
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="trk-modal-overlay active" onClick={onClose}>
      <div
        className="trk-modal-content animating-in"
        style={{ position: 'fixed', top: pos.top, left: pos.left, minWidth: anchorRef?.current?.offsetWidth || 160 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="trk-type-option" onClick={() => { onChange(''); onClose() }}>
          <input type="checkbox" className="trk-type-checkbox" checked={!selected} readOnly />
          <label>{allLabel}</label>
        </div>
        {options.map(opt => (
          <div className="trk-type-option" key={opt} onClick={() => { onChange(opt); onClose() }}>
            <input type="checkbox" className="trk-type-checkbox" checked={selected === opt} readOnly />
            <label>{opt}</label>
          </div>
        ))}
      </div>
    </div>
  )
}

function LineChart({ data }) {
  const [tooltip, setTooltip] = useState(null) // { x, y, label, total }
  const svgRef = useRef(null)

  if (!data || data.length === 0) return <div className="dash-empty">No data available</div>

  const W = 100, H = 80
  const padL = 2, padR = 2, padT = 10, padB = 16
  const maxVal = Math.max(...data.map(d => d.total), 1)

  const pts = data.map((d, i) => {
    const x = padL + (i / (data.length - 1 || 1)) * (W - padL - padR)
    const y = padT + (1 - d.total / maxVal) * (H - padT - padB)
    return { x, y, ...d }
  })

  const pathD = pts.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ')
  const areaD = pathD + ` L${pts[pts.length - 1].x},${H - padB} L${pts[0].x},${H - padB} Z`

  const step = Math.ceil(data.length / 10)
  const xLabels = pts.filter((_, i) => i % step === 0 || i === pts.length - 1)

  const handleMouseMove = (e) => {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const mouseX = ((e.clientX - rect.left) / rect.width) * W
    // Find nearest point
    let nearest = pts[0], minDist = Infinity
    pts.forEach(p => {
      const dist = Math.abs(p.x - mouseX)
      if (dist < minDist) { minDist = dist; nearest = p }
    })
    setTooltip({ x: nearest.x, y: nearest.y, label: nearest.label, total: nearest.total })
  }

  return (
    <div className="linechart-wrap">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="linechart-svg"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((v, i) => {
          const y = padT + (1 - v) * (H - padT - padB)
          return <line key={i} x1={padL} y1={y} x2={W - padR} y2={y} stroke="#f1f5f9" strokeWidth="0.5" />
        })}

        {/* Area fill */}
        <path d={areaD} fill="url(#lineGrad)" opacity="0.35" />

        {/* Line */}
        <path d={pathD} fill="none" stroke="#6366f1" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" />

        {/* Hover crosshair */}
        {tooltip && (
          <>
            <line
              x1={tooltip.x} y1={padT}
              x2={tooltip.x} y2={H - padB}
              stroke="#6366f1" strokeWidth="0.5" strokeDasharray="1.5,1.5"
            />
            <circle cx={tooltip.x} cy={tooltip.y} r="1.2" fill="#6366f1" />
          </>
        )}
      </svg>

      {/* Tooltip box — rendered outside SVG for crisp text */}
      {tooltip && (() => {
        const svg = svgRef.current
        if (!svg) return null
        const rect = svg.getBoundingClientRect()
        const pxX = ((tooltip.x - padL) / (W - padL - padR)) * rect.width
        const pxY = ((tooltip.y - padT) / (H - padT - padB)) * rect.height
        // Flip tooltip to left if too close to right edge
        const flipLeft = pxX > rect.width * 0.7
        return (
          <div
            className="linechart-tooltip"
            style={{
              left: flipLeft ? pxX - 8 : pxX + 8,
              top: Math.max(pxY - 28, 0),
              transform: flipLeft ? 'translateX(-100%)' : 'none',
            }}
          >
            <div className="linechart-tooltip-label">{tooltip.label}</div>
            <div className="linechart-tooltip-value">{tooltip.total} <span>WO</span></div>
          </div>
        )
      })()}

      {/* X-axis labels */}
      <div className="linechart-xlabels">
        {xLabels.map((p, i) => (
          <span key={i} className="linechart-xlabel" style={{ left: `${p.x}%` }}>
            {p.label}
          </span>
        ))}
      </div>

      {/* Y max label */}
      <div className="linechart-ymax">{maxVal} WO</div>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────

function KpiCard({ label, value, sub, colorClass, icon, onClick, clickable }) {
  return (
    <div
      className={`kpi-card ${colorClass}${clickable ? ' kpi-card-clickable' : ''}`}
      onClick={onClick}
      style={clickable ? { cursor: 'pointer' } : {}}
    >
      <div className="kpi-icon">{icon}</div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-sub">{sub}</div>
    </div>
  )
}

// ─── Asset List Modal ───────────────────────────────────────
const STATUS_ORDER = ['Standby']

function AssetListModal({ isOpen, onClose }) {
  const [assets, setAssets] = useState([])
  const [loadingAssets, setLoadingAssets] = useState(false)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setClosing(false)
    setLoadingAssets(true)
    fetch(`${API}/api/dashboard/active-assets-list`)
      .then(r => r.json())
      .then(data => { setAssets(Array.isArray(data) ? data : []); setLoadingAssets(false) })
      .catch(() => setLoadingAssets(false))
  }, [isOpen])

  const handleClose = () => {
    setClosing(true)
    setTimeout(() => {
      setClosing(false)
      onClose()
    }, 180)
  }

  if (!isOpen) return null

  const grouped = STATUS_ORDER.map(status => ({
    status,
    items: assets.filter(a => a.asset_status === status)
  })).filter(g => g.items.length > 0)

  return (
    <div
      className={`trk-modal-overlay active asset-modal-overlay${closing ? ' closing' : ''}`}
      onClick={handleClose}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div
        className={`asset-list-modal${closing ? ' closing' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="asset-list-modal-header">
          <div>
            <div className="asset-list-modal-title">Active Assets</div>
            <div className="asset-list-modal-subtitle">
              {assets.length} total asset · sorted by status
            </div>
          </div>

        </div>

        {/* Table */}
        <div className="asset-list-modal-scroll">
          {loadingAssets ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Loading...</div>
          ) : assets.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No assets found.</div>
          ) : (
            <table className="asset-list-table">
              <thead>
                <tr>
                  <th>Asset Name</th>
                  <th>Status</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {grouped.map(group => (
                  <>
                    <tr key={`group-${group.status}`} className="asset-list-group-row">
                      <td colSpan={3}>
                        <span
                          className="asset-list-group-label"
                          style={{ color: statusBg(group.status) }}
                        >
                          {group.status.toUpperCase()}
                          <span
                            className="asset-list-group-count"
                            style={{ backgroundColor: statusBg(group.status) }}
                          >{group.items.length}</span>
                        </span>
                      </td>
                    </tr>
                    {group.items.map(a => (
                      <tr key={a.asset_id} className="asset-list-row">
                        <td>
                          <div className="asset-list-name">{a.asset_name}</div>
                          <div className="asset-list-tag">{a.tag_number}</div>
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: 'white',
                            textTransform: 'uppercase',
                            backgroundColor: statusBg(a.asset_status)
                          }}>
                            {a.asset_status}
                          </span>
                        </td>
                        <td>
                          <span className="asset-list-location">
                            {a.location_site || <span style={{ color: '#cbd5e1' }}>—</span>}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Under Maintenance Modal ────────────────────────────────
function MaintModal({ isOpen, onClose }) {
  const [assets, setAssets] = useState([])
  const [loadingAssets, setLoadingAssets] = useState(false)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setClosing(false)
    setLoadingAssets(true)
    fetch(`${API}/api/dashboard/maint-assets-list`)
      .then(r => r.json())
      .then(data => { setAssets(Array.isArray(data) ? data : []); setLoadingAssets(false) })
      .catch(() => setLoadingAssets(false))
  }, [isOpen])

  const handleClose = () => {
    setClosing(true)
    setTimeout(() => { setClosing(false); onClose() }, 180)
  }

  if (!isOpen) return null

  return (
    <div
      className={`trk-modal-overlay active asset-modal-overlay${closing ? ' closing' : ''}`}
      onClick={handleClose}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div
        className={`asset-list-modal${closing ? ' closing' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="asset-list-modal-header">
          <div>
            <div className="asset-list-modal-title">Under Maintenance</div>
            <div className="asset-list-modal-subtitle">
              {assets.length} asset · currently under maintenance
            </div>
          </div>
        </div>

        <div className="asset-list-modal-scroll">
          {loadingAssets ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Loading...</div>
          ) : assets.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No assets under maintenance.</div>
          ) : (
            <table className="asset-list-table">
              <thead>
                <tr>
                  <th>Asset Name</th>
                  <th>Status</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                <tr className="asset-list-group-row">
                  <td colSpan={3}>
                    <span className="asset-list-group-label" style={{ color: statusBg('Under Maintenance') }}>
                      UNDER MAINTENANCE
                      <span className="asset-list-group-count" style={{ backgroundColor: statusBg('Under Maintenance') }}>{assets.length}</span>
                    </span>
                  </td>
                </tr>
                {assets.map(a => (
                  <tr key={a.asset_id} className="asset-list-row">
                    <td>
                      <div className="asset-list-name">{a.asset_name}</div>
                      <div className="asset-list-tag">{a.tag_number}</div>
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: 'white',
                        textTransform: 'uppercase',
                        backgroundColor: statusBg(a.asset_status)
                      }}>
                        {a.asset_status}
                      </span>
                    </td>
                    <td>
                      <span className="asset-list-location">
                        {a.location_site || <span style={{ color: '#cbd5e1' }}>—</span>}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}


// ─── Avg Downtime Modal ────────────────────────────────────
function AvgDowntimeModal({ isOpen, onClose }) {
  const [rows, setRows]             = useState([])
  const [loadingData, setLoadingData] = useState(false)
  const [closing, setClosing]       = useState(false)
  const [expandedRows, setExpandedRows] = useState({})
  const [slideOpen, setSlideOpen]   = useState({})
  const [logData, setLogData]       = useState({})
  const [logLoading, setLogLoading] = useState({})

  useEffect(() => {
    if (!isOpen) return
    setClosing(false)
    setExpandedRows({})
    setSlideOpen({})
    setLogData({})
    setLoadingData(true)
    fetch(`${API}/api/dashboard/downtime-per-asset`)
      .then(r => r.json())
      .then(data => { setRows(Array.isArray(data) ? data : []); setLoadingData(false) })
      .catch(() => setLoadingData(false))
  }, [isOpen])

  const handleClose = () => {
    setClosing(true)
    setTimeout(() => { setClosing(false); onClose() }, 180)
  }

  const fetchLog = (assetId, onDone) => {
    setLogLoading(prev => ({ ...prev, [assetId]: true }))
    fetch(`${API}/api/dashboard/downtime-log/${assetId}`)
      .then(r => r.json())
      .then(data => {
        setLogData(prev => ({ ...prev, [assetId]: Array.isArray(data) ? data : [] }))
        setLogLoading(prev => ({ ...prev, [assetId]: false }))
        if (onDone) onDone()
      })
      .catch(() => {
        setLogLoading(prev => ({ ...prev, [assetId]: false }))
        if (onDone) onDone()
      })
  }

  const toggleRow = (assetId) => {
    const isOpen = !!expandedRows[assetId]
    if (isOpen) {
      setSlideOpen(prev => ({ ...prev, [assetId]: false }))
      setExpandedRows(prev => ({ ...prev, [assetId]: false }))
    } else {
      setExpandedRows(prev => ({ ...prev, [assetId]: true }))
      fetchLog(assetId, () => setSlideOpen(prev => ({ ...prev, [assetId]: true })))
    }
  }

  // format "HH:MM:SS" or seconds → "Xh Ym"
  const fmtDuration = (val) => {
    if (!val) return '—'
    if (typeof val === 'string' && val.includes(':')) {
      const [h, m] = val.split(':').map(Number)
      if (!h && !m) return '—'
      return h ? `${h}h ${m}m` : `${m}m`
    }
    const total = Math.round(parseFloat(val) * 60)
    const h = Math.floor(total / 60), m = total % 60
    return h ? `${h}h ${m}m` : `${m}m`
  }

  if (!isOpen) return null

  return (
    <div
      className={`trk-modal-overlay active asset-modal-overlay${closing ? ' closing' : ''}`}
      onClick={handleClose}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div
        className={`asset-list-modal dt-modal${closing ? ' closing' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="asset-list-modal-header">
          <div>
            <div className="asset-list-modal-title">Avg. Downtime per Asset</div>
            <div className="asset-list-modal-subtitle">
              {rows.length} asset · click row to see WO history
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="asset-list-modal-scroll">
          {loadingData ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Loading...</div>
          ) : rows.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No downtime data found.</div>
          ) : (
            <table className="asset-list-table dt-table">
              <thead>
                <tr>
                  <th>Asset Name</th>
                  <th>Avg Downtime</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => {
                  const isExpanded = !!expandedRows[row.asset_id]
                  const isSlideOpen = !!slideOpen[row.asset_id]
                  const logs = logData[row.asset_id] || []
                  const isLogLoading = !!logLoading[row.asset_id]
                  return (
                    <>
                      <tr
                        key={row.asset_id}
                        className={`asset-list-row dt-parent-row${isExpanded ? ' expanded' : ''}`}
                        onClick={() => toggleRow(row.asset_id)}
                      >
                        <td>
                          <div className="asset-list-name">{row.asset_name}</div>
                          <div className="asset-list-tag">{row.tag_number}</div>
                        </td>
                        <td>
                          <span className="dt-avg-val">{row.avg_downtime_fmt}</span>
                          <span className="dt-avg-sub">{row.wo_count} WO</span>
                        </td>
                      </tr>
                      <tr key={`log-${row.asset_id}`} style={{ backgroundColor: '#fafbff' }}>
                        <td colSpan={2} style={{ padding: 0, borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none' }}>
                          <DtSlideDown open={isSlideOpen}>
                            <div className="dt-log-wrap">
                              {isLogLoading ? (
                                <div className="dt-log-loading">Loading...</div>
                              ) : logs.length === 0 ? (
                                <div className="dt-log-loading">No WO records found.</div>
                              ) : (
                                <table className="dt-log-table">
                                  <thead>
                                    <tr>
                                      <th>Date</th>
                                      <th>Type</th>
                                      <th>Downtime</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {logs.map((log, i) => (
                                      <tr key={i} className="dt-log-row">
                                        <td>{log.date ? String(log.date).split('T')[0] : '—'}</td>
                                        <td>{log.wo_type || '—'}</td>
                                        <td>{fmtDuration(log.downtime_hours)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          </DtSlideDown>
                        </td>
                      </tr>
                    </>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

// SlideDown mini untuk DT modal (tidak perlu ref global)
function DtSlideDown({ open, children }) {
  const ref = useRef(null)
  const init = useRef(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!init.current) {
      init.current = true
      el.style.height = open ? 'auto' : '0px'
      el.style.overflow = 'hidden'
      return
    }
    if (open) {
      el.style.height = '0px'
      el.style.overflow = 'hidden'
      requestAnimationFrame(() => {
        const h = el.scrollHeight
        el.style.transition = 'height 0.28s ease'
        el.style.height = `${h}px`
        const onEnd = () => { el.style.height = 'auto'; el.style.transition = ''; el.removeEventListener('transitionend', onEnd) }
        el.addEventListener('transitionend', onEnd)
      })
    } else {
      el.style.height = `${el.scrollHeight}px`
      el.style.overflow = 'hidden'
      requestAnimationFrame(() => requestAnimationFrame(() => {
        el.style.transition = 'height 0.28s ease'
        el.style.height = '0px'
        const onEnd = () => { el.style.transition = ''; el.removeEventListener('transitionend', onEnd) }
        el.addEventListener('transitionend', onEnd)
      }))
    }
  }, [open])
  return <div ref={ref} style={{ overflow: 'hidden' }}>{children}</div>
}


// ─── In Use Modal (Utilization Rate) ───────────────────────
function InUseModal({ isOpen, onClose }) {
  const [assets, setAssets] = useState([])
  const [loadingAssets, setLoadingAssets] = useState(false)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setClosing(false)
    setLoadingAssets(true)
    fetch(`${API}/api/dashboard/inuse-assets-list`)
      .then(r => r.json())
      .then(data => { setAssets(Array.isArray(data) ? data : []); setLoadingAssets(false) })
      .catch(() => setLoadingAssets(false))
  }, [isOpen])

  const handleClose = () => {
    setClosing(true)
    setTimeout(() => { setClosing(false); onClose() }, 180)
  }

  if (!isOpen) return null

  return (
    <div
      className={`trk-modal-overlay active asset-modal-overlay${closing ? ' closing' : ''}`}
      onClick={handleClose}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div
        className={`asset-list-modal${closing ? ' closing' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="asset-list-modal-header">
          <div>
            <div className="asset-list-modal-title">Assets In Use</div>
            <div className="asset-list-modal-subtitle">
              {assets.length} asset · currently in use
            </div>
          </div>
        </div>
        <div className="asset-list-modal-scroll">
          {loadingAssets ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Loading...</div>
          ) : assets.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No assets currently in use.</div>
          ) : (
            <table className="asset-list-table">
              <thead>
                <tr>
                  <th>Asset Name</th>
                  <th>Status</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                <tr className="asset-list-group-row">
                  <td colSpan={3}>
                    <span className="asset-list-group-label" style={{ color: statusBg('In Use') }}>
                      IN USE
                      <span className="asset-list-group-count" style={{ backgroundColor: statusBg('In Use') }}>{assets.length}</span>
                    </span>
                  </td>
                </tr>
                {assets.map(a => (
                  <tr key={a.asset_id} className="asset-list-row">
                    <td>
                      <div className="asset-list-name">{a.asset_name}</div>
                      <div className="asset-list-tag">{a.tag_number}</div>
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-block', padding: '4px 10px', borderRadius: '6px',
                        fontSize: '12px', fontWeight: '600', color: 'white',
                        textTransform: 'uppercase', backgroundColor: statusBg(a.asset_status)
                      }}>
                        {a.asset_status}
                      </span>
                    </td>
                    <td>
                      <span className="asset-list-location">
                        {a.location_site || <span style={{ color: '#cbd5e1' }}>—</span>}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── WO Incidents Modal (Maintenance Incidents heatmap click) ───
function WoIncidentModal({ isOpen, onClose, monthLabel, yearMonth, assetId }) {
  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(false)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (!isOpen || !yearMonth) return
    setClosing(false)
    setRows([])
    setLoading(true)
    const url = `${API}/api/dashboard/wo-incidents/${yearMonth}${assetId ? `?assetId=${assetId}` : ''}`
    fetch(url)
      .then(r => r.json())
      .then(data => { setRows(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [isOpen, yearMonth, assetId])

  const handleClose = () => {
    setClosing(true)
    setTimeout(() => { setClosing(false); onClose() }, 180)
  }

  if (!isOpen) return null

  return (
    <div
      className={`trk-modal-overlay active asset-modal-overlay${closing ? ' closing' : ''}`}
      onClick={handleClose}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div
        className={`asset-list-modal wo-incident-modal${closing ? ' closing' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="asset-list-modal-header">
          <div>
            <div className="asset-list-modal-title">Maintenance Incidents</div>
            <div className="asset-list-modal-subtitle">
              {rows.length} WO · {monthLabel}
            </div>
          </div>
        </div>
        <div className="asset-list-modal-scroll">
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Loading...</div>
          ) : rows.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No work orders found for this month.</div>
          ) : (
            <table className="asset-list-table">
              <thead>
                <tr>
                  <th>Asset Name</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="asset-list-row">
                    <td>
                      <div className="asset-list-name">{r.asset_name}</div>
                      <div className="asset-list-tag">{r.tag_number}</div>
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-block', padding: '3px 8px', borderRadius: '6px',
                        fontSize: '11px', fontWeight: '600', color: 'white', textTransform: 'uppercase',
                        backgroundColor: r.wo_type === 'Corrective' ? '#ef4444' : '#3b82f6'
                      }}>{r.wo_type}</span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap', color: '#64748b', fontSize: 13 }}>
                      {r.wo_request_date ? String(r.wo_request_date).split('T')[0] : '—'}
                    </td>
                    <td style={{ color: '#475569', fontSize: 13 }}>{r.wo_description || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── WO Detail Modal (Asset Maintenance History Detail row click) ───
function WoDetailModal({ isOpen, onClose, assetId, assetName }) {
  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(false)
  const [closing, setClosing] = useState(false)

  const fmtDate = (val) => {
    if (!val) return '—'
    const s = String(val).split('T')[0]
    return s === '0000-00-00' ? '—' : s
  }

  const woTypeBg = (t) => t === 'Corrective' ? '#ef4444' : '#3b82f6'
  const priorityBg = (p) => {
    if (p === 'High') return '#ef4444'
    if (p === 'Medium') return '#f59e0b'
    return '#22c55e'
  }
  const woStatusBg = (s) => {
    if (s === 'Completed') return '#22c55e'
    if (s === 'In Progress') return '#3b82f6'
    if (s === 'Pending') return '#f59e0b'
    return '#94a3b8'
  }
  const runningTestBg = (v) => {
    if (v === 'Pass') return '#22c55e'
    if (v === 'Ongoing') return '#3b82f6'
    if (v === 'Denied') return '#ef4444'
    return '#94a3b8'
  }

  useEffect(() => {
    if (!isOpen || !assetId) return
    setClosing(false)
    setRows([])
    setLoading(true)
    fetch(`${API}/api/dashboard/asset-wo-detail/${assetId}`)
      .then(r => r.json())
      .then(data => { setRows(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [isOpen, assetId])

  const handleClose = () => {
    setClosing(true)
    setTimeout(() => { setClosing(false); onClose() }, 180)
  }

  if (!isOpen) return null

  return (
    <div
      className={`trk-modal-overlay active asset-modal-overlay${closing ? ' closing' : ''}`}
      onClick={handleClose}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div
        className={`asset-list-modal wo-detail-modal${closing ? ' closing' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="asset-list-modal-header">
          <div>
            <div className="asset-list-modal-title">{assetName}</div>
            <div className="asset-list-modal-subtitle">
              {rows.length} work order · maintenance history
            </div>
          </div>
        </div>
        <div className="asset-list-modal-scroll">
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Loading...</div>
          ) : rows.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No work orders found.</div>
          ) : (
            <table className="asset-list-table wo-detail-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Planned Start</th>
                  <th>Planned Finish</th>
                  <th>Actual Start</th>
                  <th>Actual Finish</th>
                  <th>Downtime</th>
                  <th>Running Test</th>
                  <th>Status</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="asset-list-row">
                    <td>
                      <span style={{ display:'inline-block', padding:'3px 8px', borderRadius:'6px', fontSize:'11px', fontWeight:'600', color:'white', textTransform:'uppercase', backgroundColor: woTypeBg(r.wo_type) }}>
                        {r.wo_type}
                      </span>
                    </td>
                    <td style={{ fontSize:12, color:'#475569', minWidth:140 }}>{r.wo_description || '—'}</td>
                    <td style={{ whiteSpace:'nowrap', fontSize:13, color:'#64748b' }}>{fmtDate(r.planned_start)}</td>
                    <td style={{ whiteSpace:'nowrap', fontSize:13, color:'#64748b' }}>{fmtDate(r.planned_finish)}</td>
                    <td style={{ whiteSpace:'nowrap', fontSize:13, color:'#64748b' }}>{fmtDate(r.actual_start)}</td>
                    <td style={{ whiteSpace:'nowrap', fontSize:13, color:'#64748b' }}>{fmtDate(r.actual_finish)}</td>
                    <td style={{ whiteSpace:'nowrap', fontSize:13, fontWeight:600, color:'#f59e0b' }}>
                      {r.downtime_hours && r.downtime_hours !== '00:00:00' ? r.downtime_hours.substring(0,5) : '—'}
                    </td>
                    <td>
                      {r.running_test ? (
                        <span style={{ display:'inline-block', padding:'3px 8px', borderRadius:'6px', fontSize:'11px', fontWeight:'600', color:'white', textTransform:'uppercase', backgroundColor: runningTestBg(r.running_test) }}>
                          {r.running_test}
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      <span style={{ display:'inline-block', padding:'3px 8px', borderRadius:'6px', fontSize:'11px', fontWeight:'600', color:'white', textTransform:'uppercase', backgroundColor: woStatusBg(r.wo_status) }}>
                        {r.wo_status}
                      </span>
                    </td>
                    <td>
                      <span style={{ display:'inline-block', padding:'3px 8px', borderRadius:'6px', fontSize:'11px', fontWeight:'600', color:'white', textTransform:'uppercase', backgroundColor: priorityBg(r.priority) }}>
                        {r.priority}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}


const KpiIcons = {
  assets: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>
    </svg>
  ),
  maintenance: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  downtime: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  utilization: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
}

function AssetDetailCard({ detail }) {
  const criticalityColor = (c) => {
    if (c === 'Critical') return '#ef4444'
    if (c === 'High') return '#f59e0b'
    if (c === 'Medium') return '#3b82f6'
    return '#22c55e'
  }

  // ─── UBAH URUTAN DI SINI ─────────────────────────────────────
  // Setiap objek: { label, value, isCriticality?, wide? }
  // Ganti posisi baris-baris di bawah untuk mengatur ulang urutan kolom
  const fields = [
    { label: 'Tag Number',   value: detail.tag_number },
    { label: 'Category',     value: detail.category },
    { label: 'Type',         value: detail.asset_type_name },
    { label: 'Model',        value: detail.model },
    { label: 'Capacity',     value: detail.capacity },
    { label: 'Criticality',  value: detail.criticality,   isCriticality: true },
    { label: 'Expired Silo', value: detail.expired_date_silo ? String(detail.expired_date_silo).split('T')[0] : '—' },
    { label: 'Remarks',      value: detail.asset_remarks, wide: true },
  ]
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="dash-card asset-detail-card">
      <div className="asset-detail-header">
        <div>
          <div className="asset-detail-title">{detail.asset_name}</div>
          <div className="asset-detail-sub">{detail.category} · {detail.asset_type_name}</div>
        </div>
        <span style={{
          display: 'inline-block', padding: '5px 12px', borderRadius: '8px', flexShrink: 0,
          fontSize: '12px', fontWeight: '700', color: 'white', textTransform: 'uppercase',
          backgroundColor: statusBg(detail.asset_status)
        }}>{detail.asset_status}</span>
      </div>
      <div className="asset-detail-grid">
        {fields.filter(f => !f.wide).map((f, i) => (
          <div key={i} className="asset-detail-box">
            <div className="asset-detail-label">{f.label}</div>
            {f.isCriticality ? (
              <span style={{ display:'inline-block', width:'fit-content', padding:'3px 10px', borderRadius:'6px', fontSize:'12px', fontWeight:'600', color:'white', textTransform:'uppercase', backgroundColor: criticalityColor(f.value) }}>{f.value || '—'}</span>
            ) : (
              <div className="asset-detail-value">{f.value || '—'}</div>
            )}
          </div>
        ))}
        {fields.filter(f => f.wide).map((f, i) => (
          <div key={i} className="asset-detail-box asset-detail-wide">
            <div className="asset-detail-label">{f.label}</div>
            <div className="asset-detail-value">{f.value || '—'}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AssetTrackingCard({ assetId, assetName, navigate }) {
  const HM_MAX = 4000
  const SHIFTS = ['Shift 1', 'Shift 2', 'Shift 3']
  const [shiftIdx, setShiftIdx] = useState(0)
  const [p2hData, setP2hData]   = useState(null)
  const [hmData,  setHmData]    = useState(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!assetId) return
    setLoading(true)
    Promise.all([
      fetch(`${API}/api/dashboard/asset-tracking-p2h/${assetId}`).then(r => r.json()),
      fetch(`${API}/api/dashboard/asset-tracking-hm/${assetId}`).then(r => r.json()),
    ]).then(([p2h, hm]) => {
      setP2hData(p2h)
      setHmData(hm)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [assetId])

  const totalHm  = hmData?.total_hm || 0
  const hmPct    = Math.min((totalHm / HM_MAX) * 100, 100)
  const hmColor  = hmPct >= 100 ? '#ef4444' : hmPct >= 70 ? '#f59e0b' : '#22c55e'
  const hmLabel  = hmPct >= 100 ? 'bar-high' : hmPct >= 70 ? 'bar-med' : 'bar-low'

  const currentShift = p2hData?.shifts?.[shiftIdx]

  return (
    <div className="dash-card asset-tracking-card">
      <div className="dash-card-header">
        <div>
          <div className="dash-card-title">Asset Tracking</div>
          <div className="dash-card-subtitle">P2H &amp; Hour Meter — {assetName}</div>
        </div>
      </div>
      <div className="dash-card-body">
        {loading ? (
          <div className="dash-empty">Loading...</div>
        ) : (
          <div className="atrk-wrap">

            {/* ── P2H SECTION ── */}
            <div className="atrk-p2h-box rank-item">
              {/* Clickable area: content + status icon only (excludes pagination arrows) */}
              <div
                className={`atrk-p2h-clickable${currentShift?.submitted ? ' is-clickable' : ''}`}
                onClick={() => {
                  if (!currentShift?.submitted) return
                  navigate('/tracking', {
                    state: {
                      assetId,
                      assetName: p2hData?.asset_name || assetName,
                      shift: SHIFTS[shiftIdx],
                      autoExpand: true,
                    }
                  })
                }}
              >
                <div className="atrk-p2h-content">
                  <div className="atrk-shift-label">P2H UNIT · {SHIFTS[shiftIdx]}</div>
                  <div className="atrk-asset-name">{p2hData?.asset_name || assetName}</div>
                </div>

                {/* Status icon */}
                <div className={`atrk-status-icon ${currentShift?.submitted ? 'submitted' : 'pending'}`}>
                  {currentShift?.submitted ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  )}
                </div>
              </div>

              {/* Pagination arrows — outside clickable area, no hover highlight on box */}
              <div className="atrk-arrows-group">
                <button
                  className="atrk-arrow"
                  onClick={(e) => { e.stopPropagation(); setShiftIdx(i => Math.max(i - 1, 0)) }}
                  disabled={shiftIdx === 0}
                >‹</button>
                <button
                  className="atrk-arrow"
                  onClick={(e) => { e.stopPropagation(); setShiftIdx(i => Math.min(i + 1, 2)) }}
                  disabled={shiftIdx === 2}
                >›</button>
              </div>
            </div>

            {/* Shift dots */}
            <div className="atrk-dots">
              {SHIFTS.map((_, i) => (
                <span
                  key={i}
                  className={`atrk-dot ${i === shiftIdx ? 'active' : ''} ${p2hData?.shifts?.[i]?.submitted ? 'done' : ''}`}
                  onClick={() => setShiftIdx(i)}
                />
              ))}
            </div>

            {/* ── HOUR METER SECTION ── */}
            <div
              className="atrk-hm-box rank-item atrk-hm-box--clickable"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/tracking', {
                state: {
                  autoExpandHm: true,
                  assetId,
                  assetName: p2hData?.asset_name || assetName,
                }
              })}
            >
              <div className="atrk-hm-info">
                <div className="atrk-shift-label">HOUR METER UTILIZATION</div>
                <span className="rank-name">{p2hData?.asset_name || assetName}</span>
                <span className="rank-type">{totalHm.toLocaleString()} / {HM_MAX.toLocaleString()} jam</span>
              </div>
              <div className="rank-bar" style={{ width: 80 }}>
                <div className="rank-bar-fill" style={{ width: `${hmPct}%`, background: hmColor }} />
              </div>
              <span className="rank-score" style={{ color: hmColor, width: 44, fontSize: 12 }}>
                {Math.round(hmPct)}%
              </span>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}

function SectionCard({ title, subtitle, tag, children, action, right, className }) {
  return (
    <div className={`dash-card${className ? ' ' + className : ''}`}>
      <div className="dash-card-header">
        <div>
          <div className="dash-card-title">{title}</div>
          {subtitle && <div className="dash-card-subtitle">{subtitle}</div>}
        </div>
        <div className="dash-card-right">
          {right ? right : <>{tag && <span className="dash-tag">{tag}</span>}{action}</>}
        </div>
      </div>
      <div className="dash-card-body">{children}</div>
    </div>
  )
}

function Spinner() {
  return <div className="dash-spinner"><div className="dash-spin" /></div>
}

// ─── Main Component ────────────────────────────────────────
export default function Dashboard() {
  const [range, setRange]               = useState(365)
  const [kpi, setKpi]                   = useState(null)
  const [assetStatus, setAssetStatus]   = useState([])
  const [assetsList, setAssetsList]     = useState([])
  const [selectedAsset, setSelectedAsset] = useState('')
  const [locHistory, setLocHistory]     = useState([])
  const [maintCat, setMaintCat]         = useState([])
  const [maintWoType, setMaintWoType]   = useState('')
  const [avgDowntime, setAvgDowntime]   = useState([])
  const [avgWoType, setAvgWoType]       = useState('')

  // Dropdown modal state + refs
  const [maintDropOpen, setMaintDropOpen]   = useState(false)
  const [avgDropOpen, setAvgDropOpen]       = useState(false)
  const [locDropOpen, setLocDropOpen]       = useState(false)
  const [catDropOpen, setCatDropOpen]       = useState(false)
  const maintBtnRef = useRef(null)
  const avgBtnRef   = useRef(null)
  const locBtnRef   = useRef(null)
  const catBtnRef   = useRef(null)
  const [heatmap, setHeatmap]           = useState([])
  const [dailyChart, setDailyChart]     = useState([])
  const [heatmapPage, setHeatmapPage]   = useState(0)
  const [productivity, setProductivity] = useState([])

  // Detail table state
  const [detailData, setDetailData]     = useState([])
  const [detailTotal, setDetailTotal]   = useState(0)
  const [detailPage, setDetailPage]     = useState(1)
  const [detailSearch, setDetailSearch] = useState('')
  const [detailCategory, setDetailCategory] = useState('')
  const [categories, setCategories]     = useState([])
  const [sortOrder, setSortOrder]       = useState(null)  // null | 'asc' | 'desc'

  const navigate = useNavigate()
  const [activeTab, setActiveTab]       = useState('asset')
  const [loading, setLoading]           = useState(true)
  const [showAssetModal, setShowAssetModal] = useState(false)
  const [assetSearchQuery, setAssetSearchQuery] = useState('')
  const [assetSearchResults, setAssetSearchResults] = useState([])
  const [assetSearchOpen, setAssetSearchOpen] = useState(false)
  const [assetSearchLoading, setAssetSearchLoading] = useState(false)
  const [selectedAssetId, setSelectedAssetId] = useState(null)
  const [assetDetail, setAssetDetail] = useState(null)
  const [assetProductivityScore, setAssetProductivityScore] = useState(null)
  const assetSearchRef = useRef(null)
  const [showMaintModal, setShowMaintModal] = useState(false)
  const [showDowntimeModal, setShowDowntimeModal] = useState(false)
  const [showUtilModal, setShowUtilModal] = useState(false)
  const [woDetailModal, setWoDetailModal] = useState({ open: false, assetId: null, assetName: '' })
  const [woIncidentModal, setWoIncidentModal] = useState({ open: false, monthLabel: '', yearMonth: '', assetId: null })
  const [woInlineRows, setWoInlineRows] = useState([])
  const [woInlineLoading, setWoInlineLoading] = useState(false)

  // Fetch all dashboard data
  const fetchAll = useCallback(async (r) => {
    setLoading(true)
    try {
      const [
        kpiData, statusData, assetsData,
        heatmapData,
        productivityData
      ] = await Promise.all([
        fetch(`${API}/api/dashboard/kpi?range=${r}`).then(r => r.json()),
        fetch(`${API}/api/dashboard/asset-status`).then(r => r.json()),
        fetch(`${API}/api/dashboard/assets-list`).then(r => r.json()),
        fetch(`${API}/api/dashboard/maintenance-heatmap${selectedAssetId ? `?assetId=${selectedAssetId}` : ''}`).then(r => r.json()),
        fetch(`${API}/api/dashboard/productivity?range=${r}&limit=8`).then(r => r.json()),
      ])
      setKpi(kpiData)
      setAssetStatus(statusData)
      setAssetsList(assetsData)
      setHeatmap(Array.isArray(heatmapData) ? heatmapData : [])
      setProductivity(Array.isArray(productivityData) ? productivityData : [])

      // Default stays as '' (All Assets)
    } catch (e) {
      console.error('Dashboard fetch error:', e)
    } finally {
      setLoading(false)
    }
  }, [selectedAsset, selectedAssetId])

  useEffect(() => { fetchAll(range) }, [range, selectedAssetId])

  // Fetch maintenance-by-type separately when wo_type or range changes
  const fetchMaintCat = useCallback(async () => {
    const res = await fetch(`${API}/api/dashboard/maintenance-by-type?range=${range}&wo_type=${maintWoType}`)
    const data = await res.json()
    setMaintCat(Array.isArray(data) ? data : [])
  }, [range, maintWoType])

  useEffect(() => { fetchMaintCat() }, [fetchMaintCat])

  // Fetch avg-downtime separately when wo_type or range changes
  const fetchAvgDowntime = useCallback(async () => {
    const res = await fetch(`${API}/api/dashboard/avg-downtime-by-category?range=${range}&wo_type=${avgWoType}`)
    const data = await res.json()
    setAvgDowntime(Array.isArray(data) ? data : [])
  }, [range, avgWoType])

  useEffect(() => { fetchAvgDowntime() }, [fetchAvgDowntime])

  // Fetch daily maintenance chart — follows global range
  const fetchDailyChart = useCallback(async () => {
    const url = `${API}/api/dashboard/maintenance-daily?range=${range}${selectedAssetId ? `&assetId=${selectedAssetId}` : ''}`
    const res = await fetch(url)
    const data = await res.json()
    setDailyChart(Array.isArray(data) ? data : [])
  }, [range, selectedAssetId])

  useEffect(() => { fetchDailyChart() }, [fetchDailyChart])

  // Fetch location history when asset changes
  useEffect(() => {
    const url = selectedAsset === ''
      ? `${API}/api/dashboard/location-history-all`
      : `${API}/api/dashboard/location-history/${selectedAsset}`
    fetch(url)
      .then(r => r.json())
      .then(setLocHistory)
      .catch(console.error)
  }, [selectedAsset])

  useEffect(() => {
    if (!selectedAssetId) { setAssetDetail(null); setAssetProductivityScore(null); setWoInlineRows([]); return }
    fetch(`${API}/api/dashboard/asset-detail/${selectedAssetId}`)
      .then(r => r.json())
      .then(data => setAssetDetail(data))
      .catch(() => setAssetDetail(null))
    fetch(`${API}/api/dashboard/asset-productivity-score/${selectedAssetId}?range=${range}`)
      .then(r => r.json())
      .then(data => setAssetProductivityScore(data))
      .catch(() => setAssetProductivityScore(null))
    // Fetch WO detail inline untuk tabel bawah
    setWoInlineLoading(true)
    fetch(`${API}/api/dashboard/asset-wo-detail/${selectedAssetId}`)
      .then(r => r.json())
      .then(data => { setWoInlineRows(Array.isArray(data) ? data : []); setWoInlineLoading(false) })
      .catch(() => setWoInlineLoading(false))
  }, [selectedAssetId, range])

  // Asset search logic
  useEffect(() => {
    const handler = (e) => {
      if (assetSearchRef.current && !assetSearchRef.current.contains(e.target)) {
        setAssetSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    setAssetSearchLoading(true)
    const timer = setTimeout(() => {
      fetch(`${API}/api/dashboard/asset-search?q=${encodeURIComponent(assetSearchQuery)}`)
        .then(r => r.json())
        .then(data => { setAssetSearchResults(Array.isArray(data) ? data : []); setAssetSearchLoading(false) })
        .catch(() => setAssetSearchLoading(false))
    }, 200)
    return () => clearTimeout(timer)
  }, [assetSearchQuery])

  // Fetch detail table
  const fetchDetail = useCallback(async () => {
    const params = new URLSearchParams({
      range, page: detailPage, limit: 5,
      search: detailSearch, category: detailCategory,
      sort: 'tag_number', dir: sortOrder || 'none'
    })
    const res = await fetch(`${API}/api/dashboard/maintenance-detail?${params}`)
    const json = await res.json()
    setDetailData(json.data || [])
    setDetailTotal(json.total || 0)
  }, [range, detailPage, detailSearch, detailCategory, sortOrder])

  useEffect(() => { fetchDetail() }, [fetchDetail])

  // Fetch categories list (asset_type_name) untuk filter detail — ikut range
  useEffect(() => {
    fetch(`${API}/api/dashboard/asset-types-list?range=${range}`)
      .then(r => r.json())
      .then(d => setCategories(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [range])

  // Donut chart segments — colors match Assets.jsx status colors
  const donutSegments = () => {
    const total  = assetStatus.reduce((s, r) => s + r.total, 0)
    const circ   = 2 * Math.PI * 35
    let offset   = 55
    return assetStatus.map((row) => {
      const color = statusBg(row.asset_status)
      const dash  = total > 0 ? (row.total / total) * circ : 0
      const seg   = { ...row, dash, gap: circ - dash, offset, color }
      offset     -= dash
      return seg
    })
  }

  const productivityDonutSegments = () => {
    if (!assetProductivityScore) return []
    const s = assetProductivityScore
    const circ = 2 * Math.PI * 35
    const components = [
      { label: 'P2H Score',    value: s.p2h_score,  color: '#6366f1', max: 40 },
      { label: 'Hour Meter',   value: s.hm_score,   color: '#22c55e', max: 30 },
      { label: 'WO Score',     value: s.wo_score,   color: '#f59e0b', max: 20 },
      { label: 'Downtime',     value: s.dt_score,   color: '#ef4444', max: 10 },
    ]
    const total = 100
    let offset = 55
    return components.map(c => {
      const dash = (c.value / total) * circ
      const seg  = { ...c, dash, gap: circ - dash, offset }
      offset    -= dash
      return seg
    })
  }

  const totalAssets = assetStatus.reduce((s, r) => s + r.total, 0)

  return (
    <div className="dashboard-page">

      {/* ── TOP BAR: TABS + RANGE ── */}
      <div className="dash-topbar">
        <div className="dash-tabs">
          <button
            className={`dash-tab-btn ${activeTab === 'asset' ? 'active' : ''}`}
            onClick={() => setActiveTab('asset')}
          >Asset</button>
          <button
            className={`dash-tab-btn ${activeTab === 'sparepart' ? 'active' : ''}`}
            onClick={() => setActiveTab('sparepart')}
          >Spare Part</button>
        </div>
        <div className="dash-range-btns">
          {[30, 90, 365].map(r => (
            <button
              key={r}
              className={`dash-range-btn ${range === r ? 'active' : ''}`}
              onClick={() => setRange(r)}
            >
              {r === 365 ? '1 Year' : `${r} Days`}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'asset' && (
        <>
          {loading ? (
            <Spinner />
          ) : (
            <>
          {/* ── ASSET LIST MODAL ── */}
          <AssetListModal isOpen={showAssetModal} onClose={() => setShowAssetModal(false)} />

          {/* ── UNDER MAINTENANCE MODAL ── */}
          <MaintModal isOpen={showMaintModal} onClose={() => setShowMaintModal(false)} />

          {/* ── AVG DOWNTIME MODAL ── */}
          <AvgDowntimeModal isOpen={showDowntimeModal} onClose={() => setShowDowntimeModal(false)} />

          {/* ── IN USE MODAL ── */}
          <InUseModal isOpen={showUtilModal} onClose={() => setShowUtilModal(false)} />

          {/* ── WO DETAIL MODAL (Asset Maintenance History) ── */}
          <WoDetailModal
            isOpen={woDetailModal.open}
            onClose={() => setWoDetailModal(m => ({ ...m, open: false }))}
            assetId={woDetailModal.assetId}
            assetName={woDetailModal.assetName}
          />

          {/* ── WO INCIDENTS MODAL ── */}
          <WoIncidentModal
            isOpen={woIncidentModal.open}
            onClose={() => setWoIncidentModal(m => ({ ...m, open: false }))}
            monthLabel={woIncidentModal.monthLabel}
            yearMonth={woIncidentModal.yearMonth}
            assetId={woIncidentModal.assetId}
          />

          {/* ── KPI CARDS ── */}
          <div className="dash-kpi-row">
            <KpiCard
              label="Total Active Assets"
              value={fmt(kpi?.total_assets ?? 0)}
              sub={`${kpi?.standby_count ?? 0} currently available`}
              colorClass="kpi-blue"
              icon={KpiIcons.assets}
              clickable
              onClick={() => setShowAssetModal(true)}
            />
            <KpiCard
              label="Under Maintenance"
              value={fmt(kpi?.under_maintenance ?? 0)}
              sub={`${kpi?.maintenance_pct ?? 0}% of total assets`}
              colorClass="kpi-purple"
              icon={KpiIcons.maintenance}
              clickable
              onClick={() => setShowMaintModal(true)}
            />
            <KpiCard
              label="Avg. Downtime"
              value={`${kpi?.avg_downtime_days ?? '0.0'}`}
              sub="hours per WO incident"
              colorClass="kpi-amber"
              icon={KpiIcons.downtime}
              clickable
              onClick={() => setShowDowntimeModal(true)}
            />
            <KpiCard
              label="Utilization Rate"
              value={`${kpi?.utilization_rate ?? 0}%`}
              sub="active assets in use"
              colorClass="kpi-green"
              icon={KpiIcons.utilization}
              clickable
              onClick={() => setShowUtilModal(true)}
            />
          </div>

          {/* ── ASSET SEARCH BOX ── */}
          <div className="asset-search-wrap" ref={assetSearchRef}>
            <div className="asset-search-box" onClick={() => setAssetSearchOpen(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input
                className="asset-search-input"
                type="text"
                placeholder="Search asset name..."
                value={assetSearchQuery}
                onChange={e => { setAssetSearchQuery(e.target.value); setAssetSearchOpen(true) }}
                onFocus={() => setAssetSearchOpen(true)}
              />
              {assetSearchQuery && (
                <button className="asset-search-clear" onClick={(e) => { e.stopPropagation(); setAssetSearchQuery(''); setSelectedAssetId(null); setSelectedAsset(''); setAssetSearchOpen(false) }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              )}
            </div>
            {assetSearchOpen && (
              <div className="asset-search-dropdown">
                {assetSearchLoading ? (
                  <div className="asset-search-item asset-search-empty">Loading...</div>
                ) : assetSearchResults.length === 0 ? (
                  <div className="asset-search-item asset-search-empty">No assets found</div>
                ) : assetSearchResults.map(a => (
                  <div
                    key={a.asset_id}
                    className="asset-search-item"
                    onClick={() => {
                      setAssetSearchQuery(a.asset_name)
                      setSelectedAssetId(a.asset_id)
                      setSelectedAsset(a.asset_id)
                      setAssetSearchOpen(false)
                    }}
                  >
                    <div className="asset-search-name">{a.asset_name}</div>
                    <div className="asset-search-meta">
                      <span className="asset-search-tag">{a.tag_number}</span>
                      <span style={{
                        display: 'inline-block', padding: '2px 7px', borderRadius: '5px',
                        fontSize: '11px', fontWeight: '600', color: 'white', textTransform: 'uppercase',
                        backgroundColor: statusBg(a.asset_status)
                      }}>{a.asset_status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>


          {/* ── ROW 3: Produktivitas + (Donut, Heatmap, Avg Downtime) ── */}
          <div className="dash-grid3">

            {/* Productivity Ranking OR Asset Detail */}
            {selectedAssetId && assetDetail ? (
              <AssetDetailCard detail={assetDetail} />
            ) : (
            <SectionCard
              title="Asset Productivity"
              subtitle={`Score based on active days & inspeksi P2H – ${range} hari`}
              tag={`TOP ${productivity.length}`}
            >
              {productivity.length === 0 ? (
                <div className="dash-empty">No productivity data</div>
              ) : (
                <div className="rank-list">
                  {productivity.map((row) => (
                    <div
                      key={row.asset_id}
                      className="rank-item"
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        setAssetSearchQuery(row.asset_name)
                        setSelectedAssetId(row.asset_id)
                        setSelectedAsset(row.asset_id)
                        setAssetSearchOpen(false)
                      }}
                    >
                      <span className="rank-num rank-rest">
                        {String(row.rank).padStart(2, '0')}
                      </span>
                      <div className="rank-info">
                        <div className="rank-name">{row.asset_name}</div>
                        <div className="rank-type">{row.category} · {row.tag_number}</div>
                      </div>
                      <div className="rank-bar">
                        <div className="rank-bar-fill" style={{ width: `${row.score}%` }} />
                      </div>
                      <span className={`rank-score ${scoreColor(row.score)}`}>{row.score}</span>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
            )}

            {/* Right column */}
            <div className="dash-col-right">

              {/* Donut: Status OR Asset Productivity */}
              {selectedAssetId && assetProductivityScore ? (
                <SectionCard title="Asset Productivity" subtitle="Score breakdown for selected asset">
                  <div className="donut-wrap">
                    <svg width="110" height="110" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="35" fill="none" stroke="#1a1e2a" strokeWidth="16"/>
                      {productivityDonutSegments().map((seg, i) => (
                        <circle key={i}
                          cx="50" cy="50" r="35"
                          fill="none"
                          stroke={seg.color}
                          strokeWidth="16"
                          strokeDasharray={`${seg.dash} ${seg.gap}`}
                          strokeDashoffset={seg.offset}
                        />
                      ))}
                      <text x="50" y="49" textAnchor="middle" fill="#1e293b" fontSize="12" fontWeight="700" fontFamily="monospace">{isNaN(assetProductivityScore.score) ? '?' : `${assetProductivityScore.score}%`}</text>
                      <text x="50" y="61" textAnchor="middle" fill="#64748b" fontSize="7" fontFamily="sans-serif">SCORE</text>
                    </svg>
                    <div className="donut-legend">
                      {productivityDonutSegments().map((seg, i) => (
                        <div key={i} className="legend-row">
                          <span className="legend-dot" style={{ background: seg.color }} />
                          <span className="legend-label">{seg.label}</span>
                          <span className="legend-val" style={{ color: seg.color }}>{isNaN(seg.value) ? '—' : Math.round(seg.value)}<span style={{fontSize:10,color:'#94a3b8'}}>/{seg.max}%</span></span>
                        </div>
                      ))}
                    </div>
                  </div>
                </SectionCard>
              ) : (
              <SectionCard title="Asset Status" subtitle="Current status distribution">
                <div className="donut-wrap">
                  <svg width="110" height="110" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="35" fill="none" stroke="#1a1e2a" strokeWidth="16"/>
                    {donutSegments().map((seg, i) => (
                      <circle key={i}
                        cx="50" cy="50" r="35"
                        fill="none"
                        stroke={seg.color}
                        strokeWidth="16"
                        strokeDasharray={`${seg.dash} ${seg.gap}`}
                        strokeDashoffset={seg.offset}
                      />
                    ))}
                    <text x="50" y="46" textAnchor="middle" fill="#1e293b" fontSize="13" fontWeight="700" fontFamily="monospace">{totalAssets}</text>
                    <text x="50" y="59" textAnchor="middle" fill="#64748b" fontSize="7" fontFamily="sans-serif">TOTAL</text>
                  </svg>
                  <div className="donut-legend">
                    {donutSegments().map((seg, i) => (
                      <div key={i} className="legend-row">
                        <span className="legend-dot" style={{ background: seg.color }} />
                        <span className="legend-label">{seg.asset_status}</span>
                        <span className="legend-val" style={{ color: seg.color }}>{seg.total}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </SectionCard>
              )}

              {/* Heatmap / Line Chart */}
              <SectionCard
                title={heatmapPage === 0 ? 'Maintenance Incidents' : 'Daily Incident Trend'}
                subtitle={heatmapPage === 0 ? 'WO count per month – 12 months' : `WO count per day – ${range} days`}
                className={heatmapPage === 1 ? 'heatmap-linechart-card' : ''}
                right={
                  <div className="heat-nav">
                    <button className="heat-nav-btn" onClick={() => setHeatmapPage(0)} disabled={heatmapPage === 0} title="Monthly Heatmap">‹</button>
                    <div className="heat-nav-dots">
                      <span className={`heat-nav-dot ${heatmapPage === 0 ? 'active' : ''}`} onClick={() => setHeatmapPage(0)} />
                      <span className={`heat-nav-dot ${heatmapPage === 1 ? 'active' : ''}`} onClick={() => setHeatmapPage(1)} />
                    </div>
                    <button className="heat-nav-btn" onClick={() => setHeatmapPage(1)} disabled={heatmapPage === 1} title="Daily Line Chart">›</button>
                  </div>
                }
              >
                {heatmapPage === 0 ? (
                  <>
                    <div className="heat-month-labels">
                      {heatmap.map((m, i) => <span key={i} className="heat-month-label">{m.month_label}</span>)}
                    </div>
                    <div className="heat-grid">
                      {heatmap.map((m, i) => (
                        <div
                          key={i}
                          className={`heat-cell ${intensityClass(m.intensity)}`}
                          title={`${m.month_label}: ${m.total} insiden`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => setWoIncidentModal({ open: true, monthLabel: m.month_label, yearMonth: m.year_month, assetId: selectedAssetId || null })}
                        />
                      ))}
                    </div>
                    <div className="heat-legend">
                      <span>Rare</span>
                      {[0,1,2,3,4,5].map(l => <div key={l} className={`heat-legend-cell heat-${l}`} />)}
                      <span>Frequent</span>
                    </div>
                  </>
                ) : (
                  <LineChart data={dailyChart} />
                )}
              </SectionCard>

              {/* Avg Downtime per Kategori — hidden when asset selected */}
              {!selectedAssetId && (
              <SectionCard
                title="Avg. Downtime per Category"
                subtitle="Average downtime hours per incident"
                right={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      ref={avgBtnRef}
                      className={`trk-filter-btn${avgDropOpen ? ' active' : ''}`}
                      onClick={() => setAvgDropOpen(o => !o)}
                    >
                      {avgWoType || 'All'}
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                    </button>
                    <DashDropdown
                      isOpen={avgDropOpen}
                      onClose={() => setAvgDropOpen(false)}
                      anchorRef={avgBtnRef}
                      options={['Preventive', 'Corrective']}
                      selected={avgWoType}
                      onChange={setAvgWoType}
                    />
                    <span className="dash-tag">{range} DAYS</span>
                  </div>
                }
              >
                {avgDowntime.length === 0 ? (
                  <div className="dash-empty">No data available</div>
                ) : (
                  <div className="downtime-list">
                    {avgDowntime.map((row, i) => {
                      const cls = row.pct >= 70 ? 'dt-red' : row.pct >= 40 ? 'dt-amber' : 'dt-green'
                      const fillCls = row.pct >= 70 ? 'dt-fill-red' : row.pct >= 40 ? 'dt-fill-amber' : 'dt-fill-green'
                      return (
                        <div key={i} className="downtime-row">
                          <div className="downtime-header">
                            <span className="downtime-label-full">{row.category}</span>
                            <span className={`downtime-val ${cls}`}>{row.avg_hours} hrs</span>
                          </div>
                          <div className="downtime-track">
                            <div
                              className={`downtime-fill ${fillCls}`}
                              style={{ width: `${row.pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                    <div className="downtime-insight">
                      <span className="dot red" />
                      <span><strong>{avgDowntime[0]?.category}</strong> longest downtime &nbsp;·&nbsp; </span>
                      <span className="dot green" />
                      <span><strong>{avgDowntime[avgDowntime.length - 1]?.category}</strong> most efficient</span>
                    </div>
                  </div>
                )}
              </SectionCard>
              )}

            </div>
          </div>

          <div className="dash-grid2">

            {/* Location History */}
            <SectionCard
              className="loc-history-card"
              title="Asset Location History"
              subtitle="Location transfer history per asset"
              action={
                <>
                  <button
                    ref={locBtnRef}
                    className={`trk-filter-btn${locDropOpen ? ' active' : ''}`}
                    onClick={() => setLocDropOpen(o => !o)}
                  >
                    {selectedAsset === '' ? 'All Assets' : (assetsList.find(a => a.asset_id === selectedAsset)?.asset_name || 'Select Asset')}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                  </button>
                  {locDropOpen && (
                    <div className="trk-modal-overlay active" onClick={() => setLocDropOpen(false)}>
                      <div
                        className="trk-modal-content animating-in"
                        style={{ position: 'fixed', top: locBtnRef.current?.getBoundingClientRect().bottom + 6, left: locBtnRef.current?.getBoundingClientRect().left, minWidth: 220, maxHeight: 280, overflowY: 'auto' }}
                        onClick={e => e.stopPropagation()}
                      >
                        <div className="trk-type-option" onClick={() => { setSelectedAsset(''); setLocDropOpen(false) }}>
                          <input type="checkbox" className="trk-type-checkbox" checked={selectedAsset === ''} readOnly />
                          <label>All Assets</label>
                        </div>
                        {assetsList.map(a => (
                          <div className="trk-type-option" key={a.asset_id} onClick={() => { setSelectedAsset(a.asset_id); setLocDropOpen(false) }}>
                            <input type="checkbox" className="trk-type-checkbox" checked={selectedAsset === a.asset_id} readOnly />
                            <label>{a.asset_name} – {a.tag_number}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              }
            >
              <div className="loc-timeline" style={{ maxHeight: '260px', overflowY: 'auto', paddingRight: '4px' }}>
                {locHistory.length === 0 ? (
                  <div className="dash-empty">No location transfer data</div>
                ) : locHistory.map((row, i) => (
                  <div key={i} className="loc-item" style={{ paddingRight: '8px' }}>
                    <div className={`loc-dot ${row.end_date ? 'dot-past' : 'dot-active'}`} />
                    <div className="loc-info">
                      <div className="loc-name">
                        {[row.site, row.area, row.sub_area].filter(Boolean).join(' › ') || 'Unknown Location'}
                      </div>
                      <div className="loc-meta">
                        {selectedAsset === '' && row.asset_name && (
                          <span style={{ fontWeight: 600, color: '#6366f1', marginRight: 6 }}>{row.asset_name} ({row.tag_number})</span>
                        )}
                        {row.start_date ? new Date(row.start_date).toLocaleDateString('en-US', { day:'2-digit', month:'short', year:'numeric' }) : '–'}
                        {' '}&nbsp;→&nbsp;{' '}
                        {row.end_date ? new Date(row.end_date).toLocaleDateString('en-US', { day:'2-digit', month:'short', year:'numeric' }) : 'present'}
                        {row.project_code ? ` · ${row.project_code}` : ''}
                      </div>
                    </div>
                    <span className={`dash-pill ${row.end_date ? 'pill-idle' : 'pill-active'}`}>
                      {row.end_date ? 'Done' : 'Active'}
                    </span>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Maintenance per Category OR Asset Tracking */}
            {selectedAssetId ? (
              <AssetTrackingCard assetId={selectedAssetId} assetName={assetSearchQuery} navigate={navigate} />
            ) : (
            <SectionCard
              title="Maintenance by Type"
              subtitle="Work order frequency by type"
              right={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    ref={maintBtnRef}
                    className={`trk-filter-btn${maintDropOpen ? ' active' : ''}`}
                    onClick={() => setMaintDropOpen(o => !o)}
                  >
                    {maintWoType || 'All'}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                  </button>
                  <DashDropdown
                    isOpen={maintDropOpen}
                    onClose={() => setMaintDropOpen(false)}
                    anchorRef={maintBtnRef}
                    options={['Preventive', 'Corrective']}
                    selected={maintWoType}
                    onChange={setMaintWoType}
                  />
                  <span className="dash-tag">{range} DAYS</span>
                </div>
              }
            >
              {maintCat.length === 0 ? (
                <div className="dash-empty">No work order data</div>
              ) : (
                <>
                  <div className="bar-chart">
                    {maintCat.map((row, i) => (
                      <div key={i} className="bar-row">
                        <div className="bar-label" title={row.category}>{row.category}</div>
                        <div className="bar-track">
                          <div
                            className={`bar-fill ${row.pct >= 70 ? 'bar-high' : row.pct >= 40 ? 'bar-med' : 'bar-low'}`}
                            style={{ width: `${row.pct}%` }}
                          >
                            {row.pct > 15 ? row.total_wo : ''}
                          </div>
                        </div>
                        <span className="bar-count">{row.total_wo}×</span>
                      </div>
                    ))}
                  </div>
                  <div className="bar-insight">
                    <span><span className="dot red" />Most frequent: <strong>{maintCat[0]?.category}</strong></span>
                    <span><span className="dot green" />Least frequent: <strong>{maintCat[maintCat.length - 1]?.category}</strong></span>
                  </div>
                </>
              )}
            </SectionCard>
            )}

          </div>

          {/* ── ROW 5: Detail Table ── */}
          <SectionCard
            title="Asset Maintenance History Detail"
            subtitle={selectedAssetId
              ? `Work order history — ${assetSearchQuery}`
              : "WO frequency, total downtime, and productivity score"
            }
            action={!selectedAssetId ? (
              <div className="detail-filters">
                <button
                  ref={catBtnRef}
                  className={`trk-filter-btn${catDropOpen ? ' active' : ''}`}
                  onClick={() => setCatDropOpen(o => !o)}
                >
                  {detailCategory || 'All Categories'}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                </button>
                <DashDropdown
                  isOpen={catDropOpen}
                  onClose={() => setCatDropOpen(false)}
                  anchorRef={catBtnRef}
                  options={categories}
                  selected={detailCategory}
                  onChange={v => { setDetailCategory(v); setDetailPage(1) }}
                  allLabel="All Categories"
                />
                <div className="detail-search-wrap">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                  <input
                    className="detail-search-input"
                    placeholder="Search asset name..."
                    value={detailSearch}
                    onChange={e => { setDetailSearch(e.target.value); setDetailPage(1) }}
                  />
                </div>
              </div>
            ) : null}
          >
            {selectedAssetId ? (
              /* ── Inline WO Detail (saat asset dipilih) ── */
              <div className="detail-table-wrap">
                {woInlineLoading ? (
                  <div className="detail-empty">Loading...</div>
                ) : woInlineRows.length === 0 ? (
                  <div className="detail-empty">No work orders found for this asset.</div>
                ) : (
                  <table className="detail-table wo-inline-table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Description</th>
                        <th>Planned Start</th>
                        <th>Planned Finish</th>
                        <th>Actual Start</th>
                        <th>Actual Finish</th>
                        <th>Downtime</th>
                        <th>Running Test</th>
                        <th>Status</th>
                        <th>Priority</th>
                      </tr>
                    </thead>
                    <tbody>
                      {woInlineRows.map((r, i) => {
                        const fmtDate = (val) => { if (!val) return '—'; const s = String(val).split('T')[0]; return s === '0000-00-00' ? '—' : s }
                        const woTypeBg = (t) => t === 'Corrective' ? '#ef4444' : '#3b82f6'
                        const priorityBg = (p) => p === 'High' ? '#ef4444' : p === 'Medium' ? '#f59e0b' : '#22c55e'
                        const woStatusBg = (s) => s === 'Completed' ? '#22c55e' : s === 'In Progress' ? '#3b82f6' : s === 'Pending' ? '#f59e0b' : '#94a3b8'
                        const runningTestBg = (v) => v === 'Pass' ? '#22c55e' : v === 'Ongoing' ? '#3b82f6' : v === 'Denied' ? '#ef4444' : '#94a3b8'
                        return (
                          <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td>
                              <span style={{ display:'inline-block', padding:'3px 8px', borderRadius:'6px', fontSize:'11px', fontWeight:'600', color:'white', textTransform:'uppercase', backgroundColor: woTypeBg(r.wo_type) }}>
                                {r.wo_type}
                              </span>
                            </td>
                            <td style={{ fontSize:12, color:'#475569', minWidth:140 }}>{r.wo_description || '—'}</td>
                            <td style={{ whiteSpace:'nowrap', fontSize:13, color:'#64748b' }}>{fmtDate(r.planned_start)}</td>
                            <td style={{ whiteSpace:'nowrap', fontSize:13, color:'#64748b' }}>{fmtDate(r.planned_finish)}</td>
                            <td style={{ whiteSpace:'nowrap', fontSize:13, color:'#64748b' }}>{fmtDate(r.actual_start)}</td>
                            <td style={{ whiteSpace:'nowrap', fontSize:13, color:'#64748b' }}>{fmtDate(r.actual_finish)}</td>
                            <td style={{ whiteSpace:'nowrap', fontSize:13, fontWeight:600, color:'#f59e0b' }}>
                              {r.downtime_hours && r.downtime_hours !== '00:00:00' ? r.downtime_hours.substring(0,5) : '—'}
                            </td>
                            <td>
                              {r.running_test ? (
                                <span style={{ display:'inline-block', padding:'3px 8px', borderRadius:'6px', fontSize:'11px', fontWeight:'600', color:'white', textTransform:'uppercase', backgroundColor: runningTestBg(r.running_test) }}>
                                  {r.running_test}
                                </span>
                              ) : '—'}
                            </td>
                            <td>
                              <span style={{ display:'inline-block', padding:'3px 8px', borderRadius:'6px', fontSize:'11px', fontWeight:'600', color:'white', textTransform:'uppercase', backgroundColor: woStatusBg(r.wo_status) }}>
                                {r.wo_status}
                              </span>
                            </td>
                            <td>
                              <span style={{ display:'inline-block', padding:'3px 8px', borderRadius:'6px', fontSize:'11px', fontWeight:'600', color:'white', textTransform:'uppercase', backgroundColor: priorityBg(r.priority) }}>
                                {r.priority}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            ) : (
              /* ── Summary Table (saat tidak ada asset dipilih) ── */
              <>
            <div className="detail-table-wrap">
              <table className="detail-table">
                <thead>
                  <tr>
                    <th
                      style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                      onClick={() => { setSortOrder(prev => prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc'); setDetailPage(1) }}
                    >Tag # <SortIcon sortOrder={sortOrder} /></th>
                    <th>Asset Name</th>
                    <th>Category</th>
                    <th>Last Location</th>
                    <th>WO Count</th>
                    <th>Total Downtime</th>
                    <th>Productivity</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {detailData.length === 0 ? (
                    <tr><td colSpan={8} className="detail-empty">No data available</td></tr>
                  ) : detailData.map((row) => (
                    <tr
                      key={row.asset_id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setWoDetailModal({ open: true, assetId: row.asset_id, assetName: row.asset_name })}
                    >
                      <td className="td-tag">{row.tag_number}</td>
                      <td>{highlightText(row.asset_name, detailSearch)}</td>
                      <td className="td-muted">{row.category}</td>
                      <td className="td-muted">{row.last_location || '–'}</td>
                      <td className="td-center td-mono">{row.total_wo}×</td>
                      <td className={`td-mono ${row.total_downtime_hours > 30 ? 'dt-red' : row.total_downtime_hours > 10 ? 'dt-amber' : 'dt-green'}`}>
                        {row.total_downtime_hours || 0} hr
                      </td>
                      <td>
                        <div className="score-wrap">
                          <div className="score-bar">
                            <div
                              className={`score-fill ${scoreColor(row.productivity_score)}`}
                              style={{ width: `${row.productivity_score}%` }}
                            />
                          </div>
                          <span className={`score-num ${scoreColor(row.productivity_score)}`}>
                            {row.productivity_score}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: 'white',
                          textTransform: 'uppercase',
                          backgroundColor: statusBg(row.asset_status)
                        }}>
                          {row.asset_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="detail-pagination">
              <span className="pagination-info">
                {detailTotal} records · Page {detailPage} of {Math.ceil(detailTotal / 5) || 1}
              </span>
              <div className="pagination-btns">
                <button
                  className="pg-btn"
                  disabled={detailPage <= 1}
                  onClick={() => setDetailPage(p => p - 1)}
                >← Prev</button>
                <button
                  className="pg-btn"
                  disabled={detailPage >= Math.ceil(detailTotal / 5)}
                  onClick={() => setDetailPage(p => p + 1)}
                >Next →</button>
              </div>
            </div>
              </>
            )}
          </SectionCard>

            </>
          )}
        </>
      )}

      {activeTab === 'sparepart' && (
        <div className="dash-sparepart-empty">
          <div className="dash-sparepart-icon">🔧</div>
          <p className="dash-sparepart-title">Spare Part Dashboard</p>
          <p className="dash-sparepart-sub">This feature is under development</p>
        </div>
      )}

    </div>
  )
}