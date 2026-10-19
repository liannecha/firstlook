export function recordPassed(history: readonly string[], id: string): string[] {
  return [id, ...history.filter(companyId => companyId !== id)];
}

export function removePassed(history: readonly string[], id: string): string[] {
  return history.filter(companyId => companyId !== id);
}

export function visiblePassed(history: readonly string[], interestedIds: readonly string[]): string[] {
  const interested = new Set(interestedIds);
  return history.filter(id => !interested.has(id));
}
