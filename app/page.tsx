'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, Archive, Search, RefreshCw } from 'lucide-react'
import { supabase, Lead, LeadStatus, STATUS_CONFIG, ACTIVE_STATUSES, TERMINAL_STATUSES } from '@/lib/supabase'
import { StatusBadge } from '@/components/StatusBadge'
import { QuickCapture } from '@/components/QuickCapture'
import { LeadDetail } from '@/components/LeadDetail'
import { formatDistanceToNow, isPast, parseISO } from 'date-fns'

function LeadCard({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  const isOverdue = lead.follow_up_date && isPast(parseISO(lead.follow_up_date))
  return (
    <div
      onClick={onClick}
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px 14px', cursor: 'pointer', transition: 'border-color 0.1s, box-shadow 0.1s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(26,71,42,0.08)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
    >
      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, lineHeight: 1.3 }}>{lead.address}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
        {lead.unit_type && <span style={{ fontSize: 11, background: 'var(--surface-2)', color: 'var(--text-2)', padding: '2px 6px', borderRadius: 3 }}>{lead.unit_type}</span>}
        {lead.asking_rent && <span style={{ fontSize: 11, background: 'var(--surface-2)', color: 'var(--text-2)', padding: '2px 6px', borderRadius: 3 }}>${lead.asking_rent.toLocaleString()}/mo</span>}
        {lead.neighbourhood && <span style={{ fontSize: 11, background: 'var(--surface-2)', color: 'var(--text-2)', padding: '2px 6px', borderRadius: 3 }}>{lead.neighbourhood}</span>}
      </div>
      {isOverdue && <div style={{ fontSize: 11, color: 'var(--warning)', fontWeight: 600, marginBottom: 4 }}>⚠ Follow-up overdue</div>}
      {lead.contact_phone && <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 4 }}>{lead.contact_phone}</div>}
      <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{formatDistanceToNow(new Date(lead.updated_at), { addSuffix: true })}</div>
    </div>
  )
}

function PipelineColumn({ status, leads, onSelect }: { status: LeadStatus; leads: Lead[]; onSelect: (id: string) => void }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <div style={{ flex: '0 0 240px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '8px 12px', borderRadius: 'var(--radius) var(--radius) 0 0', background: cfg.bg, border: `1px solid ${cfg.color}20`, borderBottom: `2px solid ${cfg.color}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontWeight: 600, fontSize: 12, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{cfg.label}</span>
        <span style={{ fontSize: 12, color: cfg.color, background: `${cfg.color}20`, borderRadius: 10, padding: '1px 7px', fontWeight: 700 }}>{leads.length}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        {leads.map(l => <LeadCard key={l.id} lead={l} onClick={() => onSelect(l.id)} />)}
        {leads.length === 0 && <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>—</div>}
      </div>
    </div>
  )
}

export default function Home() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [showCapture, setShowCapture] = useState(false)
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
  const [showClosed, setShowClosed] = useState(false)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('leads').select('*').eq('is_archived', false).order('updated_at', { ascending: false })
    setLeads(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = leads.filter(l => {
    if (!search) return true
    const q = search.toLowerCase()
    return l.address.toLowerCase().includes(q) || l.neighbourhood?.toLowerCase().includes(q) || l.contact_phone?.includes(q) || l.unit_type?.toLowerCase().includes(q) || l.building_name?.toLowerCase().includes(q)
  })

  const pipelineLeads = filtered.filter(l => ACTIVE_STATUSES.includes(l.status))
  const closedLeads = filtered.filter(l => TERMINAL_STATUSES.includes(l.status))
  const followUps = leads.filter(l => l.follow_up_date && ACTIVE_STATUSES.includes(l.status) && isPast(parseISO(l.follow_up_date)))

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Topbar */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: -0.3, color: 'var(--accent)', flexShrink: 0 }}>RENTAL<span style={{ color: 'var(--text-3)', fontWeight: 400 }}>/</span>TRACKER</span>
          <div className="topbar-search">
            <Search size={13} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
            <input placeholder="Search leads…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button className="btn btn-ghost btn-sm" onClick={load} title="Refresh"><RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /></button>
          <button className="btn btn-primary" onClick={() => setShowCapture(true)}><Plus size={15} /><span className="btn-label">Quick capture</span></button>
        </div>
      </div>

      {/* Follow-up alert */}
      {followUps.length > 0 && (
        <div style={{ background: '#fef3c7', borderBottom: '1px solid #fde68a', padding: '8px 20px', fontSize: 13, color: '#92400e', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span>⚠</span>
          <strong>{followUps.length} follow-up{followUps.length > 1 ? 's' : ''} overdue:</strong>
          {followUps.slice(0, 3).map(l => (
            <button key={l.id} onClick={() => setSelectedLeadId(l.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#92400e', textDecoration: 'underline', fontSize: 13, padding: 0 }}>{l.address}</button>
          ))}
          {followUps.length > 3 && <span>+{followUps.length - 3} more</span>}
        </div>
      )}

      {/* Board */}
      <div style={{ padding: 20 }}>
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active pipeline</span>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{pipelineLeads.length} leads</span>
        </div>

        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 20 }}>
          {ACTIVE_STATUSES.map(status => (
            <PipelineColumn key={status} status={status} leads={pipelineLeads.filter(l => l.status === status)} onSelect={setSelectedLeadId} />
          ))}
        </div>

        {closedLeads.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <button onClick={() => setShowClosed(!showClosed)} className="btn btn-ghost btn-sm" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Archive size={13} /> {showClosed ? 'Hide' : 'Show'} closed leads ({closedLeads.length})
            </button>
            {showClosed && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8 }}>
                {closedLeads.map(l => (
                  <div key={l.id} onClick={() => setSelectedLeadId(l.id)} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px 14px', cursor: 'pointer', opacity: 0.75 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{l.address}</div>
                      <StatusBadge status={l.status} />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>{formatDistanceToNow(new Date(l.updated_at), { addSuffix: true })}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {leads.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-3)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏠</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }}>No leads yet</div>
            <div style={{ fontSize: 14, marginBottom: 24 }}>Next time you spot a sign, hit Quick Capture.</div>
            <button className="btn btn-primary" onClick={() => setShowCapture(true)}><Plus size={15} /> Add your first lead</button>
          </div>
        )}
      </div>

      {showCapture && <QuickCapture onClose={() => setShowCapture(false)} onCreated={load} />}
      {selectedLeadId && <LeadDetail leadId={selectedLeadId} onClose={() => setSelectedLeadId(null)} onUpdated={load} />}
    </div>
  )
}

// Force dynamic rendering — this page requires env vars at runtime
export const dynamic = 'force-dynamic'
