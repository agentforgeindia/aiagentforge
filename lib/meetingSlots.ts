// ============================================================
// Meeting slot config + helpers (IST). Mon–Sat, 11:00–19:00,
// 30-minute slots, no buffer. Last start = 18:30.
// ============================================================

export const SLOT_START_HOUR = 11;
export const SLOT_END_HOUR = 19; // exclusive end → last slot starts 18:30
export const SLOT_STEP_MIN = 30;
export const IST_OFFSET = "+05:30";

// "HH:MM" start times for a working day.
export function daySlots(): string[] {
  const out: string[] = [];
  for (let m = SLOT_START_HOUR * 60; m < SLOT_END_HOUR * 60; m += SLOT_STEP_MIN) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    out.push(`${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`);
  }
  return out;
}

// Weekday of a YYYY-MM-DD calendar date (0=Sun … 6=Sat), TZ-stable.
export function weekday(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

// Mon–Sat are working days (Sunday closed).
export function isWorkingDay(dateStr: string): boolean {
  return weekday(dateStr) !== 0;
}

// Full ISO (with IST offset) for a date + "HH:MM".
export function slotIso(dateStr: string, time: string): string {
  return `${dateStr}T${time}:00${IST_OFFSET}`;
}

// 12-hour label, e.g. "11:30 AM".
export function slotLabel(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function isValidSlotTime(time: string): boolean {
  return daySlots().includes(time);
}
