'use client'
import { useState, useRef } from 'react'
import { X, Camera, MapPin } from 'lucide-react'
import { supabase, LeadSource, SOURCE_LABELS } from '@/lib/supabase'

interface Props {
  onClose: () => void
  onCreated: () => void
}

export function QuickCapture({ onClose, onCreated }: Props) {
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [source, setSource] = useState<LeadSource>('sign')
  const [notes, setNotes] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function handleSave() {
    if (!address.trim()) { setError('Address is required'); return }
    setSaving(true)
    setError('')

    try {
      // Create lead
      const { data: lead, error: leadErr } = await supabase
        .from('leads')
        .insert({
          address: address.trim(),
          contact_phone: phone.trim() || null,
          source,
          notes: notes.trim() || null,
          status: 'spotted',
        })
        .select()
        .single()

      if (leadErr) throw leadErr

      // Upload photo if any
      if (photoFile && lead) {
        const ext = photoFile.name.split('.').pop()
        const path = `${lead.id}/${Date.now()}.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('rental-photos')
          .upload(path, photoFile)

        if (!uploadErr) {
          await supabase.from('photos').insert({
            lead_id: lead.id,
            storage_path: path,
            caption: 'Sign photo',
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
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={16} style={{ color: 'var(--accent)' }} />
            <span style={{ fontWeight: 600, fontSize: 15 }}>Quick Capture</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="modal-body">
          {error && (
            <div style={{ padding: '8px 12px', background: '#fee2e2', color: 'var(--danger)', borderRadius: 'var(--radius)', fontSize: 13 }}>
              {error}
            </div>
          )}

          {/* Photo capture */}
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              border: '2px dashed var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: 20,
              textAlign: 'center',
              cursor: 'pointer',
              background: photoPreview ? 'transparent' : 'var(--surface-2)',
              transition: 'border-color 0.1s',
            }}
          >
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Preview"
                style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 'var(--radius)' }}
              />
            ) : (
              <div style={{ color: 'var(--text-3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <Camera size={28} />
                <span style={{ fontSize: 13 }}>Tap to add a photo of the sign</span>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} style={{ display: 'none' }} />

          <div className="field">
            <label className="label">Address *</label>
            <input
              className="input"
              placeholder="e.g. 247 Caledonia Rd"
              value={address}
              onChange={e => setAddress(e.target.value)}
              autoFocus
            />
          </div>

          <div className="field">
            <label className="label">Phone number</label>
            <input
              className="input"
              type="tel"
              placeholder="e.g. 416-555-0100"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
          </div>

          <div className="field">
            <label className="label">How did you find it?</label>
            <select className="select" value={source} onChange={e => setSource(e.target.value as LeadSource)}>
              {(Object.entries(SOURCE_LABELS) as [LeadSource, string][]).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="label">Quick note</label>
            <textarea
              className="textarea"
              placeholder="Any details you noticed..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              style={{ minHeight: 60 }}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Lead'}
          </button>
        </div>
      </div>
    </div>
  )
}
