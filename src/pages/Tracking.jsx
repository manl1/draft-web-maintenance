import { useState, useEffect, useRef } from 'react'
import flatpickr from 'flatpickr'
import 'flatpickr/dist/flatpickr.min.css'
import './Tracking.css'

const API = 'http://localhost:3000'

// ===== Badge =====
function Badge({ text, color }) {
  if (!text) return <span style={{ color: '#94a3b8' }}>-</span>
  return (
    <span style={{
      display: 'inline-block', padding: '4px 10px', borderRadius: '6px',
      backgroundColor: color, color: 'white', fontSize: '11px', fontWeight: '700',
      textTransform: 'uppercase', whiteSpace: 'nowrap'
    }}>{text}</span>
  )
}

// ===== Result Badge =====
function ResultBadge({ text }) {
  const isGood = text?.toLowerCase().includes('baik') || text?.toLowerCase().includes('good')
  const color = isGood ? '#22c55e' : '#ef4444'
  return (
    <span style={{
      display: 'inline-block', padding: '4px 10px', borderRadius: '6px',
      backgroundColor: color, color: 'white', fontSize: '11px', fontWeight: '700',
      whiteSpace: 'nowrap'
    }}>{text || '-'}</span>
  )
}

// ===== CheckResult — dua lingkaran Baik/Rusak =====
function CheckResult({ value }) {
  const isGood = value?.toLowerCase().includes('baik') || value?.toLowerCase().includes('good')
  const isBroken = value?.toLowerCase().includes('rusak') || value?.toLowerCase().includes('broken')
  return (
    <div className="trk-check-result">
      <span className={`trk-check-option ${isGood ? 'checked good' : ''}`}>
        <span className="trk-check-circle">
          {isGood && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
        </span>
        Baik / Good
      </span>
      <span className={`trk-check-option ${isBroken ? 'checked broken' : ''}`}>
        <span className="trk-check-circle">
          {isBroken && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
        </span>
        Rusak / Broken
      </span>
    </div>
  )
}

// ===== SlideDown =====
function SlideDown({ open, children }) {
  const ref = useRef(null)
  const initialized = useRef(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
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
  return <div ref={ref} style={{ overflow: 'hidden' }}>{children}</div>
}

// ===== Detail Row (child) =====
function DetailRow({ report }) {
  const [details, setDetails] = useState([])
  const [loading, setLoading] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const load = () => {
    if (loaded) return
    setLoading(true)
    fetch(`${API}/api/tracking/${report.inspection_id}/details`)
      .then(r => r.json())
      .then(data => { setDetails(Array.isArray(data) ? data : []); setLoaded(true); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const extraInfos = [
    { label: 'Operator',      value: report.operator_name || '-',                                     cls: 'trk-extra-col-operator'     },
    { label: 'Work Shift',    value: report.work_shift || '-',                                        cls: 'trk-extra-col-workshift'    },
    { label: 'Fit to Work',   value: report.fit_to_work ? 'Yes' : 'No',   isFit: true,               cls: 'trk-extra-col-fittowork'    },
    { label: 'Sleep Hours',   value: report.sleep_hours != null ? `${report.sleep_hours} hours` : '-', cls: 'trk-extra-col-sleephours'   },
    { label: 'Taking Medicine', value: report.is_taking_medicine ? 'Yes' : 'No',                     cls: 'trk-extra-col-medicine'     },
    { label: 'Medicine Name', value: report.medicine_name || '-',                                     cls: 'trk-extra-col-medicinename' },
    { label: 'Remarks',       value: report.inspect_remarks || '-',                                   cls: 'trk-extra-col-remarks'      },
  ]

  return (
    <div className="trk-detail-wrap">
      {/* Extra info rows — label: value */}
      <div className="trk-extra-info-wrap">
        {extraInfos.map((info, i) => (
          <div key={i} className={`trk-extra-info-row ${info.cls}`}>
            <span className="trk-extra-info-label">{info.label}</span>
            <span className="trk-extra-info-value">
              {info.isResult
                ? <ResultBadge text={info.value} />
                : info.isFit
                  ? <span className={`trk-fit-badge ${report.fit_to_work ? 'fit' : 'notfit'}`}>{info.value}</span>
                  : info.value}
            </span>
          </div>
        ))}
      </div>

      {/* Detail header + body as ONE table so columns align perfectly */}
      <div className="trk-detail-scroll">
        {loading ? (
          <div className="trk-detail-loading">Loading...</div>
        ) : details.length === 0 ? (
          <div className="trk-detail-empty">No inspection details found.</div>
        ) : (
          <table className="trk-detail-table">
            <thead>
              <tr>
                <th className="trk-detail-th-q">Question</th>
                <th className="trk-detail-th-r">Result</th>
              </tr>
            </thead>
            <tbody>
              {details.map((d, i) => {
                const TEXT_ONLY_QUESTIONS = [
                  'nomor kendaraan',
                  'km / hm kendaraan',
                  'km / hm servis selanjutnya',
                ]
                const isTextOnly = TEXT_ONLY_QUESTIONS.some(q =>
                  d.question?.toLowerCase().trim() === q
                )
                return (
                  <tr key={i} className="trk-detail-row">
                    <td className="trk-detail-q">{d.question || '-'}</td>
                    <td className="trk-detail-r">
                      {isTextOnly
                        ? <span style={{ fontSize: 13, color: '#334155' }}>{d.question_result || '-'}</span>
                        : <CheckResult value={d.question_result} />
                      }
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ===== Type Modal (mirip PriorityModal di WorkOrder) =====
function TypeModal({ isOpen, onClose, anchorRef, types, selected, onChange }) {
  const [pos, setPos] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (isOpen && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + 8, left: rect.left })
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="trk-modal-overlay active" onClick={onClose}>
      <div
        className="trk-modal-content animating-in"
        style={{ position: 'fixed', top: pos.top, left: pos.left }}
        onClick={e => e.stopPropagation()}
      >
        <div className="trk-type-option" onClick={() => onChange('')}>
          <input type="checkbox" className="trk-type-checkbox" checked={!selected} readOnly />
          <label>All Types</label>
        </div>
        {types.map(t => (
          <div className="trk-type-option" key={t} onClick={() => onChange(t)}>
            <input type="checkbox" className="trk-type-checkbox" checked={selected === t} readOnly />
            <label>{t}</label>
          </div>
        ))}
      </div>
    </div>
  )
}

// ===== Shift Modal =====
function ShiftModal({ isOpen, onClose, anchorRef, selected, onChange }) {
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const shifts = ['Shift 1', 'Shift 2', 'Shift 3']

  useEffect(() => {
    if (isOpen && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + 8, left: rect.left })
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="trk-modal-overlay active" onClick={onClose}>
      <div className="trk-modal-content animating-in"
        style={{ position: 'fixed', top: pos.top, left: pos.left }}
        onClick={e => e.stopPropagation()}>
        {shifts.map(s => (
          <div className="trk-type-option" key={s} onClick={() => onChange(s)}>
            <input type="checkbox" className="trk-type-checkbox" checked={selected === s} readOnly />
            <label>{s}</label>
          </div>
        ))}
      </div>
    </div>
  )
}

// ===== Status Icon =====
function StatusIcon({ hasP2h }) {
  if (hasP2h) return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', backgroundColor: '#dcfce7', flexShrink: 0 }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
    </span>
  )
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', backgroundColor: '#fee2e2', flexShrink: 0 }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </span>
  )
}


// ===== Utilization Rate Badge =====
function UtilizationBadge({ value, max }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  const color =
    pct <= 25 ? '#22c55e' :
    pct <= 50 ? '#eab308' :
    pct <= 75 ? '#f97316' : '#ef4444'
  return (
    <span style={{
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: '6px',
      backgroundColor: color,
      color: 'white',
      fontSize: '12px',
      fontWeight: '700',
      whiteSpace: 'nowrap',
      minWidth: '52px',
      textAlign: 'center'
    }}>{pct}%</span>
  )
}

// ===== Hour Meter Tab =====
function HourMeterTab({ types }) {
  const HM_MAX = 4000

  // ---- Tabel utama state ----
  const [hmRows, setHmRows] = useState([])
  const [hmLoading, setHmLoading] = useState(false)
  const [hmReady, setHmReady] = useState(false)
  const [hmSearch, setHmSearch] = useState('')
  const [hmTypeFilter, setHmTypeFilter] = useState('')
  const [hmSortOrder, setHmSortOrder] = useState(null)
  const [showHmTypeDropdown, setShowHmTypeDropdown] = useState(false)
  const [hmTypePosState, setHmTypePosState] = useState({ top: 0, left: 0 })
  const hmTypeBtnRef = useRef(null)

  // ---- Log filter state (untuk expand row) ----
  const [logDateStart, setLogDateStart] = useState('')
  const [logDateEnd, setLogDateEnd] = useState('')
  const [logShift, setLogShift] = useState('')
  const [showLogDateDropdown, setShowLogDateDropdown] = useState(false)
  const [showLogShiftDropdown, setShowLogShiftDropdown] = useState(false)
  const [logDatePos, setLogDatePos] = useState({ top: 0, left: 0 })
  const [logShiftPos, setLogShiftPos] = useState({ top: 0, left: 0 })
  const logDateBtnRef = useRef(null)
  const logShiftBtnRef = useRef(null)
  const logDateStartRef = useRef(null)
  const logDateEndRef = useRef(null)
  const logStartFp = useRef(null)
  const logEndFp = useRef(null)

  // ---- Expand row state ----
  const [expandedHmRows, setExpandedHmRows] = useState({})
  const [logData, setLogData] = useState({}) // { asset_name: [rows] }
  const [logLoading, setLogLoading] = useState({})

  // ---- Fetch tabel utama (no date/shift filter, only type) ----
  const fetchHourMeter = () => {
    setHmReady(false)
    setHmLoading(true)
    const fetchStart = Date.now()
    const params = new URLSearchParams()
    if (hmTypeFilter) params.append('type', hmTypeFilter)
    fetch(`${API}/api/tracking/hour-meter?${params}`)
      .then(r => r.json())
      .then(data => {
        const elapsed = Date.now() - fetchStart
        const remaining = Math.max(0, 400 - elapsed)
        setTimeout(() => {
          setHmRows(Array.isArray(data) ? data : [])
          setHmLoading(false)
          setTimeout(() => setHmReady(true), 50)
        }, remaining)
      })
      .catch(() => { setHmLoading(false); setHmReady(true) })
  }

  useEffect(() => { fetchHourMeter() }, [])
  useEffect(() => { fetchHourMeter() }, [hmTypeFilter])

  // ---- Fetch log for one asset ----
  const fetchLog = (assetName, onDone) => {
    setLogLoading(prev => ({ ...prev, [assetName]: true }))
    const params = new URLSearchParams()
    params.append('asset_name', assetName)
    if (logDateStart) params.append('date_start', logDateStart)
    if (logDateEnd)   params.append('date_end', logDateEnd)
    if (logShift)     params.append('shift', logShift)
    fetch(`${API}/api/tracking/hour-meter-log?${params}`)
      .then(r => r.json())
      .then(data => {
        setLogData(prev => ({ ...prev, [assetName]: Array.isArray(data) ? data : [] }))
        setLogLoading(prev => ({ ...prev, [assetName]: false }))
        if (onDone) onDone()
      })
      .catch(() => {
        setLogLoading(prev => ({ ...prev, [assetName]: false }))
        if (onDone) onDone()
      })
  }

  // Refetch all expanded logs when log filters change
  useEffect(() => {
    Object.keys(expandedHmRows).forEach(assetName => {
      if (expandedHmRows[assetName]) {
        setSlideOpenHm(prev => ({ ...prev, [assetName]: false }))
        fetchLog(assetName, () => {
          setSlideOpenHm(prev => ({ ...prev, [assetName]: true }))
        })
      }
    })
  }, [logDateStart, logDateEnd, logShift])

  // Flatpickr for log date dropdown
  useEffect(() => {
    if (!showLogDateDropdown) return
    setTimeout(() => {
      if (logDateStartRef.current) {
        logStartFp.current = flatpickr(logDateStartRef.current, {
          dateFormat: 'Y-m-d', allowInput: true,
          onChange: ([d]) => setLogDateStart(d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` : '')
        })
      }
      if (logDateEndRef.current) {
        logEndFp.current = flatpickr(logDateEndRef.current, {
          dateFormat: 'Y-m-d', allowInput: true,
          onChange: ([d]) => setLogDateEnd(d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` : '')
        })
      }
    }, 50)
    return () => { logStartFp.current?.destroy(); logEndFp.current?.destroy() }
  }, [showLogDateDropdown])

  // slideOpen controls the actual SlideDown animation
  // only becomes true after data is ready, preventing height miscalculation
  const [slideOpenHm, setSlideOpenHm] = useState({})

  const toggleHmRow = (assetName) => {
    const isCurrentlyOpen = !!expandedHmRows[assetName]
    if (isCurrentlyOpen) {
      // Close: animate first
      setSlideOpenHm(prev => ({ ...prev, [assetName]: false }))
      setExpandedHmRows(prev => ({ ...prev, [assetName]: false }))
    } else {
      // Open: expand row immediately (renders loading state), fetch data, open slide after data ready
      setExpandedHmRows(prev => ({ ...prev, [assetName]: true }))
      fetchLog(assetName, () => {
        // callback after data loaded — now trigger slide animation
        setSlideOpenHm(prev => ({ ...prev, [assetName]: true }))
      })
    }
  }

  const toggleHmSort = () => setHmSortOrder(prev => prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc')

  const getTagNum = (tag) => {
    const match = String(tag || '').match(/(\d+)$/)
    return match ? parseInt(match[1], 10) : 0
  }

  const hmFiltered = hmRows.filter(r =>
    !hmSearch.trim() || r.asset_name?.toLowerCase().includes(hmSearch.toLowerCase())
  )
  const hmDisplayed = hmSortOrder
    ? [...hmFiltered].sort((a, b) =>
        hmSortOrder === 'asc'
          ? getTagNum(a.tag_number) - getTagNum(b.tag_number)
          : getTagNum(b.tag_number) - getTagNum(a.tag_number)
      )
    : hmFiltered

  const openTypeDropdown = () => {
    if (hmTypeBtnRef.current) {
      const rect = hmTypeBtnRef.current.getBoundingClientRect()
      setHmTypePosState({ top: rect.bottom + 8, left: rect.left })
    }
    setShowHmTypeDropdown(v => !v)
  }

  const openLogDateDropdown = () => {
    if (logDateBtnRef.current) {
      const rect = logDateBtnRef.current.getBoundingClientRect()
      setLogDatePos({ top: rect.bottom + 8, left: rect.left })
    }
    setShowLogDateDropdown(v => !v)
  }

  const openLogShiftDropdown = () => {
    if (logShiftBtnRef.current) {
      const rect = logShiftBtnRef.current.getBoundingClientRect()
      setLogShiftPos({ top: rect.bottom + 8, left: rect.left })
    }
    setShowLogShiftDropdown(v => !v)
  }

  const logDateLabel = logDateStart || logDateEnd
    ? [logDateStart, logDateEnd].filter(Boolean).join(' → ')
    : 'Date'

  const HM_COLS = 5 // jumlah kolom tabel utama

  return (
    <>
      {/* Toolbar */}
      <div className="trk-toolbar">
        <div className="trk-toolbar-left">

          {/* Type filter — memfilter tabel utama */}
          <div className="trk-type-dropdown-wrap">
            <button ref={hmTypeBtnRef} className={`trk-filter-btn ${hmTypeFilter ? 'active' : ''}`} onClick={openTypeDropdown}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
              Type{hmTypeFilter ? ` · ${hmTypeFilter}` : ''}
            </button>
            {showHmTypeDropdown && (
              <div className="trk-modal-overlay active" onClick={() => setShowHmTypeDropdown(false)}>
                <div className="trk-modal-content animating-in"
                  style={{ position: 'fixed', top: hmTypePosState.top, left: hmTypePosState.left }}
                  onClick={e => e.stopPropagation()}>
                  <div className="trk-type-option" onClick={() => { setHmTypeFilter(''); setShowHmTypeDropdown(false) }}>
                    <input type="checkbox" className="trk-type-checkbox" checked={!hmTypeFilter} readOnly />
                    <label>All Types</label>
                  </div>
                  {types.map(t => (
                    <div className="trk-type-option" key={t} onClick={() => { setHmTypeFilter(t); setShowHmTypeDropdown(false) }}>
                      <input type="checkbox" className="trk-type-checkbox" checked={hmTypeFilter === t} readOnly />
                      <label>{t}</label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Date filter — untuk log historis */}
          <div className="trk-type-dropdown-wrap">
            <button ref={logDateBtnRef} className={`trk-filter-btn ${(logDateStart || logDateEnd) ? 'active' : ''}`} onClick={openLogDateDropdown}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {logDateLabel}
            </button>
            {showLogDateDropdown && (
              <div className="trk-modal-overlay active" onClick={() => setShowLogDateDropdown(false)}>
                <div className="trk-modal-content animating-in"
                  style={{ position: 'fixed', top: logDatePos.top, left: logDatePos.left, minWidth: '240px', padding: '16px' }}
                  onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>Start Date</div>
                      <input ref={logDateStartRef} type="text" placeholder="yyyy-mm-dd"
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>End Date</div>
                      <input ref={logDateEndRef} type="text" placeholder="yyyy-mm-dd"
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <button onClick={() => setShowLogDateDropdown(false)}
                        style={{ flex: 1, padding: '8px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Apply</button>
                      <button onClick={() => { setLogDateStart(''); setLogDateEnd(''); logStartFp.current?.clear(); logEndFp.current?.clear(); setShowLogDateDropdown(false) }}
                        style={{ flex: 1, padding: '8px', background: 'white', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Clear</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Shift filter — untuk log historis */}
          <div className="trk-type-dropdown-wrap">
            <button ref={logShiftBtnRef} className={`trk-filter-btn ${logShift ? 'active' : ''}`} onClick={openLogShiftDropdown}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {logShift ? `Shift · ${logShift}` : 'Shift'}
            </button>
            {showLogShiftDropdown && (
              <div className="trk-modal-overlay active" onClick={() => setShowLogShiftDropdown(false)}>
                <div className="trk-modal-content animating-in"
                  style={{ position: 'fixed', top: logShiftPos.top, left: logShiftPos.left }}
                  onClick={e => e.stopPropagation()}>
                  <div className="trk-type-option" onClick={() => { setLogShift(''); setShowLogShiftDropdown(false) }}>
                    <input type="checkbox" className="trk-type-checkbox" checked={!logShift} readOnly />
                    <label>All Shifts</label>
                  </div>
                  {['Shift 1', 'Shift 2', 'Shift 3'].map(s => (
                    <div className="trk-type-option" key={s} onClick={() => { setLogShift(s); setShowLogShiftDropdown(false) }}>
                      <input type="checkbox" className="trk-type-checkbox" checked={logShift === s} readOnly />
                      <label>{s}</label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="trk-toolbar-right">
          <button className="trk-refresh-btn" onClick={fetchHourMeter}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ animation: hmLoading ? 'trkSpin 0.8s linear infinite' : 'none' }}>
              <polyline points="23 4 23 10 17 10"/>
              <polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          </button>
          <div className="trk-search-container">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input type="text" className="trk-search-input" placeholder="Search..."
              value={hmSearch} onChange={e => setHmSearch(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="trk-table-container">
        <div className="trk-super-header-wrap">
          <div className="trk-super-header">Hour Meters Unit</div>
        </div>
        <div className="trk-table-scroll">
          <table className="trk-table">
            <thead>
              <tr>
                <th className="trk-th-expand"></th>
                <th style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }} onClick={toggleHmSort}>
                  TAG NUMBER
                  <span style={{ display: 'inline-flex', flexDirection: 'column', marginLeft: '6px', verticalAlign: 'middle', gap: '2px' }}>
                    <svg width="8" height="6" viewBox="0 0 8 6" fill={hmSortOrder === 'asc' ? '#6366f1' : '#cbd5e1'}><path d="M4 0L8 6H0L4 0Z"/></svg>
                    <svg width="8" height="6" viewBox="0 0 8 6" fill={hmSortOrder === 'desc' ? '#6366f1' : '#cbd5e1'}><path d="M4 6L0 0H8L4 6Z"/></svg>
                  </span>
                </th>
                <th>ASSET NAME</th>
                <th>HOUR METERS</th>
                <th>UTILIZATION RATE</th>
              </tr>
            </thead>
            <tbody>
              {!hmReady ? null : hmDisplayed.length === 0 ? (
                <tr>
                  <td colSpan={HM_COLS}>
                    <div className="trk-empty-state">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                      </svg>
                      <p className="trk-empty-title">No Hour Meter Data</p>
                      <p className="trk-empty-sub">No assets found for the selected filters.</p>
                    </div>
                  </td>
                </tr>
              ) : hmDisplayed.map(row => {
                const isExpanded = !!expandedHmRows[row.asset_name]
                const logs = logData[row.asset_name] || []
                const isLogLoading = !!logLoading[row.asset_name]
                return (
                  <>
                    <tr key={row.asset_id} className={`trk-row ${isExpanded ? 'expanded' : ''}`}
                      onClick={() => toggleHmRow(row.asset_name)}>
                      <td className="trk-td-expand">
                        <span className={`trk-expand-arrow ${isExpanded ? 'open' : ''}`}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                        </span>
                      </td>
                      <td>{row.tag_number || '-'}</td>
                      <td>{hmSearch.trim()
                        ? (() => {
                            const regex = new RegExp(`(${hmSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
                            const parts = (row.asset_name || '-').split(regex)
                            return <strong>{parts.map((p, i) => regex.test(p) ? <mark key={i} style={{ backgroundColor: '#fde68a', color: '#92400e', borderRadius: '2px', padding: '0 1px' }}>{p}</mark> : p)}</strong>
                          })()
                        : <strong>{row.asset_name || '-'}</strong>
                      }</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: '600', color: '#334155' }}>{row.total_hm ?? 0}</span>
                        <span style={{ color: '#94a3b8', fontSize: '12px', marginLeft: '4px' }}>/ {HM_MAX}</span>
                      </td>
                      <td><UtilizationBadge value={row.total_hm ?? 0} max={HM_MAX} /></td>
                    </tr>
                    <tr key={`log-${row.asset_id}`} className="trk-detail-tr">
                      <td colSpan={HM_COLS} style={{ padding: 0 }}>
                        <SlideDown open={!!slideOpenHm[row.asset_name]}>
                          <div className="trk-detail-wrap">
                            <div className="trk-detail-scroll">
                              {isLogLoading ? (
                                <div className="trk-detail-loading">Loading...</div>
                              ) : logs.length === 0 ? (
                                <div className="trk-detail-empty">No log entries found.</div>
                              ) : (
                                <table className="trk-detail-table">
                                  <thead>
                                    <tr>
                                      <th className="trk-detail-th-q">DATE</th>
                                      <th className="trk-detail-th-r">SHIFT</th>
                                      <th className="trk-detail-th-r">HOUR METER</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {logs.map((log, i) => (
                                      <tr key={i} className="trk-detail-row">
                                        <td className="trk-detail-q">{log.date ? String(log.date).split('T')[0] : '-'}</td>
                                        <td className="trk-detail-r">{log.work_shift || '-'}</td>
                                        <td className="trk-detail-r" style={{ fontWeight: '600', color: '#334155' }}>{log.hour_meters ?? '-'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          </div>
                        </SlideDown>
                      </td>
                    </tr>
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

// ===== Main Tracking Page =====
export default function Tracking() {
  const [activeTab, setActiveTab] = useState('p2h')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedRows, setExpandedRows] = useState({})
  const [typeFilter, setTypeFilter] = useState('')
  const [dateFilter, setDateFilter] = useState(() => new Date().toISOString().split('T')[0])
  const [shiftFilter, setShiftFilter] = useState('Shift 1')
  const [types, setTypes] = useState([])
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  const [showShiftDropdown, setShowShiftDropdown] = useState(false)
  const dateRef = useRef(null)
  const dateFp = useRef(null)
  const dateBtnRef = useRef(null)
  const typeBtnRef = useRef(null)
  const shiftBtnRef = useRef(null)

  const fetchMatrix = () => {
    setIsReady(false)
    setLoading(true)
    const fetchStart = Date.now()
    const params = new URLSearchParams()
    params.append('date', dateFilter)
    params.append('shift', shiftFilter)
    if (typeFilter) params.append('type', typeFilter)
    fetch(`${API}/api/tracking/matrix?${params}`)
      .then(r => r.json())
      .then(data => {
        const elapsed = Date.now() - fetchStart
        const remaining = Math.max(0, 400 - elapsed)
        setTimeout(() => {
          setRows(Array.isArray(data) ? data : [])
          setLoading(false)
          setTimeout(() => setIsReady(true), 50)
        }, remaining)
      })
      .catch(() => setLoading(false))
  }

  const fetchTypes = () => {
    fetch(`${API}/api/tracking/types`)
      .then(r => r.json())
      .then(data => setTypes(Array.isArray(data) ? data : []))
      .catch(() => {})
  }

  useEffect(() => { fetchMatrix(); fetchTypes() }, [])
  useEffect(() => { fetchMatrix() }, [typeFilter, dateFilter, shiftFilter])

  useEffect(() => {
    if (!dateRef.current) return
    dateFp.current = flatpickr(dateRef.current, {
      dateFormat: 'Y-m-d',
      defaultDate: dateFilter,
      allowInput: true,
      disableMobile: true,
      positionElement: dateBtnRef.current,
      onChange: (dates) => {
        if (dates[0]) {
          const d = dates[0]
          const yyyy = d.getFullYear()
          const mm = String(d.getMonth() + 1).padStart(2, '0')
          const dd = String(d.getDate()).padStart(2, '0')
          setDateFilter(`${yyyy}-${mm}-${dd}`)
        } else {
          const now = new Date()
          const yyyy = now.getFullYear()
          const mm = String(now.getMonth() + 1).padStart(2, '0')
          const dd = String(now.getDate()).padStart(2, '0')
          setDateFilter(`${yyyy}-${mm}-${dd}`)
        }
      },
    })
    return () => dateFp.current?.destroy()
  }, [])

  const toggleRow = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'

  const highlightText = (text, query) => {
    if (!query.trim() || !text) return text
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = String(text).split(regex)
    return parts.map((part, i) =>
      regex.test(part)
        ? <mark key={i} style={{ backgroundColor: '#fde68a', color: '#92400e', borderRadius: '2px', padding: '0 1px' }}>{part}</mark>
        : part
    )
  }

  const displayed = rows.filter(r =>
    !searchQuery.trim() ||
    r.asset_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const columns = [
    { key: 'status',                 label: '',           cls: 'trk-col-status'    },
    { key: 'asset_name',             label: 'Asset Name', cls: 'trk-col-assetname' },
    { key: 'inspection_asset_type',  label: 'Type',       cls: 'trk-col-type'      },
    { key: 'project_name',           label: 'Project',    cls: 'trk-col-project'   },
    { key: 'company',                label: 'Company',    cls: 'trk-col-company'   },
    { key: 'inspect_result',         label: 'Result',     cls: 'trk-col-result'    },
  ]

  const renderCell = (col, row) => {
    if (col.key === 'status') return <StatusIcon hasP2h={row.has_p2h} />
    if (col.key === 'asset_name') return highlightText(row.asset_name || '-', searchQuery)
    if (!row.has_p2h) return <span style={{ color: '#cbd5e1' }}>—</span>
    const val = row[col.key]
    if (col.key === 'inspect_result') return <ResultBadge text={val} />

    return val || '-'
  }

  return (
    <div className="trk-wrapper">
      {/* Tabs */}
      <div className="trk-tabs">
        <button className={`trk-tab-btn ${activeTab === 'p2h' ? 'active' : ''}`} onClick={() => setActiveTab('p2h')}>P2H Unit</button>
        <button className={`trk-tab-btn ${activeTab === 'hm' ? 'active' : ''}`} onClick={() => setActiveTab('hm')}>Hour Meter</button>
      </div>

      {activeTab === 'p2h' && (
        <>
          {/* Toolbar */}
          <div className="trk-toolbar">
            <div className="trk-toolbar-left">
              {/* Type filter */}
              <div className="trk-type-dropdown-wrap">
                <button ref={typeBtnRef} className={`trk-filter-btn ${typeFilter ? 'active' : ''}`} onClick={() => setShowTypeDropdown(v => !v)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                  Type{typeFilter ? ` · ${typeFilter}` : ''}
                </button>
                <TypeModal
                  isOpen={showTypeDropdown}
                  onClose={() => setShowTypeDropdown(false)}
                  anchorRef={typeBtnRef}
                  types={types}
                  selected={typeFilter}
                  onChange={(t) => { setTypeFilter(t); setShowTypeDropdown(false) }}
                />
              </div>

              {/* Shift filter */}
              <div className="trk-type-dropdown-wrap">
                <button ref={shiftBtnRef} className={`trk-filter-btn ${shiftFilter ? 'active' : ''}`} onClick={() => setShowShiftDropdown(v => !v)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Shift · {shiftFilter}
                </button>
                <ShiftModal
                  isOpen={showShiftDropdown}
                  onClose={() => setShowShiftDropdown(false)}
                  anchorRef={shiftBtnRef}
                  selected={shiftFilter}
                  onChange={(s) => { setShiftFilter(s); setShowShiftDropdown(false) }}
                />
              </div>

              {/* Date picker */}
              <div className="trk-date-wrap">
                <button ref={dateBtnRef} className={`trk-filter-btn active`} onClick={() => dateFp.current?.open()}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  {dateFilter}
                </button>
                <input ref={dateRef} type="text" className="trk-date-input" readOnly />
              </div>
            </div>

            <div className="trk-toolbar-right">
              <button className="trk-refresh-btn" onClick={fetchMatrix}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  style={{ animation: loading ? 'trkSpin 0.8s linear infinite' : 'none' }}>
                  <polyline points="23 4 23 10 17 10"/>
                  <polyline points="1 20 1 14 7 14"/>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                </svg>
              </button>
              <div className="trk-search-container">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input type="text" className="trk-search-input" placeholder="Search..."
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="trk-table-container">
            <div className="trk-super-header-wrap">
              <div className="trk-super-header">
                P2H Unit — {shiftFilter} &nbsp;·&nbsp; {dateFilter}
                &nbsp;&nbsp;
                <span style={{ fontWeight: 500, color: '#22c55e' }}>✓ {displayed.filter(r => r.has_p2h).length} submitted</span>
                &nbsp;&nbsp;
                <span style={{ fontWeight: 500, color: '#ef4444' }}>✗ {displayed.filter(r => !r.has_p2h).length} pending</span>
              </div>
            </div>

            <div className="trk-table-scroll">
              <table className="trk-table">
                <thead>
                  <tr>
                    {columns.map(c => <th key={c.key} className={c.cls}>{c.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {!isReady ? null : displayed.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length}>
                        <div className="trk-empty-state">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
                            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
                            <rect x="9" y="3" width="6" height="4" rx="2"/>
                          </svg>
                          <p className="trk-empty-title">No Assets Found</p>
                          <p className="trk-empty-sub">No assets available in the system.</p>
                        </div>
                      </td>
                    </tr>
                  ) : displayed.map(row => {
                    const rowKey = row.asset_id
                    const isExpanded = !!expandedRows[rowKey]
                    const canExpand = row.has_p2h
                    return (
                      <>
                        <tr key={rowKey}
                          className={`trk-row ${isExpanded ? 'expanded' : ''} ${!canExpand ? 'trk-row-empty' : ''}`}
                          onClick={() => canExpand && toggleRow(rowKey)}>
                          {columns.map(c => (
                            <td key={c.key} className={c.cls}>{renderCell(c, row)}</td>
                          ))}
                        </tr>
                        {canExpand && (
                          <tr key={`detail-${rowKey}`} className="trk-detail-tr">
                            <td colSpan={columns.length} style={{ padding: 0 }}>
                              <SlideDown open={isExpanded}>
                                <DetailRow report={row} />
                              </SlideDown>
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'hm' && (
        <HourMeterTab types={types} />
      )}
    </div>
  )
}
