export function matchesItemCategory(pattern: string, categoryId: string): boolean {
  if (pattern === '*') {
    return true;
  }

  if (pattern === categoryId) {
    return true;
  }

  if (pattern.endsWith('/*')) {
    const prefix = pattern.slice(0, -2);
    return categoryId === prefix || categoryId.startsWith(prefix + '/');
  }

  return false;
}
