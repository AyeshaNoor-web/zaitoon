-- TABLE 1: about_page_content
CREATE TABLE about_page_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key VARCHAR(100) UNIQUE NOT NULL,
  content_value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE about_page_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read about content"
  ON about_page_content FOR SELECT USING (true);
CREATE POLICY "Admins manage about content"
  ON about_page_content FOR ALL
  USING (auth.role() = 'authenticated');

INSERT INTO about_page_content (section_key, content_value) VALUES
  ('hero_heading', 'Our Story'),
  ('hero_subheading', 
   'From a small kitchen dream to Lahore''s favorite dining destination'),
  ('hero_image_url', 
   'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1400'),
  ('story_heading', 'How Zaitoon Began'),
  ('story_image_url',
   'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600'),
  ('story_body',
   'Zaitoon was born in 2010 from a simple belief — that authentic
    Pakistani flavors deserve a stage worthy of their richness. What
    started as a small family kitchen in the heart of Lahore has grown
    into one of the city''s most beloved dining destinations.

    Our name, Zaitoon — meaning olive in Arabic — symbolizes peace,
    nourishment, and the blessing of good food shared among loved ones.
    Every dish we serve carries that spirit: crafted with care, cooked
    with tradition, and served with love.

    Today, Zaitoon stands as a testament to the belief that great food
    is not just about taste — it is about the memories created around
    the table.'),
  ('chefs_heading', 'The Hands Behind Every Dish'),
  ('chefs_subheading', 
   'Meet the talented team that brings Zaitoon''s flavors to life'),
  ('blog_heading', 'From Our Kitchen Blog'),
  ('stat_1_number', '15'),
  ('stat_1_suffix', '+'),
  ('stat_1_label', 'Years of Serving Lahore'),
  ('stat_2_number', '50000'),
  ('stat_2_suffix', '+'),
  ('stat_2_label', 'Happy Customers'),
  ('stat_3_number', '3'),
  ('stat_3_suffix', ''),
  ('stat_3_label', 'Master Chefs'),
  ('stat_4_number', '80'),
  ('stat_4_suffix', '+'),
  ('stat_4_label', 'Menu Items');

-- TABLE 2: about_values
CREATE TABLE about_values (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  icon VARCHAR(10) NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  display_order INTEGER DEFAULT 0
);

ALTER TABLE about_values ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read values"
  ON about_values FOR SELECT USING (true);
CREATE POLICY "Admins manage values"
  ON about_values FOR ALL
  USING (auth.role() = 'authenticated');

INSERT INTO about_values (icon, title, description, display_order)
VALUES
  ('🌿', 'Authenticity',
   'Every recipe stays true to its roots. No shortcuts, no compromises.',
   1),
  ('🔥', 'Passion',
   'Our kitchen runs on love for food and pride in every plate we serve.',
   2),
  ('👨👩👧', 'Community',
   'Zaitoon is more than a restaurant. It is a gathering place for
    families and friends.',
   3);

-- TABLE 3: chefs
CREATE TABLE chefs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  title VARCHAR(150) NOT NULL,
  experience_years INTEGER NOT NULL,
  bio TEXT NOT NULL,
  photo_url TEXT,
  specialties TEXT[] DEFAULT '{}',
  instagram_url TEXT,
  facebook_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE chefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active chefs"
  ON chefs FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage chefs"
  ON chefs FOR ALL
  USING (auth.role() = 'authenticated');

INSERT INTO chefs 
  (name, title, experience_years, bio, photo_url, 
   specialties, display_order)
VALUES
  ('Ustad Muhammad Rafiq',
   'Head Chef & Culinary Director', 22,
   'Ustad Rafiq is the soul of Zaitoon''s kitchen. Trained in the
    traditional Lahori culinary school of thought, he has spent over
    two decades perfecting the art of slow-cooked gravies and charcoal
    BBQ. His karahi recipe alone has earned Zaitoon its legendary
    reputation.',
   'https://images.unsplash.com/photo-1607631568010-a87245c0daf8?w=300',
   ARRAY['Lahori Karahi', 'Nihari', 'Dum Biryani'],
   1),

  ('Chef Bilal Hussain',
   'BBQ & Grill Specialist', 14,
   'Chef Bilal brings the magic of live fire to Zaitoon''s menu.
    Specializing in tandoor and charcoal grilling, he trained under
    master grillers in Peshawar before joining Zaitoon in 2015. His
    seekh kababs and malai boti are customer favorites every single day.',
   'https://images.unsplash.com/photo-1581299894007-aaa50297cf16?w=300',
   ARRAY['Seekh Kabab', 'Malai Boti', 'Chapli Kabab'],
   2),

  ('Chef Sana Tariq',
   'Desserts & Beverages Chef', 9,
   'Chef Sana is the creative force behind Zaitoon''s dessert menu and
    specialty drinks. With a background in culinary arts from Lahore,
    she brings modern presentation to traditional Pakistani sweets,
    making every dessert a visual and flavorful delight.',
   'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=300',
   ARRAY['Kheer', 'Gajar Ka Halwa', 'Signature Shakes'],
   3);

-- TABLE 4: blog_posts
CREATE TABLE blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cover_image_url TEXT,
  category VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  excerpt TEXT NOT NULL,
  body TEXT,
  published_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_published BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published posts"
  ON blog_posts FOR SELECT USING (is_published = true);
CREATE POLICY "Admins manage posts"
  ON blog_posts FOR ALL
  USING (auth.role() = 'authenticated');

INSERT INTO blog_posts
  (cover_image_url, category, title, excerpt, 
   published_date, display_order)
VALUES
  ('https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600',
   'Recipe',
   'The Secret Behind Our Lahori Karahi',
   'Discover the spices, technique, and generations of tradition that
    go into Zaitoon''s most iconic dish.',
   '2025-04-12', 1),

  ('https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600',
   'Culture',
   'Why Pakistani BBQ is Unlike Anything Else',
   'From the charcoal selection to the marinade ratios — we break down
    what makes desi BBQ a cultural institution.',
   '2025-03-28', 2),

  ('https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600',
   'Behind the Scenes',
   'A Day in the Life of Zaitoon''s Kitchen',
   'Follow our team from the early morning prep to the last table of
    the night. It is controlled chaos and pure passion.',
   '2025-02-15', 3);
