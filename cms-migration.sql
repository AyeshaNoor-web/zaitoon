-- ============================================================
-- CMS MIGRATION — Run this in Supabase SQL Editor
-- ============================================================

-- 1) Add badge and accompaniments columns to menu_items
ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS badge TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS accompaniments TEXT DEFAULT NULL;

-- 2) Create popular_combos table
CREATE TABLE IF NOT EXISTS popular_combos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  price       NUMERIC(10,2),
  image_url   TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3) Create site_content table for all CMS text/settings
CREATE TABLE IF NOT EXISTS site_content (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL DEFAULT '',
  label      TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4) Seed default site content values
INSERT INTO site_content (key, value, label) VALUES
  ('bbq_accompaniments',  '1 Puri | 2 Chapati | 1 Spicy Chutni | 2 Garlic Sauce', 'BBQ Accompaniments'),
  ('hero_tagline_en',     'Fresh Lebanese Taste with Flame-Grilled Chicken',        'Hero Tagline (English)'),
  ('hero_tagline_ur',     'اصلی لبنانی ذائقہ، فلیم گرل چکن کے ساتھ',             'Hero Tagline (Urdu)'),
  ('footer_tagline',      'Authentic Lebanese flavors, flame-grilled to perfection. Fresh ingredients, unforgettable taste.', 'Footer Tagline'),
  ('announcement_text',   '',      'Announcement Banner Text'),
  ('announcement_active', 'false', 'Show Announcement Banner'),
  ('dips_note',           'All other dips available at Rs. 100 each. Ask staff for today''s options.', 'Dips Note'),
  ('restaurant_copyright','© 2025 Zaitoon Restaurant. All rights reserved.', 'Footer Copyright')
ON CONFLICT (key) DO NOTHING;

-- 5) Enable RLS
ALTER TABLE popular_combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content   ENABLE ROW LEVEL SECURITY;

-- 6) RLS policies — public read, anon full write (matches existing app pattern)
DO $$
BEGIN
  -- popular_combos
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='popular_combos' AND policyname='combos_select_all') THEN
    CREATE POLICY combos_select_all ON popular_combos FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='popular_combos' AND policyname='combos_insert_all') THEN
    CREATE POLICY combos_insert_all ON popular_combos FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='popular_combos' AND policyname='combos_update_all') THEN
    CREATE POLICY combos_update_all ON popular_combos FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='popular_combos' AND policyname='combos_delete_all') THEN
    CREATE POLICY combos_delete_all ON popular_combos FOR DELETE USING (true);
  END IF;

  -- site_content
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='site_content' AND policyname='content_select_all') THEN
    CREATE POLICY content_select_all ON site_content FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='site_content' AND policyname='content_insert_all') THEN
    CREATE POLICY content_insert_all ON site_content FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='site_content' AND policyname='content_update_all') THEN
    CREATE POLICY content_update_all ON site_content FOR UPDATE USING (true);
  END IF;
END $$;

-- Done ✓
