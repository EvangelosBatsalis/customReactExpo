
-- 9. Invites Table
CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invite_code TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'MEMBER', -- 'ADMIN', 'MEMBER', 'VIEWER'
  status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'ACCEPTED', 'REVOKED'
  inviter_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Invites policy: 
-- 1. Family members can view invites for their family
-- 2. Anyone can read an invite by code (for the Join page)
-- 3. Only admins/owners can create invites

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

-- Allow reading invite by code (publicly accessible for join flow, technically needs anon key)
CREATE POLICY view_invite_by_code ON invites
  FOR SELECT
  USING (true); 
