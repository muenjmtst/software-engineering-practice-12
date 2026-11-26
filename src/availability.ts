import { minutesToTime } from '@/time';
export { timeToMinutes, minutesToTime } from '@/time';
import type { AvailabilityResult, Booking, Room } from '@/types';

export const MINUTES_PER_DAY = 1440;
export const MAX_DURATION = 120;

export function checkAvailability(
  room: Room,
  start: number,
  end: number,
  currentTime: number,
  existingBookings: Booking[],
): AvailabilityResult {
  const reasons: string[] = [];

  // AC1: valid interval — 0 ≤ start < end ≤ 1440, start after current time
  if (
    !Number.isInteger(start) ||
    !Number.isInteger(end) ||
    start < 0 ||
    start >= end ||
    end > MINUTES_PER_DAY
  ) {
    reasons.push('Interval is invalid: start must be before end and within 00:00–24:00.');
  }
  if (!Number.isInteger(currentTime) || start <= currentTime) {
    reasons.push('Start time must be after the current time.');
  }

  // AC2: reject bookings longer than 120 minutes
  if (end - start > MAX_DURATION) {
    reasons.push(`Booking is ${end - start} min — exceeds the 120-minute maximum.`);
  }

  // AC3: reject when room is blocked
  if (room.blocked) {
    reasons.push(`${room.name} is currently blocked and cannot be booked.`);
  }

  // AC4: reject overlaps with existing bookings (touching endpoints allowed)
  for (const b of existingBookings) {
    if (b.roomId !== room.id) continue;
    const overlaps = b.start < end && start < b.end;
    if (overlaps) {
      reasons.push(
        `Overlaps an existing booking (${minutesToTime(b.start)}–${minutesToTime(b.end)} by ${b.bookedBy}).`,
      );
    }
  }

  return reasons.length === 0 ? { available: true } : { available: false, reasons };
}
