
-- 8. Expenses Table (Finance Feature)
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL, -- e.g., 'Groceries', 'Utilities', 'Education', 'Entertainment', 'Other'
  description TEXT,
  date DATE DEFAULT CURRENT_DATE,
  paid_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Expenses policy: Only members can CRUD expenses within their family
CREATE POLICY expense_access ON expenses
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM family_members 
    WHERE family_members.family_id = expenses.family_id 
    AND family_members.user_id = auth.uid()
  ));
