-- ============================================================
-- FAQs MIGRATION — Run this in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS faqs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question      TEXT NOT NULL,
  question_ur   TEXT,
  answer        TEXT NOT NULL,
  answer_ur     TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='faqs' AND policyname='faqs_select_all') THEN
    CREATE POLICY faqs_select_all ON faqs FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='faqs' AND policyname='faqs_insert_all') THEN
    CREATE POLICY faqs_insert_all ON faqs FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='faqs' AND policyname='faqs_update_all') THEN
    CREATE POLICY faqs_update_all ON faqs FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='faqs' AND policyname='faqs_delete_all') THEN
    CREATE POLICY faqs_delete_all ON faqs FOR DELETE USING (true);
  END IF;
END $$;

-- Seed default FAQs
INSERT INTO faqs (question, answer, display_order) VALUES
  ('Where are your branches located?',
   'We have two branches: Wapda Town (E-88, Block E1, Wapda Town Phase 1, Lahore) and Cantonment (22-23 Tufail Road, near Mall of Lahore).',
   0),
  ('What are your opening hours?',
   'Both branches are open Monday to Sunday, 12:00 PM – 1:00 AM.',
   1),
  ('Do you offer home delivery?',
   'Yes! We deliver within 15 km of each branch. Delivery fee is calculated based on distance.',
   2),
  ('Can I customise my order?',
   'Absolutely. You can add notes at checkout and our staff will do their best to accommodate your preferences.',
   3),
  ('Do you have a loyalty programme?',
   'Yes — earn 1 point per Rs. 100 spent. Points unlock Bronze, Silver, Gold, and Platinum tiers with discounts and free delivery perks.',
   4)
ON CONFLICT DO NOTHING;

-- Done ✓
