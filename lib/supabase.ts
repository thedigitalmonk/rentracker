import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type LeadStatus =
  | 'spotted'
  | 'contacted'
  | 'showing_scheduled'
  | 'visited'
  | 'applied'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'

export type LeadSource = 'sign' | 'walking' | 'word_of_mouth' | 'other'

export interface Lead {
  id: string
  address: string
  building_name: string | null
  neighbourhood: string | null
  contact_name: string | null
  contact_phone: string | null
  contact_email: string | null
  source: LeadSource
  status: LeadStatus
  asking_rent: number | null
  unit_type: string | null
  available_from: string | null
  notes: string | null
  follow_up_date: string | null
  is_archived: boolean
  created_at: string
  updated_at: string
}

export interface Visit {
  id: string
  lead_id: string
  visited_at: string
  unit_number: string | null
  floor_number: number | null
  monthly_rent: number | null
  square_footage: number | null
  gut_rating: number | null
  pros: string | null
  cons: string | null
  notes: string | null
  created_at: string
}

export interface Photo {
  id: string
  lead_id: string
  visit_id: string | null
  storage_path: string
  caption: string | null
  created_at: string
}

export interface StatusHistory {
  id: string
  lead_id: string
  from_status: string | null
  to_status: string
  changed_at: string
  note: string | null
}

export const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; bg: string }> = {
  spotted:           { label: 'Spotted',    color: '#6b7280', bg: '#f3f4f6' },
  contacted:         { label: 'Contacted',  color: '#2563eb', bg: '#dbeafe' },
  showing_scheduled: { label: 'Showing',    color: '#7c3aed', bg: '#ede9fe' },
  visited:           { label: 'Visited',    color: '#0891b2', bg: '#cffafe' },
  applied:           { label: 'Applied',    color: '#d97706', bg: '#fef3c7' },
  accepted:          { label: 'Accepted',   color: '#16a34a', bg: '#dcfce7' },
  rejected:          { label: 'Rejected',   color: '#dc2626', bg: '#fee2e2' },
  withdrawn:         { label: 'Withdrawn',  color: '#9ca3af', bg: '#f9fafb' },
}

export const ACTIVE_STATUSES: LeadStatus[] = [
  'spotted', 'contacted', 'showing_scheduled', 'visited', 'applied'
]

export const TERMINAL_STATUSES: LeadStatus[] = ['accepted', 'rejected', 'withdrawn']

export const SOURCE_LABELS: Record<LeadSource, string> = {
  sign: 'Street Sign',
  walking: 'Walking By',
  word_of_mouth: 'Word of Mouth',
  other: 'Other',
}
