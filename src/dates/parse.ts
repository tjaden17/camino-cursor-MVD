/**
 * Best-effort parsing for AU-style dates in sample exports.
 * Not a full locale solution — sufficient for MVD replay fixtures.
 */

/** "20/10/2025 09:08 PM" or "01/10/2025 9:09 PM" — local calendar date in AU order D/M/Y */
export function parseAuSlashDateTime(s: string): Date | null {
  const m = s.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]) - 1;
  const year = Number(m[3]);
  if (month < 0 || month > 11) return null;
  return new Date(year, month, day);
}

const MON3: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

/** "13-Sep-25" → 13 Sep 2025 local */
export function parseShiftDate(s: string): Date | null {
  const m = s.trim().match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const key = m[2].charAt(0).toUpperCase() + m[2].slice(1, 3).toLowerCase();
  const mo = MON3[key];
  if (mo === undefined) return null;
  const year = 2000 + Number(m[3]);
  return new Date(year, mo, day);
}

export function inRangeInclusive(d: Date, start: Date, end: Date): boolean {
  return d >= start && d <= end;
}
