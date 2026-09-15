export function shouldPromoteFirstUser(adminCount: number): boolean {
  return adminCount === 0;
}
