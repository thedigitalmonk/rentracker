'use client'
import { useState, useEffect, useCallback } from 'react'
import { X, Phone, Mail, User, Calendar, MapPin, Plus, ChevronDown, ExternalLink } from 'lucide-react'
import { supabase, Lead, Visit, Photo, StatusHistory, LeadStatus, LeadSource, STATUS_CONFIG, ACTIVE_STATUSES, TERMINAL_STATUSES, SOURCE_LABELS } from '@/lib/supabase'
import { StatusBadge } from './StatusBadge'
import { AddVisit } from './AddVisit'
import { formatDistanceToNow, format } from 'date-fns'

interface Props {
  leadId: string
  onClose: () => void
  onUpdated: () => void
}

const ALL_STATUSES: LeadStatus[] = [...ACTIVE_STATUSES, ...TERMINAL_STATUSES]

function StarDisplay({ value }: { value: number }) {
  return (
    <span style={{ color: '#d97706', letterSpacing: -2 }}>
      {'★'.repeat(value)}{'☆'.repeat(5 - value)}
    </span>
  )
}

export function LeadDetail({ leadId, onClose, onUpdated }: Props) {
  const [lead, setLead] = useState<Lead | null>(null)
  const [visits, setVisits] = useState<Visit[]>([])
  const [photos, setPhotos] = useState<Photo[]>([])
  const [history, setHistory] = useState<StatusHistory[]>([])
  const [editing, setEditing] = useState(false)
  const [showAddVisit, setShowAddVisit] = useState(false)
  const [saving, setSaving] = useState(false)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)

  // Editable fields
  const [editAddress, setEditAddress] = useState('')
  const [editBuilding, setEditBuilding] = useState('')
  const [editNeighbourhood, setEditNeighbourhood] = useState('')
  const [editContactName, setEditContactName] = useState('')
  const [editContactPhone, setEditContactPhone] = useState('')
  const [editContactEmail, setEditContactEmail] = useState('')
  const [editSource, setEditSource] = useState<LeadSource>('sign')
  const [editStatus, setEditStatus] = useState<LeadStatus>('spotted')
  const [editRent, setEditRent] = useState('')
  const [editUnitType, setEditUnitType] = useState('')
  const [editAvailableFrom, setEditAvailableFrom] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editFollowUp, setEditFollowUp] = useState('')

  const load = useCallback(async () => {
    const [{ data: l }, { data: v }, { data: p }, { data: h }] = await Promise.all([
      supabase.from('leads').select('*').eq('id', leadId).single(),
      supabase.from('visits').select('*').eq('lead_id', leadId).order('visited_at', { ascending: false }),
      supabase.from('photos').select('*').eq('lead_id', leadId).order('created_at'),
      supabase.from('status_history').select('*').eq('lead_id', leadId).order('changed_at', { ascending: false }),
    ])
    if (l) {
      setLead(l)
      setEditAddress(l.address || '')
      setEditBuilding(l.building_name || '')
      setEditNeighbourhood(l.neighbourhood || '')
      setEditContactName(l.contact_name || '')
      setEditContactPhone(l.contact_phone || '')
      setEditContactEmail(l.contact_email || '')
      setEditSource(l.source)
      setEditStatus(l.status)
      setEditRent(l.asking_rent?.toString() || '')
      setEditUnitType(l.unit_type || '')
      setEditAvailableFrom(l.available_from || '')
      setEditNotes(l.notes || '')
      setEditFollowUp(l.follow_up_date || '')
    }
    setVisits(v || [])
    setPhotos(p || [])
    setHistory(h || [])
  }, [leadId])

  useEffect(() => { load() }, [load])

  function getPhotoUrl(path: string) {
    const { data } = supabase.storage.from('rental-photos').getPublicUrl(path)
    return data.publicUrl
  }

  async function handleSave() {
    if (!lead) return
    setSaving(true)
    await supabase.from('leads').update({
      address: editAddress,
      building_name: editBuilding || null,
      neighbourhood: editNeighbourhood || null,
      contact_name: editContactName || null,
      contact_phone: editContactPhone || null,
      contact_email: editContactEmail || null,
      source: editSource,
      status: editStatus,
      asking_rent: editRent ? parseInt(editRent) : null,
      unit_type: editUnitType || null,
      available_from: editAvailableFrom || null,
      notes: editNotes || null,
      follow_up_date: editFollowUp || null,
    }).eq('id', lead.id)
    setSaving(false)
    setEditing(false)
    await load()
    onUpdated()
  }

  async function handleArchive() {
    if (!lead) return
    if (!confirm('Archive this lead? You can filter to see archived leads later.')) return
    await supabase.from('leads').update({ is_archived: true }).eq('id', lead.id)
    onUpdated()
    onClose()
  }

  async function quickStatus(status: LeadStatus) {
    if (!lead) return
    await supabase.from('leads').update({ status }).eq('id', lead.id)
    await load()
    onUpdated()
  }

  if (!lead) return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>Loading…</div>
    </div>
  )

  const leadPhotos = photos.filter(p => !p.visit_id)
  const nextStatuses = ALL_STATUSES.filter(s => s !== lead.status)

  return (
    <>
      <div
        className="modal-overlay"
        style={{ alignItems: 'stretch', padding: 0, justifyContent: 'flex-end' }}
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <div style={{
          background: 'var(--bg)',
          width: '100%',
          maxWidth: 680,
          height: '100%',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-20px 0 60px rgba(0,0,0,0.15)',
          animation: 'slide-in 0.2s ease',
        }}>
          <style>{`@keyframes slide-in { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>

          {/* Header */}
          <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <MapPin size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                  <h2 style={{ fontWeight: 600, fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.address}</h2>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <StatusBadge status={lead.status} />
                  {lead.building_name && <span style={{ color: 'var(--text-3)', fontSize: 13 }}>{lead.building_name}</span>}
                  {lead.neighbourhood && <span style={{ color: 'var(--text-3)', fontSize: 13 }}>· {lead.neighbourhood}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setEditing(!editing)}>
                  {editing ? 'Cancel' : 'Edit'}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={16} /></button>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Quick status change */}
            {!editing && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Move to</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {nextStatuses.map(s => {
                    const cfg = STATUS_CONFIG[s]
                    return (
                      <button
                        key={s}
                        onClick={() => quickStatus(s)}
                        style={{
                          padding: '4px 10px', borderRadius: 4, fontSize: 12, fontWeight: 600,
                          cursor: 'pointer', border: `1px solid ${cfg.color}20`,
                          background: cfg.bg, color: cfg.color,
                          textTransform: 'uppercase', letterSpacing: '0.05em',
                        }}
                      >
                        {cfg.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Edit form */}
            {editing ? (
              <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Edit Lead Details</div>

                <div className="field">
                  <label className="label">Address</label>
                  <input className="input" value={editAddress} onChange={e => setEditAddress(e.target.value)} />
                </div>

                <div className="grid-2col">
                  <div className="field">
                    <label className="label">Building name</label>
                    <input className="input" placeholder="Optional" value={editBuilding} onChange={e => setEditBuilding(e.target.value)} />
                  </div>
                  <div className="field">
                    <label className="label">Neighbourhood</label>
                    <input className="input" placeholder="e.g. Caledonia-Fairbank" value={editNeighbourhood} onChange={e => setEditNeighbourhood(e.target.value)} />
                  </div>
                </div>

                <div className="grid-2col">
                  <div className="field">
                    <label className="label">Status</label>
                    <select className="select" value={editStatus} onChange={e => setEditStatus(e.target.value as LeadStatus)}>
                      {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label className="label">Source</label>
                    <select className="select" value={editSource} onChange={e => setEditSource(e.target.value as LeadSource)}>
                      {(Object.entries(SOURCE_LABELS) as [LeadSource, string][]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ fontWeight: 600, fontSize: 13, marginTop: 4 }}>Contact</div>
                <div className="grid-2col">
                  <div className="field">
                    <label className="label">Name</label>
                    <input className="input" placeholder="Contact person" value={editContactName} onChange={e => setEditContactName(e.target.value)} />
                  </div>
                  <div className="field">
                    <label className="label">Phone</label>
                    <input className="input" type="tel" value={editContactPhone} onChange={e => setEditContactPhone(e.target.value)} />
                  </div>
                </div>
                <div className="field">
                  <label className="label">Email</label>
                  <input className="input" type="email" value={editContactEmail} onChange={e => setEditContactEmail(e.target.value)} />
                </div>

                <div style={{ fontWeight: 600, fontSize: 13, marginTop: 4 }}>Unit details</div>
                <div className="grid-3col">
                  <div className="field">
                    <label className="label">Asking rent</label>
                    <input className="input" type="number" placeholder="2100" value={editRent} onChange={e => setEditRent(e.target.value)} />
                  </div>
                  <div className="field">
                    <label className="label">Unit type</label>
                    <input className="input" placeholder="2BR" value={editUnitType} onChange={e => setEditUnitType(e.target.value)} />
                  </div>
                  <div className="field">
                    <label className="label">Available from</label>
                    <input className="input" type="date" value={editAvailableFrom} onChange={e => setEditAvailableFrom(e.target.value)} />
                  </div>
                </div>

                <div className="field">
                  <label className="label">Follow-up date</label>
                  <input className="input" type="date" value={editFollowUp} onChange={e => setEditFollowUp(e.target.value)} />
                </div>

                <div className="field">
                  <label className="label">Notes</label>
                  <textarea className="textarea" value={editNotes} onChange={e => setEditNotes(e.target.value)} />
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button className="btn btn-danger btn-sm" onClick={handleArchive}>Archive lead</button>
                  <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              </div>
            ) : (
              /* Info display */
              <div className="grid-2col">
                {/* Contact card */}
                <div className="card" style={{ padding: 16, gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Contact</div>
                  {lead.contact_name || lead.contact_phone || lead.contact_email ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {lead.contact_name && (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <User size={14} style={{ color: 'var(--text-3)' }} />
                          <span>{lead.contact_name}</span>
                        </div>
                      )}
                      {lead.contact_phone && (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <Phone size={14} style={{ color: 'var(--text-3)' }} />
                          <a href={`tel:${lead.contact_phone}`} style={{ color: 'var(--accent)', textDecoration: 'none' }}>{lead.contact_phone}</a>
                        </div>
                      )}
                      {lead.contact_email && (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <Mail size={14} style={{ color: 'var(--text-3)' }} />
                          <a href={`mailto:${lead.contact_email}`} style={{ color: 'var(--accent)', textDecoration: 'none' }}>{lead.contact_email}</a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-3)', fontSize: 13 }}>No contact info yet — edit to add</span>
                  )}
                </div>

                {/* Rent */}
                {lead.asking_rent && (
                  <div className="card" style={{ padding: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Asking rent</div>
                    <div style={{ fontSize: 22, fontWeight: 600 }}>${lead.asking_rent.toLocaleString()}<span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-3)' }}>/mo</span></div>
                  </div>
                )}

                {/* Unit type */}
                {lead.unit_type && (
                  <div className="card" style={{ padding: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Unit type</div>
                    <div style={{ fontSize: 18, fontWeight: 600 }}>{lead.unit_type}</div>
                  </div>
                )}

                {/* Available from */}
                {lead.available_from && (
                  <div className="card" style={{ padding: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Available from</div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <Calendar size={14} style={{ color: 'var(--text-3)' }} />
                      <span>{format(new Date(lead.available_from), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                )}

                {/* Follow-up */}
                {lead.follow_up_date && (
                  <div className="card" style={{ padding: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Follow up</div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <Calendar size={14} style={{ color: 'var(--warning)' }} />
                      <span style={{ color: 'var(--warning)', fontWeight: 500 }}>{format(new Date(lead.follow_up_date), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {lead.notes && (
                  <div className="card" style={{ padding: 16, gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Notes</div>
                    <p style={{ color: 'var(--text)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{lead.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Sign photos */}
            {leadPhotos.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Photos</div>
                <div className="photo-grid">
                  {leadPhotos.map(p => (
                    <img
                      key={p.id}
                      src={getPhotoUrl(p.storage_path)}
                      className="photo-thumb"
                      alt={p.caption || ''}
                      onClick={() => setLightboxSrc(getPhotoUrl(p.storage_path))}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Visits */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Visits ({visits.length})
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowAddVisit(true)}>
                  <Plus size={13} /> Log visit
                </button>
              </div>

              {visits.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-3)', fontSize: 13 }}>
                  No visits logged yet
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {visits.map(visit => {
                    const visitPhotos = photos.filter(p => p.visit_id === visit.id)
                    return (
                      <div key={visit.id} className="card" style={{ padding: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>
                              {format(new Date(visit.visited_at), 'EEEE, MMM d, yyyy')}
                            </div>
                            <div style={{ color: 'var(--text-3)', fontSize: 12, marginTop: 2 }}>
                              {[visit.unit_number && `Unit ${visit.unit_number}`, visit.floor_number && `Floor ${visit.floor_number}`].filter(Boolean).join(' · ')}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            {visit.gut_rating && <StarDisplay value={visit.gut_rating} />}
                            {visit.monthly_rent && (
                              <div style={{ fontWeight: 600, fontSize: 15, marginTop: 2 }}>
                                ${visit.monthly_rent.toLocaleString()}<span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-3)' }}>/mo</span>
                              </div>
                            )}
                            {visit.square_footage && (
                              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{visit.square_footage} sqft</div>
                            )}
                          </div>
                        </div>

                        {visit.pros && (
                          <div style={{ marginBottom: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pros </span>
                            <span style={{ fontSize: 13 }}>{visit.pros}</span>
                          </div>
                        )}
                        {visit.cons && (
                          <div style={{ marginBottom: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cons </span>
                            <span style={{ fontSize: 13 }}>{visit.cons}</span>
                          </div>
                        )}
                        {visit.notes && (
                          <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 8, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{visit.notes}</p>
                        )}

                        {visitPhotos.length > 0 && (
                          <div className="photo-grid" style={{ marginTop: 10 }}>
                            {visitPhotos.map(p => (
                              <img
                                key={p.id}
                                src={getPhotoUrl(p.storage_path)}
                                className="photo-thumb"
                                alt=""
                                onClick={() => setLightboxSrc(getPhotoUrl(p.storage_path))}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Status history */}
            {history.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>History</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {history.map(h => (
                    <div key={h.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text-3)', fontSize: 12, fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                        {format(new Date(h.changed_at), 'MMM d')}
                      </span>
                      {h.from_status && (
                        <>
                          <StatusBadge status={h.from_status as LeadStatus} />
                          <span style={{ color: 'var(--text-3)', fontSize: 12 }}>→</span>
                        </>
                      )}
                      <StatusBadge status={h.to_status as LeadStatus} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Meta */}
            <div style={{ color: 'var(--text-3)', fontSize: 12, fontFamily: 'var(--font-mono)', paddingTop: 8 }}>
              Added {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })} · {SOURCE_LABELS[lead.source]}
            </div>
          </div>
        </div>
      </div>

      {showAddVisit && lead && (
        <AddVisit
          lead={lead}
          onClose={() => setShowAddVisit(false)}
          onCreated={() => { load(); onUpdated(); }}
        />
      )}

      {lightboxSrc && (
        <div
          onClick={() => setLightboxSrc(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, cursor: 'zoom-out' }}
        >
          <img src={lightboxSrc} style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: 4 }} alt="" />
          <a href={lightboxSrc} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: 16, right: 48, color: '#fff', background: 'rgba(255,255,255,0.2)', borderRadius: 4, padding: '4px 8px', display: 'flex', gap: 4, alignItems: 'center', textDecoration: 'none', fontSize: 12 }}>
            <ExternalLink size={12} /> Open
          </a>
          <button onClick={() => setLightboxSrc(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 20 }}>✕</button>
        </div>
      )}
    </>
  )
}
