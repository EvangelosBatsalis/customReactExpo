-- SQL Schema for Family Organization App
-- Combined Schema Deployment Script

-- ==========================================
-- CORE TABLES
-- ==========================================

-- 1. Profiles Table
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Families Table
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Family Memberships (Linking Users to Families)
CREATE TYPE family_role AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER');

CREATE TABLE family_members (
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role family_role NOT NULL DEFAULT 'MEMBER',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (family_id, user_id)
);

-- 4. Invites Table
CREATE TYPE invite_status AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED');

CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  inviter_id UUID REFERENCES profiles(id),
  role family_role DEFAULT 'MEMBER',
  status invite_status DEFAULT 'PENDING',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tasks Table
CREATE TYPE task_status AS ENUM ('TODO', 'DOING', 'DONE');

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  due_time TIME,
  assigned_to UUID REFERENCES profiles(id),
  status task_status DEFAULT 'TODO',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Events Table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  notes TEXT,
  start_at TIMESTAMP WITH TIME ZONE NOT NULL,
  end_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Shopping Lists & Items
CREATE TABLE shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE shopping_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_done BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Expenses Table (Finance Feature)
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  date DATE DEFAULT CURRENT_DATE,
  paid_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Trigger to automatically create a profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Helper function to avoid RLS recursion on family_members
CREATE OR REPLACE FUNCTION get_my_family_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT family_id FROM family_members WHERE user_id = auth.uid();
$$;

-- family_members policies
CREATE POLICY family_members_select ON family_members
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    family_id IN (SELECT get_my_family_ids())
  );

CREATE POLICY family_members_insert ON family_members
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() OR 
    family_id IN (SELECT get_my_family_ids())
  );

CREATE POLICY family_members_update ON family_members
  FOR UPDATE
  USING (family_id IN (SELECT get_my_family_ids()));

CREATE POLICY family_members_delete ON family_members
  FOR DELETE
  USING (
    user_id = auth.uid() OR
    family_id IN (SELECT get_my_family_ids())
  );

-- Families policies
-- Anyone authenticated can read family details (UUIDs make this safe from enumeration)
CREATE POLICY family_access_select ON families
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Anyone authenticated can create a new family
CREATE POLICY family_access_insert ON families
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Only members can update the family
CREATE POLICY family_access_update ON families
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM family_members 
    WHERE family_members.family_id = families.id 
    AND family_members.user_id = auth.uid()
  ));

-- Only owners/admins can delete the family
CREATE POLICY family_access_delete ON families
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM family_members 
    WHERE family_members.family_id = families.id 
    AND family_members.user_id = auth.uid()
    AND family_members.role IN ('OWNER', 'ADMIN')
  ));

-- Tasks policy: Only members can CRUD tasks within their family
CREATE POLICY task_access ON tasks
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM family_members 
    WHERE family_members.family_id = tasks.family_id 
    AND family_members.user_id = auth.uid()
  ));

-- Invites policy: 
CREATE POLICY view_invites_by_members ON invites
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM family_members 
    WHERE family_members.family_id = invites.family_id 
    AND family_members.user_id = auth.uid()
  ));

CREATE POLICY create_invites_by_admins ON invites
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM family_members 
    WHERE family_members.family_id = invites.family_id 
    AND family_members.user_id = auth.uid()
    AND family_members.role IN ('OWNER', 'ADMIN')
  ));

-- Allow reading invite by code (publicly accessible for join flow)
CREATE POLICY view_invite_by_code ON invites
  FOR SELECT
  USING (true);

-- Expenses policy: Only members can CRUD expenses within their family
CREATE POLICY expense_access ON expenses
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM family_members 
    WHERE family_members.family_id = expenses.family_id 
    AND family_members.user_id = auth.uid()
  ));
