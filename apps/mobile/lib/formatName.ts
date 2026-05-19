/**
 * Formate un nom proprement : "alexis lapasset" → "Alexis Lapasset"
 * Fallback depuis l'email : "alexis.lapasset@..." → "Alexis Lapasset"
 */
export function formatName(name?: string | null, email?: string | null): string {
  const raw = name?.trim() || email?.split('@')[0]?.replace(/[._-]/g, ' ') || '';
  return raw
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}
