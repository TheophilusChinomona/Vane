export function shouldPromoteFirstUser(adminCount: number): boolean {
  return adminCount === 0;
}

export function isAdminRole(role: unknown): boolean {
  return role === 'admin';
}
