'use client'

import { useState, useEffect } from 'react'
import { showToast, timeAgo, formatDate } from '@/components/ui'

type Restaurant = {
  id: string
  restaurant_name: string | null
  brand_name: string | null
  owner_name: string | null
  phone: string | null
  alternate_phone: string | null
  email: string | null
  area: string | null
  zone: string | null
  city: string | null
  address: string | null
  restaurant_type: string | null
  category: string | null
  source: string | null
  lead_status: string | null
  assigned_to_name: string | null
  follow_up_date: string | null
  last_contacted_at: string | null
  onboarded_date: string | null
  commission_percent: number | null
  discount_offer: string | null
  fssai_number: string | null
  menu_status: string | null
  contract_status: string | null
  kyc_status: string | null
  listing_status: string | null
  priority: string | null
  remarks: string | null
  created_at: string | null
  updated_at: string | null
  converted: boolean | null
  documents_received: boolean | null
  go_live_on_digilist: boolean | null
  go_live_date: string | null
  menu_pricing: string | null
  reason: string | null
  [key: string]: any
}

type Note = { id: number; note: string; created_by: string; created_at: string }
type Activity = { id: number; action_type: string; action_details: string; performed_by: string; created_at: string }
type Doc = { id: number; file_name: string; uploaded_by: string; created_at: string }

const TABS = ['Overview', 'Details', 'Notes', 'Activity', 'Documents'] as const
type Tab = (typeof TABS)[number]

function statusPill(status: string | null) {
  if (!status) return <span style={{ color: 'var(--text-tertiary)' }}>—</span>
  const s = status.toLowerCase().replace(/\s+/g, '-')
  const map: Record<string, { bg: string; color: string }> = {
    lead: { bg: '#E8E4DE', color: '#6B6560' },
    contacted: { bg: '#DBEAFE', color: '#1E40AF' },
    interested: { bg: '#FEF3C7', color: '#92400E' },
    negotiation: { bg: '#EDE9FE', color: '#5B21B6' },
    won: { bg: '#D1FAE5', color: '#065F46' },
    lost: { bg: '#FEE2E2', color: '#991B1B' },
    converted: { bg: '#CFFAFE', color: '#155E75' },
    'not-interested': { bg: '#F3F4F6', color: '#6B7280' },
  }
  const c = map[s] || { bg: '#E8E4DE', color: '#6B6560' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 11px', borderRadius: 999,
      background: c.bg, color: c.color,
      fontSize: 12, fontWeight: 600,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.color }} />
      {status}
    </span>
  )
}

function priorityPill(p: string | null) {
  if (!p) return <span style={{ color: 'var(--text-tertiary)' }}>—</span>
  const map: Record<string, { bg: string; color: string }> = {
    high: { bg: '#FEE2E2', color: '#991B1B' },
    medium: { bg: '#FEF3C7', color: '#92400E' },
    low: { bg: '#D1FAE5', color: '#065F46' },
  }
  const c = map[p.toLowerCase()] || { bg: '#F3F4F6', color: '#6B7280' }
  return (
    <span style={{
      display: 'inline-flex', padding: '4px 11px', borderRadius: 999,
      background: c.bg, color: c.color, fontSize: 12, fontWeight: 600,
    }}>
      {p}
    </span>
  )
}

export default function RestaurantDetail({
  restaurant,
  onClose,
  assigneeOptions,
}: {
  restaurant: Restaurant
  onClose: () => void
  assigneeOptions: string[]
}) {
  const [tab, setTab] = useState<Tab>('Overview')
  const [notes, setNotes] = useState<Note[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [docs, setDocs] = useState<Doc[]>([])
  const [newNote, setNewNote] = useState('')
  const r = restaurant

  // Escape key closes
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Fetch tab data
  useEffect(() => {
    if (tab === 'Notes') fetchNotes()
    if (tab === 'Activity') fetchActivity()
    if (tab === 'Documents') fetchDocs()
  }, [tab, r.id])

  async function fetchNotes() {
    try {
      const res = await fetch(`/api/restaurants/${r.id}/notes`)
      if (res.ok) { const d = await res.json(); setNotes(d.data || []) }
    } catch {}
  }

  async function fetchActivity() {
    try {
      const res = await fetch(`/api/restaurants/${r.id}/activity`)
      if (res.ok) { const d = await res.json(); setActivities(d.data || []) }
    } catch {}
  }

  async function fetchDocs() {
    try {
      const res = await fetch(`/api/restaurants/${r.id}/documents`)
      if (res.ok) { const d = await res.json(); setDocs(d.data || []) }
    } catch {}
  }

  async function addNote() {
    if (!newNote.trim()) return
    try {
      await fetch(`/api/restaurants/${r.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote.trim(), created_by: 'Goverdhan' }),
      })
      setNewNote('')
      fetchNotes()
      showToast('Note added')
    } catch {
      // If API doesn't exist yet, add locally
      setNotes(prev => [{ id: Date.now(), note: newNote.trim(), created_by: 'Goverdhan', created_at: new Date().toISOString() }, ...prev])
      setNewNote('')
      showToast('Note saved locally')
    }
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 11.5, fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '0.05em',
    color: 'var(--text-tertiary)', marginBottom: 5,
  }

  const valStyle: React.CSSProperties = {
    fontSize: 14, color: 'var(--text-primary)', fontWeight: 450,
  }

  const empty = <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>—</span>

  const divider = <div style={{ gridColumn: '1 / -1', height: 1, background: 'var(--border-light)', margin: '6px 0' }} />

  const sectionHead = (text: string) => (
    <div style={{
      gridColumn: '1 / -1', fontFamily: 'var(--font-display)',
      fontSize: 18, fontStyle: 'italic', color: 'var(--text-primary)', paddingTop: 8,
    }}>{text}</div>
  )

  const field = (label: string, value: React.ReactNode) => (
    <div>
      <div style={labelStyle}>{label}</div>
      <div style={valStyle}>{value || empty}</div>
    </div>
  )

  const waLink = (phone: string | null) => {
    if (!phone) return empty
    return (
      <a href={`https://wa.me/91${phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
        style={{ color: '#25D366', fontWeight: 550, textDecoration: 'none' }}>
        📱 {phone}
      </a>
    )
  }

  const activityIcon: Record<string, { cls: string; emoji: string }> = {
    status_change: { cls: 'activity-icon-status', emoji: '↻' },
    note_added: { cls: 'activity-icon-note', emoji: '✎' },
    assigned: { cls: 'activity-icon-assign', emoji: '→' },
    call_made: { cls: 'activity-icon-call', emoji: '✆' },
    document_uploaded: { cls: 'activity-icon-doc', emoji: '📎' },
  }

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'var(--bg-overlay)',
        zIndex: 500, backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.2s ease both',
      }} />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0,
        width: 680, maxWidth: '92vw', height: '100vh',
        background: 'var(--bg-card)', zIndex: 501,
        boxShadow: 'var(--shadow-xl)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        animation: 'slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 28px', borderBottom: '1px solid var(--border)', flexShrink: 0,
        }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontStyle: 'italic' }}>
            {r.restaurant_name || 'Restaurant'}
          </div>
          <button onClick={onClose} style={{
            width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 10, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)',
          }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', borderBottom: '1px solid var(--border)',
          padding: '0 28px', background: 'var(--bg-table-header)', overflowX: 'auto',
        }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '14px 18px', fontSize: 13,
              fontWeight: tab === t ? 600 : 500,
              color: tab === t ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer', border: 'none', background: 'none',
              borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
              fontFamily: 'var(--font-body)', whiteSpace: 'nowrap',
            }}>{t}</button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>

          {/* ═══ OVERVIEW ═══ */}
          {tab === 'Overview' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 28px' }}>
                {field('Status', statusPill(r.lead_status))}
                {field('Priority', priorityPill(r.priority))}
                {field('Assigned To', r.assigned_to_name)}
                {field('Follow Up', r.follow_up_date ? formatDate(r.follow_up_date) : null)}

                {divider}
                {sectionHead('Contact')}

                {field('Owner', r.owner_name)}
                {field('Phone', waLink(r.phone))}
                {field('Alt Phone', r.alternate_phone)}
                {field('Email', r.email)}

                {divider}
                {sectionHead('Location')}

                {field('Area', r.area)}
                {field('Zone', r.zone)}
                {field('City', r.city)}
                {field('Address', r.address)}

                {r.remarks && (
                  <>
                    {divider}
                    <div style={{ gridColumn: '1 / -1' }}>
                      <div style={labelStyle}>Remarks</div>
                      <div style={{
                        ...valStyle, background: 'var(--bg-input)',
                        padding: '12px 14px', borderRadius: 10, lineHeight: 1.6,
                      }}>{r.remarks}</div>
                    </div>
                  </>
                )}
              </div>

              {/* Quick Actions */}
              <div style={{
                display: 'flex', gap: 8, flexWrap: 'wrap',
                marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border-light)',
              }}>
                {r.phone && (
                  <a href={`https://wa.me/91${r.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      padding: '10px 18px', borderRadius: 10, border: 'none',
                      background: 'var(--accent)', color: '#fff',
                      textDecoration: 'none', fontSize: 13.5, fontWeight: 550,
                    }}>
                    📱 WhatsApp
                  </a>
                )}
                <button onClick={() => showToast('Call logged')} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '10px 18px', borderRadius: 10,
                  border: '1px solid var(--border)', background: 'var(--bg-card)',
                  color: 'var(--text-primary)', cursor: 'pointer',
                  fontSize: 13.5, fontWeight: 550, fontFamily: 'var(--font-body)',
                }}>✆ Log Call</button>
                <button onClick={() => setTab('Notes')} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '10px 18px', borderRadius: 10,
                  border: '1px solid var(--border)', background: 'var(--bg-card)',
                  color: 'var(--text-primary)', cursor: 'pointer',
                  fontSize: 13.5, fontWeight: 550, fontFamily: 'var(--font-body)',
                }}>✎ Add Note</button>
              </div>
            </>
          )}

          {/* ═══ DETAILS ═══ */}
          {tab === 'Details' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 28px' }}>
              {sectionHead('Restaurant Info')}
              {field('Brand Name', r.brand_name)}
              {field('Category', r.category)}
              {field('Type', r.restaurant_type)}
              {field('Source', r.source)}

              {divider}
              {sectionHead('Onboarding')}
              {field('Commission %', r.commission_percent ? `${r.commission_percent}%` : null)}
              {field('Discount Offer', r.discount_offer)}
              {field('FSSAI Number', r.fssai_number ? (
                <span style={{ fontFamily: 'monospace', fontSize: 13 }}>{r.fssai_number}</span>
              ) : null)}
              {field('Menu Pricing', r.menu_pricing)}

              {divider}
              {sectionHead('Compliance')}
              {field('Menu Status', r.menu_status)}
              {field('Contract Status', r.contract_status)}
              {field('KYC Status', r.kyc_status)}
              {field('Listing Status', r.listing_status)}

              {divider}
              {sectionHead('Timeline')}
              {field('Created', formatDate(r.created_at))}
              {field('Last Updated', formatDate(r.updated_at))}
              {field('Last Contacted', r.last_contacted_at ? formatDate(r.last_contacted_at) : null)}
              {field('Onboarded', r.onboarded_date ? formatDate(r.onboarded_date) : null)}
              {field('Go Live Date', r.go_live_date ? formatDate(r.go_live_date) : null)}
              {field('Documents Received', r.documents_received ? '✓ Yes' : 'No')}
              {field('Converted', r.converted ? '✓ Yes' : 'No')}

              {r.reason && (
                <>
                  {divider}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={labelStyle}>Reason (Lost / Not Interested)</div>
                    <div style={{
                      background: '#FEE2E2', padding: '10px 14px',
                      borderRadius: 10, color: '#991B1B', fontSize: 14,
                    }}>{r.reason}</div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ═══ NOTES ═══ */}
          {tab === 'Notes' && (
            <>
              <div style={{
                display: 'flex', gap: 10,
                paddingBottom: 16, borderBottom: '1px solid var(--border-light)', marginBottom: 16,
              }}>
                <textarea
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  placeholder={`Write a note about ${r.restaurant_name}...`}
                  rows={2}
                  style={{
                    flex: 1, padding: '10px 14px',
                    border: '1px solid var(--border)', borderRadius: 10,
                    fontFamily: 'var(--font-body)', fontSize: 13.5,
                    color: 'var(--text-primary)', background: 'var(--bg-input)',
                    outline: 'none', resize: 'vertical', minHeight: 42,
                  }}
                />
                <button onClick={addNote} style={{
                  padding: '10px 18px', borderRadius: 10, border: 'none',
                  background: 'var(--accent)', color: '#fff', cursor: 'pointer',
                  fontSize: 13, fontWeight: 550, fontFamily: 'var(--font-body)',
                  alignSelf: 'flex-end',
                }}>Add</button>
              </div>

              {notes.length > 0 ? notes.map(n => (
                <div key={n.id} style={{
                  display: 'flex', gap: 14, padding: '16px 0',
                  borderBottom: '1px solid var(--border-light)',
                }}>
                  <div className="activity-icon-note" style={{
                    width: 32, height: 32, flexShrink: 0, borderRadius: 999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                  }}>✎</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, color: 'var(--text-primary)', lineHeight: 1.5 }}>{n.note}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
                      {n.created_by} · {timeAgo(n.created_at)}
                    </div>
                  </div>
                </div>
              )) : (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                  No notes yet. Add one above.
                </div>
              )}
            </>
          )}

          {/* ═══ ACTIVITY ═══ */}
          {tab === 'Activity' && (
            <>
              {activities.length > 0 ? activities.map(a => {
                const ic = activityIcon[a.action_type] || { cls: 'activity-icon-note', emoji: '•' }
                return (
                  <div key={a.id} style={{
                    display: 'flex', gap: 14, padding: '16px 0',
                    borderBottom: '1px solid var(--border-light)',
                  }}>
                    <div className={ic.cls} style={{
                      width: 32, height: 32, flexShrink: 0, borderRadius: 999,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                    }}>{ic.emoji}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, color: 'var(--text-primary)', lineHeight: 1.5 }}>{a.action_details}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
                        {a.performed_by} · {timeAgo(a.created_at)}
                      </div>
                    </div>
                  </div>
                )
              }) : (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                  No activity recorded for this restaurant
                </div>
              )}
            </>
          )}

          {/* ═══ DOCUMENTS ═══ */}
          {tab === 'Documents' && (
            <>
              <div style={{ marginBottom: 16 }}>
                <button onClick={() => showToast('Upload — wire to Supabase Storage')} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '10px 18px', borderRadius: 10,
                  border: '1px solid var(--border)', background: 'var(--bg-card)',
                  color: 'var(--text-primary)', cursor: 'pointer',
                  fontSize: 13.5, fontWeight: 550, fontFamily: 'var(--font-body)',
                }}>↑ Upload Document</button>
              </div>

              {docs.length > 0 ? docs.map(d => (
                <div key={d.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 0', borderBottom: '1px solid var(--border-light)',
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, background: '#FEF3C7',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#92400E', fontSize: 16, flexShrink: 0,
                  }}>📄</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 550, fontSize: 13.5 }}>{d.file_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                      Uploaded by {d.uploaded_by} · {formatDate(d.created_at)}
                    </div>
                  </div>
                </div>
              )) : (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                  No documents uploaded yet
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
