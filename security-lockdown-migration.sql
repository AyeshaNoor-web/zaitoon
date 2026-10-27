-- ══════════════════════════════════════════════════════════════════
-- SECURITY LOCKDOWN
--
-- Before this, the public (anon) key — which ships in every visitor's
-- browser — could read every customer and order, and write to the menu,
-- site content, reviews, loyalty points and orders.
--
-- After this:
--   • The public key can only READ the catalog: menu_items, categories,
--     item_variants, branches, site_content, faqs, popular_combos.
--   • Everything else (customers, orders, order_items, loyalty_transactions,
--     reviews, settings, admin_users, admin_sessions) is only reachable
--     through the app's server routes, which use the service-role key and
--     check the admin or customer session.
--
-- ORDER OF OPERATIONS: deploy the app code first, then run this script.
-- The new code works with or without it; the old code does NOT work after it.
--
-- Safe to re-run.
-- ══════════════════════════════════════════════════════════════════

-- 1) Drop every existing policy on the affected tables (names vary between
--    earlier migrations, so remove them all and recreate a known set).
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'menu_items', 'categories', 'item_variants', 'branches', 'site_content',
        'faqs', 'popular_combos', 'customers', 'orders', 'order_items',
        'loyalty_transactions', 'reviews', 'settings', 'admin_users', 'admin_sessions'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- 2) Row level security on for every table (no policy = no anon access).
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'menu_items', 'categories', 'item_variants', 'branches', 'site_content',
    'faqs', 'popular_combos', 'customers', 'orders', 'order_items',
    'loyalty_transactions', 'reviews', 'settings', 'admin_users', 'admin_sessions'
  ]
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    END IF;
  END LOOP;
END $$;

-- 3) Public, read-only catalog.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'menu_items', 'categories', 'item_variants', 'branches',
    'site_content', 'faqs', 'popular_combos'
  ]
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO anon, authenticated USING (true)', t || '_public_read', t);
    END IF;
  END LOOP;
END $$;

-- 4) Belt and braces: make sure the anon/authenticated roles hold no write
--    privileges on any of these tables, even if RLS were switched off later.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON
  public.menu_items, public.categories, public.item_variants, public.branches,
  public.site_content, public.faqs, public.popular_combos, public.customers,
  public.orders, public.order_items, public.loyalty_transactions, public.reviews,
  public.settings, public.admin_users, public.admin_sessions
FROM anon, authenticated;

REVOKE SELECT ON
  public.customers, public.orders, public.order_items, public.loyalty_transactions,
  public.reviews, public.settings, public.admin_users, public.admin_sessions
FROM anon, authenticated;

-- 5) Realtime is no longer used for orders (the app polls the server instead).
--    Removing the table from the publication stops change events leaking.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.orders;
  END IF;
END $$;

-- 6) Menu images: uploads go through /api/admin/upload-image (service role).
--    Remove any dashboard-created policy that lets other roles write to the
--    bucket. Public image URLs keep working because the bucket is public.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND cmd IN ('INSERT', 'UPDATE', 'DELETE', 'ALL')
      AND (coalesce(qual, '') ILIKE '%menu-images%' OR coalesce(with_check, '') ILIKE '%menu-images%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
  END LOOP;
END $$;

-- Done. Verify in the Supabase dashboard → Authentication → Policies that only
-- the seven *_public_read policies remain.
