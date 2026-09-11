-- =====================================================================
-- BhujanRakshak: AI Landslide Early Warning System (NER India)
-- Supabase PostgreSQL Schema Migration & Realtime Setup
-- =====================================================================

-- 1. Table: location_risk
-- Stores current evaluated AI risk scores, levels and rainfall for monitored locations
CREATE TABLE IF NOT EXISTS public.location_risk (
    location_name TEXT PRIMARY KEY,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    risk_score DOUBLE PRECISION NOT NULL,
    risk_level TEXT NOT NULL CHECK (risk_level IN ('Low', 'Medium', 'High')),
    rainfall_3day DOUBLE PRECISION NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Table: alert_log
-- Records automated early warning dispatches (SMS/Twilio) and debounce timestamps
CREATE TABLE IF NOT EXISTS public.alert_log (
    id SERIAL PRIMARY KEY,
    location_name TEXT NOT NULL,
    risk_level TEXT NOT NULL,
    risk_score DOUBLE PRECISION NOT NULL,
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    channel TEXT DEFAULT 'SMS',
    recipient TEXT,
    status TEXT NOT NULL
);

-- 3. Table: subscribers
-- Citizen and local authority phone numbers registered for SMS emergency notifications
CREATE TABLE IF NOT EXISTS public.subscribers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    location_name TEXT NOT NULL,
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Table: field_reports
-- Citizen and patrol mountain hazard / crack reports (offline-first sync)
CREATE TABLE IF NOT EXISTS public.field_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    location_name TEXT NOT NULL,
    corridor TEXT DEFAULT 'NH-6',
    description TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'Warning' CHECK (severity IN ('Safe', 'Warning', 'Critical')),
    report_type TEXT NOT NULL DEFAULT 'mountain_crack' CHECK (report_type IN ('mountain_crack', 'climate_weather', 'debris_slide')),
    crack_width_cm NUMERIC,
    crack_length_m NUMERIC,
    climate_condition TEXT,
    image_url TEXT,
    image_data TEXT,
    status TEXT DEFAULT 'ACTIVE',
    reporter_name TEXT DEFAULT 'Anonymous Citizen / Patrol Scout',
    reporter_phone TEXT,
    offline_captured_at TIMESTAMP WITH TIME ZONE,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Indices for rapid querying and GIS performance
CREATE INDEX IF NOT EXISTS idx_location_risk_level ON public.location_risk (risk_level);
CREATE INDEX IF NOT EXISTS idx_alert_log_location ON public.alert_log (location_name, triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_field_reports_created ON public.field_reports (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_field_reports_coords ON public.field_reports (latitude, longitude);

-- 5. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.location_risk ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_reports ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies (Public Read/Write for Hackathon MVP Demo)
DROP POLICY IF EXISTS "Public can view location risk" ON public.location_risk;
CREATE POLICY "Public can view location risk" ON public.location_risk FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can update location risk" ON public.location_risk;
CREATE POLICY "Public can update location risk" ON public.location_risk FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view alert logs" ON public.alert_log;
CREATE POLICY "Public can view alert logs" ON public.alert_log FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can insert alert logs" ON public.alert_log;
CREATE POLICY "Public can insert alert logs" ON public.alert_log FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view subscribers" ON public.subscribers;
CREATE POLICY "Public can view subscribers" ON public.subscribers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can insert subscribers" ON public.subscribers;
CREATE POLICY "Public can insert subscribers" ON public.subscribers FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view field reports" ON public.field_reports;
CREATE POLICY "Public can view field reports" ON public.field_reports FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can insert field reports" ON public.field_reports;
CREATE POLICY "Public can insert field reports" ON public.field_reports FOR INSERT WITH CHECK (true);

-- 7. Seed Initial Monitored Locations into location_risk
INSERT INTO public.location_risk (location_name, latitude, longitude, risk_score, risk_level, rainfall_3day, updated_at)
VALUES
    ('Noney (Tupul Railway Corridor)', 24.7174, 93.6331, 0.88, 'High', 135.0, now()),
    ('Aizawl Melthum Ridge', 23.7271, 92.7176, 0.76, 'High', 112.5, now()),
    ('East Khasi Hills (Mawsynram)', 25.2970, 91.5822, 0.69, 'High', 124.0, now()),
    ('East Khasi Hills (Cherrapunji)', 25.2800, 91.7300, 0.54, 'Medium', 88.0, now()),
    ('Sonapur Tunnel Corridor (NH-6)', 25.1235, 92.3651, 0.72, 'High', 95.0, now()),
    ('Haflong Hill Slopes (Dima Hasao)', 25.1760, 93.0240, 0.48, 'Medium', 64.0, now()),
    ('Kohima High Ridge Pass', 25.6751, 94.1086, 0.62, 'Medium', 78.0, now()),
    ('Bhalukpong Highway Pass', 27.0120, 92.6500, 0.38, 'Medium', 46.0, now()),
    ('Mangan North Sikkim', 27.5050, 88.5330, 0.79, 'High', 118.0, now()),
    ('Guwahati Brahmaputra Valley', 26.1445, 91.7362, 0.12, 'Low', 18.0, now())
ON CONFLICT (location_name) DO UPDATE SET
    risk_score = EXCLUDED.risk_score,
    risk_level = EXCLUDED.risk_level,
    rainfall_3day = EXCLUDED.rainfall_3day,
    updated_at = now();

-- Seed initial subscribers for demonstration
INSERT INTO public.subscribers (name, phone, location_name)
VALUES
    ('Disaster Management Officer - Noney', '+919876543210', 'Noney (Tupul Railway Corridor)'),
    ('PWD Highway Engineer - Aizawl', '+919876543211', 'Aizawl Melthum Ridge'),
    ('District Emergency Ops - East Khasi Hills', '+919876543212', 'East Khasi Hills (Mawsynram)')
ON CONFLICT DO NOTHING;

-- Seed initial alert logs
INSERT INTO public.alert_log (location_name, risk_level, risk_score, channel, recipient, status)
VALUES
    ('Noney (Tupul Railway Corridor)', 'High', 0.88, 'SMS', '+919876543210', 'DELIVERED'),
    ('Aizawl Melthum Ridge', 'High', 0.76, 'SMS', '+919876543211', 'DELIVERED')
ON CONFLICT DO NOTHING;

-- =====================================================================
-- 8. CRITICAL: Enable Supabase Realtime for Frontend Dynamic Subscriptions
-- =====================================================================
DO $$
BEGIN
    -- Enable location_risk publication
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'location_risk'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.location_risk;
    END IF;

    -- Enable field_reports publication
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'field_reports'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.field_reports;
    END IF;

    -- Enable alert_log publication
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'alert_log'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.alert_log;
    END IF;
END $$;
