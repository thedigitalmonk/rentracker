'use client'
import { useState, useRef } from 'react'
import { X } from 'lucide-react'
import { supabase, Lead } from '@/lib/supabase'

interface Props {
  lead: Lead
  onClose: () => void
  onCreated: () => void
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          className="star-btn"
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n === value ? 0 : n)}
          style={{ opacity: (hover || value) >= n ? 1 : 0.25 }}
        >
          ★
        </button>
      ))}
      {value > 0 && (
        <span style={{ marginLeft: 6, color: 'var(--text-3)', fontSize: 13, lineHeight: '28px' }}>
          {['', 'No thanks', 'Maybe not', 'Interesting', 'Strong maybe', 'Yes!'][value]}
        </span>
      )}
    </div>
  )
}

export function AddVisit({ lead, onClose, onCreated }: Props) {
  const today = new Date().toISOString().split('T')[0]
  const [visitedAt, setVisitedAt] = useState(today)
  const [unitNumber, setUnitNumber] = useState('')
  const [floor, setFloor] = useState('')
  const [rent, setRent] = useState(lead.asking_rent?.toString() || '')
  const [sqft, setSqft] = useState('')
  const [rating, setRating] = useState(0)
  const [pros, setPros] = useState('')
  const [cons, setCons] = useState('')
  const [notes, setNotes] = useState('')
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function handlePhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setPhotoFiles(prev => [...prev, ...files])
    setPhotoPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))])
  }

  function removePhoto(i: number) {
    setPhotoFiles(prev => prev.filter((_, idx) => idx !== i))
    setPhotoPreviews(prev => prev.filter((_, idx) => idx !== i))
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const { data: visit, error: visitErr } = await supabase
        .from('visits')
        .insert({
          lead_id: lead.id,
          visited_at: visitedAt,
          unit_number: unitNumber || null,
          floor_number: floor ? parseInt(floor) : null,
          monthly_rent: rent ? parseInt(rent) : null,
          square_footage: sqft ? parseInt(sqft) : null,
          gut_rating: rating || null,
          pros: pros || null,
          cons: cons || null,
          notes: notes || null,
        })
        .select()
        .single()

      if (visitErr) throw visitErr

      // Update lead status to visited if it was earlier
      const earlyStatuses = ['spotted', 'contacted', 'showing_scheduled']
      if (earlyStatuses.includes(lead.status)) {
        await supabase.from('leads').update({ status: 'visited' }).eq('id', lead.id)
      }

      // Upload photos
      for (const file of photoFiles) {
        const ext = file.name.split('.').pop()
        const path = `${lead.id}/visit-${visit.id}-${Date.now()}.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('rental-photos')
          .upload(path, file)
        if (!uploadErr) {
          await supabase.from('photos').insert({
            lead_id: lead.id,
            visit_id: visit.id,
            storage_path: path,
          })
        }
      }

      onCreated()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span style={{ fontWeight: 600, fontSize: 15 }}>Log Visit</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="modal-body">
          {error && <div style={{ padding: '8px 12px', background: '#fee2e2', color: 'var(--danger)', borderRadius: 'var(--radius)', fontSize: 13 }}>{error}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label className="label">Date visited</label>
              <input className="input" type="date" value={visitedAt} onChange={e => setVisitedAt(e.target.value)} />
            </div>
            <div className="field">
              <label className="label">Unit #</label>
              <input className="input" placeholder="e.g. 3B" value={unitNumber} onChange={e => setUnitNumber(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div className="field">
              <label className="label">Floor</label>
              <input className="input" type="number" placeholder="e.g. 4" value={floor} onChange={e => setFloor(e.target.value)} />
            </div>
            <div className="field">
              <label className="label">Rent / mo</label>
              <input className="input" type="number" placeholder="2100" value={rent} onChange={e => setRent(e.target.value)} />
            </div>
            <div className="field">
              <label className="label">Sqft</label>
              <input className="input" type="number" placeholder="750" value={sqft} onChange={e => setSqft(e.target.value)} />
            </div>
          </div>

          <div className="field">
            <label className="label">Gut feeling</label>
            <StarRating value={rating} onChange={setRating} />
          </div>

          <div className="field">
            <label className="label">Pros</label>
            <textarea className="textarea" placeholder="Good natural light, quiet street, laundry in unit…" value={pros} onChange={e => setPros(e.target.value)} style={{ minHeight: 60 }} />
          </div>

          <div className="field">
            <label className="label">Cons</label>
            <textarea className="textarea" placeholder="No parking, small kitchen, noisy HVAC…" value={cons} onChange={e => setCons(e.target.value)} style={{ minHeight: 60 }} />
          </div>

          <div className="field">
            <label className="label">Other notes</label>
            <textarea className="textarea" placeholder="Anything else…" value={notes} onChange={e => setNotes(e.target.value)} style={{ minHeight: 60 }} />
          </div>

          {/* Photos */}
          <div className="field">
            <label className="label">Photos</label>
            {photoPreviews.length > 0 && (
              <div className="photo-grid" style={{ marginBottom: 8 }}>
                {photoPreviews.map((src, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={src} className="photo-thumb" alt="" />
                    <button
                      onClick={() => removePhoto(i)}
                      style={{
                        position: 'absolute', top: 4, right: 4,
                        background: 'rgba(0,0,0,0.6)', color: '#fff',
                        border: 'none', borderRadius: '50%',
                        width: 20, height: 20, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12,
                      }}
                    >×</button>
                  </div>
                ))}
              </div>
            )}
            <button className="btn btn-secondary" onClick={() => fileRef.current?.click()}>
              + Add photos
            </button>
            <input ref={fileRef} type="file" multiple accept="image/*" onChange={handlePhotos} style={{ display: 'none' }} />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Visit'}
          </button>
        </div>
      </div>
    </div>
  )
}
