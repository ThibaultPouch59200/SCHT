export function parseAmount(str: string): number {
  const s = str.trim().replace(/\s/g, '').replace(',', '.');
  const match = s.match(/^([\d.]+)\s*([kmKM]?)$/);
  if (!match) return 0;
  let val = parseFloat(match[1]);
  if (isNaN(val)) return 0;
  const suffix = match[2].toLowerCase();
  if (suffix === 'k') val *= 1_000;
  if (suffix === 'm') val *= 1_000_000;
  return Math.round(val);
}

export function fmtAuec(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2).replace(/\.?0+$/, '') + 'M aUEC';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.?0+$/, '') + 'k aUEC';
  return n.toLocaleString() + ' aUEC';
}

export function fmtShort(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2).replace(/\.?0+$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.?0+$/, '') + 'k';
  return n.toLocaleString();
}
