/**
 * Convert ISO date string to readable standard date string based on locale.
 * @param dateStr
 * @return string
 */
function formatDate(dateStr: string) {
  let date = new Date(dateStr);
  return date.toLocaleDateString();
}

export { formatDate };
