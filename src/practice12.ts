import { checkAvailability, MAX_DURATION, MINUTES_PER_DAY, timeToMinutes } from './availability';
import type { AvailabilityResult, Booking, Room } from './types';

export interface Request {
  date: string;
  startTime: string;
  duration: string;
  blocked: boolean;
  now: Date;
  /** Existing Practice 11 classroom override, used only for same-day checks. */
  currentTimeOverride?: string;
}

export type Practice12Result = AvailabilityResult & { code: string };

export function evaluateRequest(room: Room, existing: Booking[], request: Request): Practice12Result {
  const { date, startTime, duration, blocked, now, currentTimeOverride } = request;
  const start = timeToMinutes(startTime);
  const count = Number(duration);
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00`) : null;
  const canonical = parsed && !Number.isNaN(parsed.getTime())
    ? `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}` : '';
  if (canonical !== date || start === null) {
    return { available: false, code: 'INVALID_INPUT', reasons: ['Please enter a valid date and start time.'] };
  }
  if (duration.trim() === '' || !Number.isInteger(count) || count <= 0 || count > MAX_DURATION) {
    return { available: false, code: 'INVALID_DURATION', reasons: ['Duration must be 1–120 minutes.'] };
  }
  const end = start + count;
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const clock = currentTimeOverride ? timeToMinutes(currentTimeOverride) : now.getHours() * 60 + now.getMinutes();
  if (clock === null) return { available: false, code: 'INVALID_INPUT', reasons: ['Please enter a valid current time.'] };
  // Preserve the existing minute-based checker. Dates determine only the current-time boundary.
  const effectiveClock = date < today ? MINUTES_PER_DAY : date > today ? -1 : clock;
  const result = checkAvailability({ ...room, blocked }, start, end, effectiveClock, existing);
  if (result.available) return { ...result, code: 'AVAILABLE' };
  const first = result.reasons[0];
  const code = first.startsWith('Interval is invalid') ? 'INVALID_INTERVAL'
    : first.startsWith('Start time must') ? 'PAST_START'
    : first.includes('120-minute maximum') ? 'INVALID_DURATION'
    : first.includes('blocked') ? 'BLOCKED' : 'OVERLAP';
  return { ...result, code };
}
