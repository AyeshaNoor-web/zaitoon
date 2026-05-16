-- ============================================================
-- REVIEWS MIGRATION (MERGED) — Run this in Supabase SQL Editor
-- ============================================================

-- 1) Add new columns to existing reviews table
ALTER TABLE reviews 
  ADD COLUMN IF NOT EXISTS customer_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS customer_location VARCHAR(100) DEFAULT 'Pakistan',
  ADD COLUMN IF NOT EXISTS customer_image_url TEXT,
  ADD COLUMN IF NOT EXISTS review_text TEXT,
  ADD COLUMN IF NOT EXISTS date_posted DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- 2) Update existing rows to sync data
UPDATE reviews 
SET 
  customer_name = (SELECT name FROM customers WHERE customers.id = reviews.customer_id),
  review_text = comment,
  is_published = is_approved
WHERE customer_name IS NULL;

-- 3) Enable RLS (Ensure public can read published reviews)
-- Public can read published reviews
DROP POLICY IF EXISTS "Anyone can read published reviews" ON reviews;
CREATE POLICY "Anyone can read published reviews"
  ON reviews FOR SELECT
  USING (is_published = true);

-- Only authenticated admin can manage reviews
DROP POLICY IF EXISTS "Admins can manage reviews" ON reviews;
CREATE POLICY "Admins can manage reviews"
  ON reviews FOR ALL
  USING (auth.role() = 'authenticated');

-- 4) Seed with 6 default testimonials (as requested)
INSERT INTO reviews 
  (customer_name, customer_location, customer_image_url, 
   rating, review_text, date_posted, display_order, is_published, is_verified)
VALUES
  ('Ahmed Raza', 'Lahore, Pakistan',
   'https://i.pravatar.cc/80?img=11', 5,
   'Zaitoon never disappoints! The Lahori Karahi was absolutely divine,
   cooked to perfection with the right amount of spice. The staff was
   warm and welcoming. Will definitely be coming back with my family!',
   '2025-03-15', 1, true, true),

  ('Fatima Malik', 'Islamabad, Pakistan',
   'https://i.pravatar.cc/80?img=47', 5,
   'Best shawarma I have had in Pakistan, hands down. The bread was
   fresh, the sauce was perfect and the portion size was very generous.
   Loved every single bite!',
   '2025-03-28', 2, true, true),

  ('Usman Tariq', 'Lahore, Pakistan',
   'https://i.pravatar.cc/80?img=12', 4,
   'Great ambiance and even better food. The BBQ platter for two was
   massive and delicious. Slightly long wait time but absolutely worth
   every minute of it.',
   '2025-02-10', 3, true, true),

  ('Sara Khan', 'Karachi, Pakistan',
   'https://i.pravatar.cc/80?img=49', 5,
   'Visited Zaitoon for my birthday dinner and it was magical. The staff
   surprised us with complimentary dessert. The daal makhani was out of
   this world!',
   '2025-01-22', 4, true, true),

  ('Hassan Mirza', 'Lahore, Pakistan',
   'https://i.pravatar.cc/80?img=15', 4,
   'Solid food, great prices. The seekh kabab and naan combo is my
   go-to order every time. Clean environment and very friendly service.',
   '2025-02-28', 5, true, true),

  ('Ayesha Noor', 'Rawalpindi, Pakistan',
   'https://i.pravatar.cc/80?img=44', 5,
   'Honestly feels like home cooked food but restaurant quality. The
   biryani is fragrant and full of flavor. Highly recommend to anyone
   visiting Lahore!',
   '2025-03-05', 6, true, true);
