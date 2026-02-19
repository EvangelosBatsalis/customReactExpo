
export const APP_NAME = "Famly";
export const THEME_COLOR = "#4f46e5"; // Indigo 600

export const ROLE_PERMISSIONS = {
  OWNER: ['manage_members', 'manage_settings', 'create_content', 'edit_content', 'delete_content', 'invite_members'],
  ADMIN: ['manage_members', 'create_content', 'edit_content', 'delete_content', 'invite_members'],
  MEMBER: ['create_content', 'edit_content'],
  VIEWER: []
};

export const can = (userRole: string, action: string): boolean => {
  const perms = (ROLE_PERMISSIONS as any)[userRole] || [];
  return perms.includes(action);
};
