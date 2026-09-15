export function ownsResource(ownerId: string, authenticatedUserId: string): boolean {
  return ownerId === authenticatedUserId;
}
