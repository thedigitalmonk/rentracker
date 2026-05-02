-- Rental Tracker Schema
-- Run this in your Supabase SQL editor

-- Core leads table
CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  address TEXT NOT NULL,
  building_name TEXT,
  neighbourhood TEXT,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  source TEXT CHECK (source IN ('sign', 'walking', 'word_of_mouth', 'other')) DEFAULT 'sign',
  status TEXT CHECK (status IN ('spotted', 'contacted', 'showing_scheduled', 'visited', 'applied', 'accepted', 'rejected', 'withdrawn')) DEFAULT 'spotted',
  asking_rent INTEGER, -- monthly in CAD
  unit_type TEXT, -- e.g. "2BR", "bachelor", "1BR+den"
  available_from DATE,
  notes TEXT,
  follow_up_date DATE,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Visits / showings (one lead can have multiple visits)
CREATE TABLE visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  visited_at DATE NOT NULL DEFAULT CURRENT_DATE,
  unit_number TEXT,
  floor_number INTEGER,
  monthly_rent INTEGER,
  square_footage INTEGER,
  gut_rating INTEGER CHECK (gut_rating BETWEEN 1 AND 5), -- 1-5 stars
  pros TEXT,
  cons TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Photos (linked to either a lead or a visit)
CREATE TABLE photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  visit_id UUID REFERENCES visits(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Status history (auto-tracked via trigger)
CREATE TABLE status_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  note TEXT
);

-- Auto-update updated_at on leads
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-log status changes
CREATE OR REPLACE FUNCTION log_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO status_history (lead_id, from_status, to_status)
    VALUES (NEW.id, OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_status_history
  AFTER UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION log_status_change();

-- Storage bucket (run this separately or via dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('rental-photos', 'rental-photos', true);

-- RLS: Since this is a personal app with no auth, disable RLS
-- or set permissive policies. Easiest: keep RLS off.
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE visits DISABLE ROW LEVEL SECURITY;
ALTER TABLE photos DISABLE ROW LEVEL SECURITY;
ALTER TABLE status_history DISABLE ROW LEVEL SECURITY;
