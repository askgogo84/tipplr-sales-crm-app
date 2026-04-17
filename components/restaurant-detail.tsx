'use client'

import { useState } from 'react'

type Restaurant = Record<string, any> & {
  id: string
}

type Executive = {
  id: string
  full_name: string
}

export default function RestaurantDetailPanel({
  open,
  restaurant,
  onClose,
  executives,
  onSaved,
}: {
  open: boolean
  restaurant: Restaurant
  onClose: () => void
  executives: Executive[]
  onSaved: () => void
}) {
  const [loading, setLoading] = useState(false)
  const r = restaurant

  if (!open) return null

  async function updateField(updates: Record<string, any>) {
    setLoading(true)
    try {
      await fetch('/api/restaurants/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: r.id, ...updates }),
      })
      onSaved()
    } catch (e) {
      console.error('Update failed', e)
    }
    setLoading(false)
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          zIndex: 500, backdropFilter: 'blur(4px)',
        }}
      />

      <div style={{
        position: 'fixed', top: 0, right: 0,
        width: 520, maxWidth: '95vw', height: '100vh',
        background: '#fff', zIndex: 501,
        boxShadow: '0 20px 60px rgba(0,0,0,0.14)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid #E8E4DE', flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#1A1814' }}>
              {r.restaurant_name || 'Restaurant'}
            </div>
            {r.owner_name && (
              <div style={{ fontSize: 13, color: '#6B6560', marginTop: 4 }}>
                {r.owner_name} {r.city ? `· ${r.city}` : ''}
              </div>
            )}
          </div>
          <button onClick={onClose} style={{
            width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 18, color: '#6B6560',
          }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {/* Status */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Status</label>
            <select
              defaultValue={r.lead_status || ''}
              onChange={e => updateField({ lead_status: e.target.value })}
              style={selectStyle}
            >
              <option value="">Select status</option>
              {['Agreed','Not Interested','Visit','Incorrect Number','Followup',
                "Couldn't Connect",'Call Back','Wrong Number','Invalid Number',
                'Permanently Closed','Temporarily Closed','Converted'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Assigned To */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Assigned To</label>
            <select
              defaultValue={r.assigned_to_name || ''}
              onChange={e => updateField({ assigned_to_name: e.target.value })}
              style={selectStyle}
            >
              <option value="">Unassigned</option>
              {executives.map(ex => (
                <option key={ex.id} value={ex.full_name}>{ex.full_name}</option>
              ))}
            </select>
          </div>

          {/* Phone */}
          {r.phone && (
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Phone</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <a href={`https://wa.me/91${r.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: 8, textAlign: 'center',
                    background: '#D1FAE5', color: '#065F46', textDecoration: 'none',
                    fontSize: 13, fontWeight: 600,
                  }}>📱 WhatsApp</a>
                <a href={`tel:${r.phone}`}
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: 8, textAlign: 'center',
                    background: '#DBEAFE', color: '#1E40AF', textDecoration: 'none',
                    fontSize: 13, fontWeight: 600,
                  }}>📞 Call</a>
              </div>
            </div>
          )}

          {/* Follow Up Date */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Follow-up Date</label>
            <input
              type="date"
              defaultValue={r.follow_up_date || ''}
              onChange={e => updateField({ follow_up_date: e.target.value })}
              style={inputStyle}
            />
          </div>

          {/* Priority */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Priority</label>
            <select
              defaultValue={r.priority || ''}
              onChange={e => updateField({ priority: e.target.value })}
              style={selectStyle}
            >
              <option value="">None</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Remarks */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Remarks</label>
            <textarea
              defaultValue={r.remarks || ''}
              onBlur={e => updateField({ remarks: e.target.value })}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
            />
          </div>

          {/* Toggles */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <ToggleField label="Converted" value={r.converted}
              onChange={v => updateField({ converted: v })} />
            <ToggleField label="Docs Received" value={r.documents_received}
              onChange={v => updateField({ documents_received: v })} />
          </div>

          {/* Reason */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Reason</label>
            <textarea
              defaultValue={r.reason || ''}
              onBlur={e => updateField({ reason: e.target.value })}
              rows={2}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          {/* Go Live Date */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Go Live Date</label>
            <input
              type="date"
              defaultValue={r.go_live_date || ''}
              onChange={e => updateField({ go_live_date: e.target.value })}
              style={inputStyle}
            />
          </div>

          {loading && <div style={{ fontSize: 12, color: '#6B6560', marginTop: 8 }}>Saving...</div>}
        </div>
      </div>
    </>
  )
}

function ToggleField({ label, value, onChange }: {
  label: string; value: boolean | null; onChange: (v: boolean) => void
}) {
  return (
    <div style={{
      flex: 1, padding: '12px 14px', borderRadius: 10,
      border: '1px solid #E8E4DE', background: '#F8F6F3',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#6B6560', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <button onClick={() => onChange(!value)} style={{
        padding: '4px 12px', borderRadius: 999, border: 'none', cursor: 'pointer',
        fontSize: 12, fontWeight: 600,
        background: value ? '#D1FAE5' : '#E8E4DE',
        color: value ? '#065F46' : '#6B6560',
      }}>{value ? 'Yes' : 'No'}</button>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.05em',
  color: '#9C9690', marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  border: '1px solid #E8E4DE', borderRadius: 8,
  fontSize: 14, color: '#1A1814', background: '#F5F3F0', outline: 'none',
}

const selectStyle: React.CSSProperties = {
  ...inputStyle, cursor: 'pointer',
}