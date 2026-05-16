-- ============================================================
-- ORDERS MIGRATION — Run this in Supabase SQL Editor
-- ============================================================

-- Drop existing tables to start fresh with new schema
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;

CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number VARCHAR(20) UNIQUE NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20),
  order_type VARCHAR(20) CHECK (order_type IN 
    ('dine_in','takeaway','phone','delivery')) NOT NULL,
  table_number VARCHAR(10),
  items JSONB NOT NULL DEFAULT '[]',
  special_instructions TEXT,
  payment_method VARCHAR(20) CHECK (payment_method IN 
    ('cash','card','jazzcash','easypaisa')) NOT NULL,
  payment_status VARCHAR(20) CHECK (payment_status IN 
    ('paid','pending','partial')) DEFAULT 'pending',
  order_status VARCHAR(20) CHECK (order_status IN 
    ('received','preparing','ready','served','completed')) 
    DEFAULT 'received',
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage orders" ON orders FOR ALL
  USING (auth.role() = 'authenticated');

-- Auto-generate order number trigger
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'ZAI-' || LPAD(
    (SELECT COUNT(*) + 1001 FROM orders)::TEXT, 4, '0'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION generate_order_number();
