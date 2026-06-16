export function timeAgo(dateStr: string | Date): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return String(dateStr).toUpperCase() || 'UNKNOWN';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'JUST NOW';
  if (diffMin < 60) return `${diffMin} MIN AGO`;
  if (diffHrs < 24) return `${diffHrs} HR${diffHrs > 1 ? 'S' : ''} AGO`;
  if (diffDays < 7) return `${diffDays} DAY${diffDays > 1 ? 'S' : ''} AGO`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
}

export function publishDate(dateStr: string | Date): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return String(dateStr) || 'UNKNOWN';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
