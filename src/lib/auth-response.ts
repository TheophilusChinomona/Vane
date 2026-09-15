export function unauthorizedResponse(): Response {
  return Response.json({ message: 'Authentication required' }, { status: 401 });
}
