import { useState, useEffect, useCallback, useRef } from 'react'
import './Dashboard.css'

const API = 'http://localhost:3000'

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

function KpiCard({ label, value, sub, colorClass, icon }) {
  return (
    <div className={`kpi-card ${colorClass}`}>
      <div className="kpi-icon">{icon}</div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-sub">{sub}</div>
    </div>
  )
}

// KPI SVG icons
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

function SectionCard({ title, subtitle, tag, children, action, right }) {
  return (
    <div className="dash-card">
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

  const [activeTab, setActiveTab]       = useState('asset')
  const [loading, setLoading]           = useState(true)

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
        fetch(`${API}/api/dashboard/maintenance-heatmap`).then(r => r.json()),
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
  }, [selectedAsset])

  useEffect(() => { fetchAll(range) }, [range])

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
    const res = await fetch(`${API}/api/dashboard/maintenance-daily?range=${range}`)
    const data = await res.json()
    setDailyChart(Array.isArray(data) ? data : [])
  }, [range])

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

  // Fetch detail table
  const fetchDetail = useCallback(async () => {
    const params = new URLSearchParams({
      range, page: detailPage, limit: 10,
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
          {/* ── KPI CARDS ── */}
          <div className="dash-kpi-row">
            <KpiCard
              label="Total Active Assets"
              value={fmt(kpi?.total_assets ?? 0)}
              sub={`${kpi?.in_use ?? 0} currently In Use`}
              colorClass="kpi-blue"
              icon={KpiIcons.assets}
            />
            <KpiCard
              label="Under Maintenance"
              value={fmt(kpi?.under_maintenance ?? 0)}
              sub={`${kpi?.maintenance_pct ?? 0}% of total assets`}
              colorClass="kpi-purple"
              icon={KpiIcons.maintenance}
            />
            <KpiCard
              label="Avg. Downtime"
              value={`${kpi?.avg_downtime_days ?? '0.0'}`}
              sub="hours per WO incident"
              colorClass="kpi-amber"
              icon={KpiIcons.downtime}
            />
            <KpiCard
              label="Utilization Rate"
              value={`${kpi?.utilization_rate ?? 0}%`}
              sub="active assets in use"
              colorClass="kpi-green"
              icon={KpiIcons.utilization}
            />
          </div>

          {/* ── ROW 2: Lokasi History + Maintenance per Kategori ── */}
          <div className="dash-grid2">

            {/* Location History */}
            <SectionCard
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
              <div className="loc-timeline" style={{ maxHeight: selectedAsset === '' ? '240px' : '320px', paddingRight: '4px' }}>
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

            {/* Maintenance per Category */}
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

          </div>

          {/* ── ROW 3: Produktivitas + (Donut, Heatmap, Avg Downtime) ── */}
          <div className="dash-grid3">

            {/* Productivity Ranking */}
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
                    <div key={row.asset_id} className="rank-item">
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

            {/* Right column */}
            <div className="dash-col-right">

              {/* Donut: Status */}
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
                    <text x="50" y="46" textAnchor="middle" fill="#e2e8f0" fontSize="13" fontWeight="700" fontFamily="monospace">{totalAssets}</text>
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

              {/* Heatmap / Line Chart */}
              <SectionCard
                title={heatmapPage === 0 ? 'Maintenance Incidents' : 'Daily Incident Trend'}
                subtitle={heatmapPage === 0 ? 'WO count per month – 12 months' : `WO count per day – ${range} days`}
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
                        <div key={i} className={`heat-cell ${intensityClass(m.intensity)}`} title={`${m.month_label}: ${m.total} insiden`} />
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

              {/* Avg Downtime per Kategori */}
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

            </div>
          </div>

          {/* ── ROW 5: Detail Table ── */}
          <SectionCard
            title="Asset Maintenance History Detail"
            subtitle="WO frequency, total downtime, and productivity score"
            action={
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
            }
          >
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
                    <tr key={row.asset_id}>
                      <td className="td-tag">{row.tag_number}</td>
                      <td>{highlightText(row.asset_name, detailSearch)}</td>
                      <td className="td-muted">{row.category}</td>
                      <td className="td-muted">{row.last_location || '–'}</td>
                      <td className="td-center td-mono">{row.total_wo}×</td>
                      <td className={`td-mono ${row.total_downtime_days > 30 ? 'dt-red' : row.total_downtime_days > 10 ? 'dt-amber' : 'dt-green'}`}>
                        {row.total_downtime_days || 0} hr
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
                {detailTotal} records · Page {detailPage} of {Math.ceil(detailTotal / 10) || 1}
              </span>
              <div className="pagination-btns">
                <button
                  className="pg-btn"
                  disabled={detailPage <= 1}
                  onClick={() => setDetailPage(p => p - 1)}
                >← Prev</button>
                <button
                  className="pg-btn"
                  disabled={detailPage >= Math.ceil(detailTotal / 10)}
                  onClick={() => setDetailPage(p => p + 1)}
                >Next →</button>
              </div>
            </div>
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