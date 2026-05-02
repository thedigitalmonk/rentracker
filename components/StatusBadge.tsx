'use client'
import { LeadStatus, STATUS_CONFIG } from '@/lib/supabase'

export function StatusBadge({ status }: { status: LeadStatus }) {
  const config = STATUS_CONFIG[status]
  return (
    <span
      className="badge"
      style={{ color: config.color, background: config.bg }}
    >
      {config.label}
    </span>
  )
}
