/** Tunisia time (Africa/Tunis), Arabic month names, Western digits. */
const dateTime = new Intl.DateTimeFormat("ar-TN-u-nu-latn", {
  timeZone: "Africa/Tunis",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function formatDateTime(d: Date) {
  return dateTime.format(d);
}
