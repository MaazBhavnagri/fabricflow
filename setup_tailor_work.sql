-- ========================================================
-- TAILOR WORK MANAGEMENT SYSTEM
-- ========================================================

-- 1. tailor_profiles
CREATE TABLE IF NOT EXISTS tailor_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  price_config jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS for tailor_profiles
ALTER TABLE tailor_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for all users on tailor_profiles" ON tailor_profiles FOR ALL USING (true) WITH CHECK (true);

-- 2. tailor_work_logs
CREATE TABLE IF NOT EXISTS tailor_work_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tailor_id uuid REFERENCES tailor_profiles(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  total_amount numeric DEFAULT 0
);

-- Enable RLS for tailor_work_logs
ALTER TABLE tailor_work_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for all users on tailor_work_logs" ON tailor_work_logs FOR ALL USING (true) WITH CHECK (true);


-- 3. tailor_work_items
CREATE TABLE IF NOT EXISTS tailor_work_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id uuid REFERENCES tailor_work_logs(id) ON DELETE CASCADE,
  cloth_type text NOT NULL,
  quantity integer NOT NULL,
  price_per_unit numeric NOT NULL
);

-- Enable RLS for tailor_work_items
ALTER TABLE tailor_work_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for all users on tailor_work_items" ON tailor_work_items FOR ALL USING (true) WITH CHECK (true);


-- 4. tailor_payments
CREATE TABLE IF NOT EXISTS tailor_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tailor_id uuid REFERENCES tailor_profiles(id) ON DELETE CASCADE,
  amount_paid numeric NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE
);

-- Enable RLS for tailor_payments
ALTER TABLE tailor_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for all users on tailor_payments" ON tailor_payments FOR ALL USING (true) WITH CHECK (true);
