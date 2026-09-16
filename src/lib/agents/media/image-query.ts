export function selectImageSearchQuery(modelQuery: string | undefined, originalQuery: string): string {
  return modelQuery?.trim() || originalQuery.trim();
}
