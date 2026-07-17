/** Numeric UTC offset (hours) for an IANA timezone at a local civil datetime. */
export function tzOffsetFor(tzName, y, mo, d, hh = 12, mm = 0) {
  if (!tzName) return null;
  try {
    const utcMs = Date.UTC(+y, +mo - 1, +d, +hh, +mm, 0);
    const dt = new Date(utcMs);
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tzName,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const parts = fmt.formatToParts(dt).reduce((a, p) => {
      a[p.type] = p.value;
      return a;
    }, {});
    const asLocalMs = Date.UTC(
      +parts.year,
      +parts.month - 1,
      +parts.day,
      +parts.hour % 24,
      +parts.minute,
      +parts.second,
    );
    return (asLocalMs - utcMs) / 3600000;
  } catch {
    return null;
  }
}

export function countryName(code) {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) || code;
  } catch {
    return code;
  }
}
