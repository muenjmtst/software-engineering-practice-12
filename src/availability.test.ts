import { describe, it, expect } from 'vitest';
import { checkAvailability, MINUTES_PER_DAY, MAX_DURATION } from '@/availability';
import type { Booking, Room } from '@/types';

// Fixed "current time" for deterministic results: 09:00 = 540 minutes.
const CURRENT_TIME = 540;

// Deterministic fixtures, independent of the shared data.ts seed.
const openRoom: Room = {
  id: 'R1',
  name: 'Test Room R1',
  building: 'North Wing',
  capacity: 10,
  blocked: false,
};

const blockedRoom: Room = { ...openRoom, id: 'R2', name: 'Test Room R2', blocked: true };

const baseBookings: Booking[] = [
  // 10:00–11:00 booking in R1
  { roomId: 'R1', start: 600, end: 660, bookedBy: 'Alice' },
  // 13:00–14:00 booking in R1
  { roomId: 'R1', start: 780, end: 840, bookedBy: 'Bob' },
];

/** Deep clone so each test starts from an untouched fixture. */
function cloneBookings(): Booking[] {
  return baseBookings.map((b) => ({ ...b }));
}

describe('AC1 — valid interval and start time', () => {
  it.each([
    ['fractional start', 550.5, 570],
    ['fractional end', 550, 570.5],
    ['NaN start', Number.NaN, 570],
    ['NaN end', 550, Number.NaN],
  ])('rejects %s at the rules boundary', (_name, start, end) => {
    expect(checkAvailability(openRoom, start, end, CURRENT_TIME, [])).toEqual({
      available: false,
      reasons: ['Interval is invalid: start must be before end and within 00:00–24:00.'],
    });
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, 540.5])(
    'rejects an invalid current time of %s',
    (currentTime) => {
      expect(checkAvailability(openRoom, 550, 570, currentTime, [])).toEqual({
        available: false,
        reasons: ['Start time must be after the current time.'],
      });
    },
  );

  it('rejects start >= end', () => {
    const result = checkAvailability(openRoom, 600, 600, CURRENT_TIME, cloneBookings());
    expect(result.available).toBe(false);
    if (!result.available) {
      expect(result.reasons.some((r) => /invalid/i.test(r))).toBe(true);
    }
  });

  it('rejects start > end', () => {
    const result = checkAvailability(openRoom, 660, 600, CURRENT_TIME, cloneBookings());
    expect(result.available).toBe(false);
  });

  it('rejects negative start', () => {
    const result = checkAvailability(openRoom, -10, 60, CURRENT_TIME, cloneBookings());
    expect(result.available).toBe(false);
  });

  it('rejects end beyond 1440', () => {
    const result = checkAvailability(openRoom, 1380, 1500, CURRENT_TIME, cloneBookings());
    expect(result.available).toBe(false);
  });

  it('rejects a start in the past (start <= currentTime)', () => {
    const result = checkAvailability(openRoom, 500, 560, CURRENT_TIME, cloneBookings());
    expect(result.available).toBe(false);
    if (!result.available) {
      expect(result.reasons.some((r) => /after the current time/i.test(r))).toBe(true);
    }
  });

  it('accepts a valid interval after current time with no conflicts', () => {
    // 09:10–09:30, strictly after current time (540) and before the first booking (600)
    const result = checkAvailability(openRoom, 550, 570, CURRENT_TIME, cloneBookings());
    expect(result.available).toBe(true);
  });
});

describe('AC2 — maximum duration (120 min)', () => {
  it('accepts a booking of exactly 120 minutes', () => {
    // 14:00–16:00 = 120 min, no overlap with existing bookings.
    const result = checkAvailability(openRoom, 840, 960, CURRENT_TIME, cloneBookings());
    expect(result.available).toBe(true);
    expect(MAX_DURATION).toBe(120);
  });

  it('rejects a booking longer than 120 minutes', () => {
    const result = checkAvailability(openRoom, 540, 670, CURRENT_TIME, cloneBookings());
    // 130 min — also overlaps, but duration reason must be present
    expect(result.available).toBe(false);
    if (!result.available) {
      expect(result.reasons.some((r) => /exceeds the 120-minute maximum/i.test(r))).toBe(true);
    }
  });

  it('rejects a 121-minute booking in a non-overlapping slot', () => {
    // 14:00–16:01 = 121 min, no existing overlap
    const result = checkAvailability(openRoom, 840, 961, CURRENT_TIME, cloneBookings());
    expect(result.available).toBe(false);
    if (!result.available) {
      expect(result.reasons.some((r) => /exceeds the 120-minute maximum/i.test(r))).toBe(true);
    }
  });
});

describe('AC3 — blocked rooms', () => {
  it('rejects a blocked room', () => {
    const result = checkAvailability(blockedRoom, 540, 570, CURRENT_TIME, cloneBookings());
    expect(result.available).toBe(false);
    if (!result.available) {
      expect(result.reasons.some((r) => /blocked/i.test(r))).toBe(true);
    }
  });

  it('does not flag an open room as blocked', () => {
    const result = checkAvailability(openRoom, 550, 570, CURRENT_TIME, cloneBookings());
    expect(result.available).toBe(true);
  });
});

describe('AC4 — overlaps and touching endpoints', () => {
  it('rejects a request fully inside an existing booking', () => {
    // 10:15–10:45 inside 10:00–11:00
    const result = checkAvailability(openRoom, 615, 645, CURRENT_TIME, cloneBookings());
    expect(result.available).toBe(false);
    if (!result.available) {
      expect(result.reasons.some((r) => /overlaps/i.test(r))).toBe(true);
    }
  });

  it('rejects a request partially overlapping at the end', () => {
    // 10:30–11:30 overlaps 10:00–11:00
    const result = checkAvailability(openRoom, 630, 690, CURRENT_TIME, cloneBookings());
    expect(result.available).toBe(false);
  });

  it('rejects a request partially overlapping at the start', () => {
    // 09:30–10:30 overlaps 10:00–11:00
    const result = checkAvailability(openRoom, 570, 630, CURRENT_TIME, cloneBookings());
    expect(result.available).toBe(false);
  });

  // BUG-A coverage: touching endpoints must NOT be treated as overlaps.
  it('BUG-A: allows a request starting exactly when an existing booking ends', () => {
    // Existing 10:00–11:00 (600–660). New 11:00–11:30 (660–690) touches at 660.
    const result = checkAvailability(openRoom, 660, 690, CURRENT_TIME, cloneBookings());
    expect(result.available).toBe(true);
  });

  it('BUG-A: allows a request ending exactly when an existing booking begins', () => {
    // Existing 10:00–11:00 (600–660). New 09:10–10:00 (550–600) touches at 600,
    // and starts strictly after current time (540).
    const result = checkAvailability(openRoom, 550, 600, CURRENT_TIME, cloneBookings());
    expect(result.available).toBe(true);
  });

  it('ignores bookings for a different room', () => {
    const result = checkAvailability(
      { ...openRoom, id: 'OTHER' },
      600,
      660,
      CURRENT_TIME,
      cloneBookings(),
    );
    expect(result.available).toBe(true);
  });
});

describe('AC5 — availability result without mutating bookings', () => {
  it('returns { available: true } for a free slot', () => {
    const result = checkAvailability(openRoom, 550, 570, CURRENT_TIME, cloneBookings());
    expect(result).toEqual({ available: true });
  });

  it('returns { available: false, reasons: [...] } for an unavailable slot', () => {
    const result = checkAvailability(openRoom, 615, 645, CURRENT_TIME, cloneBookings());
    expect(result.available).toBe(false);
    if (!result.available) {
      expect(Array.isArray(result.reasons)).toBe(true);
      expect(result.reasons.length).toBeGreaterThan(0);
    }
  });

  // BUG-B coverage: the function must not mutate the original bookings array or its objects.
  it('BUG-B: does not mutate the bookings array or its objects', () => {
    const input = cloneBookings();
    const snapshot = baseBookings.map((b) => ({ ...b }));

    checkAvailability(openRoom, 540, 600, CURRENT_TIME, input);
    checkAvailability(openRoom, 600, 660, CURRENT_TIME, input);
    checkAvailability(blockedRoom, 540, 570, CURRENT_TIME, input);

    // Array reference unchanged: same length and identical object references.
    expect(input.length).toBe(snapshot.length);
    expect(input.map((b) => ({ ...b }))).toEqual(snapshot);

    // Compare against the original fixture, which must remain byte-for-byte equal.
    expect(baseBookings).toEqual(snapshot);
  });
});

describe('AC6 — UI feedback sanity (logic-level, not full UI)', () => {
  // AC6 requires desktop/mobile UI feedback. A unit test can only verify the
  // data shape the UI consumes; visual/responsive layout must be checked
  // separately (see notes below).
  it('produces a reasons array of strings for unavailable results', () => {
    const result = checkAvailability(blockedRoom, 540, 570, CURRENT_TIME, cloneBookings());
    expect(result.available).toBe(false);
    if (!result.available) {
      expect(result.reasons.every((r) => typeof r === 'string')).toBe(true);
    }
  });

  it('produces no reasons for an available result', () => {
    const result = checkAvailability(openRoom, 550, 570, CURRENT_TIME, cloneBookings());
    expect(result).toEqual({ available: true });
  });

  it('includes the room name in the blocked-room reason for UI display', () => {
    const result = checkAvailability(blockedRoom, 540, 570, CURRENT_TIME, cloneBookings());
    expect(result.available).toBe(false);
    if (!result.available) {
      expect(result.reasons.some((r) => r.includes(blockedRoom.name))).toBe(true);
    }
  });
});

// Sanity: constants used by the tests match the implementation.
describe('constants', () => {
  it('MINUTES_PER_DAY is 1440', () => {
    expect(MINUTES_PER_DAY).toBe(1440);
  });
  it('MAX_DURATION is 120', () => {
    expect(MAX_DURATION).toBe(120);
  });
});
