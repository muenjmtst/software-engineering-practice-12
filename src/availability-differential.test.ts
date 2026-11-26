import { describe, it, expect } from 'vitest';
import { checkAvailability } from '@/availability';
import type { AvailabilityResult, Booking, Room } from '@/types';

const CURRENT_TIME = 540;

const openRoom: Room = {
  id: 'R1',
  name: 'Test Room R1',
  building: 'North Wing',
  capacity: 10,
  blocked: false,
};

const blockedRoom: Room = { ...openRoom, id: 'R2', name: 'Test Room R2', blocked: true };

function bookings(order: 'asc' | 'desc' | 'other'): Booking[] {
  const base: Booking[] = [
    { roomId: 'R1', start: 600, end: 660, bookedBy: 'Alice' },
    { roomId: 'R1', start: 780, end: 840, bookedBy: 'Bob' },
  ];
  if (order === 'desc') return [base[1], base[0]];
  if (order === 'other') {
    return [
      { roomId: 'OTHER', start: 600, end: 660, bookedBy: 'Zoe' },
      base[0],
      base[1],
    ];
  }
  return base;
}

type Case = {
  name: string;
  room: Room;
  start: number;
  end: number;
  orders: ('asc' | 'desc' | 'other')[];
};

const matrix: Case[] = [
  // AC1 boundaries
  { name: 'start == currentTime (rejected)', room: openRoom, start: 540, end: 570, orders: ['asc', 'desc'] },
  { name: 'start == end (rejected)', room: openRoom, start: 600, end: 600, orders: ['asc'] },
  { name: 'start > end (rejected)', room: openRoom, start: 660, end: 600, orders: ['asc'] },
  { name: 'end == 1440 boundary (valid, no overlap)', room: openRoom, start: 1380, end: 1440, orders: ['asc'] },
  // AC2 boundaries
  { name: 'exactly 120 min (valid, no overlap)', room: openRoom, start: 840, end: 960, orders: ['asc'] },
  { name: '121 min (rejected duration)', room: openRoom, start: 840, end: 961, orders: ['asc'] },
  // AC4 touching endpoints — both directions
  { name: 'touches at existing end (available)', room: openRoom, start: 660, end: 690, orders: ['asc', 'desc'] },
  { name: 'touches at existing start (available)', room: openRoom, start: 550, end: 600, orders: ['asc', 'desc'] },
  // AC4 positive overlaps
  { name: 'fully inside booking (rejected)', room: openRoom, start: 615, end: 645, orders: ['asc', 'desc', 'other'] },
  { name: 'partial overlap at end (rejected)', room: openRoom, start: 630, end: 690, orders: ['asc'] },
  { name: 'partial overlap at start (rejected)', room: openRoom, start: 570, end: 630, orders: ['asc'] },
  // AC3 blocked
  { name: 'blocked room (rejected)', room: blockedRoom, start: 550, end: 570, orders: ['asc', 'desc'] },
  // Other-room bookings ignored — room with no matching bookings
  { name: 'same time as other-room booking (available)', room: { ...openRoom, id: 'RX' }, start: 600, end: 660, orders: ['other'] },
];

describe('differential — result identical across booking orders', () => {
  for (const c of matrix) {
    it(`${c.name}`, () => {
      const results: AvailabilityResult[] = c.orders.map((o) =>
        checkAvailability(c.room, c.start, c.end, CURRENT_TIME, bookings(o)),
      );
      const first = results[0];
      for (const r of results) {
        expect(r).toEqual(first);
      }
    });
  }
});

describe('differential — specific expected outcomes', () => {
  it('start == currentTime is rejected with past-time reason', () => {
    const r = checkAvailability(openRoom, 540, 570, CURRENT_TIME, bookings('asc'));
    expect(r.available).toBe(false);
    if (!r.available) {
      expect(r.reasons.some((x) => /after the current time/i.test(x))).toBe(true);
    }
  });

  it('exactly 120 min in free slot is available', () => {
    const r = checkAvailability(openRoom, 840, 960, CURRENT_TIME, bookings('asc'));
    expect(r).toEqual({ available: true });
  });

  it('121 min is rejected with duration reason', () => {
    const r = checkAvailability(openRoom, 840, 961, CURRENT_TIME, bookings('asc'));
    expect(r.available).toBe(false);
    if (!r.available) {
      expect(r.reasons.some((x) => /exceeds the 120-minute maximum/i.test(x))).toBe(true);
    }
  });

  it('touching at existing end is available', () => {
    expect(checkAvailability(openRoom, 660, 690, CURRENT_TIME, bookings('asc'))).toEqual({
      available: true,
    });
  });

  it('touching at existing start is available', () => {
    expect(checkAvailability(openRoom, 550, 600, CURRENT_TIME, bookings('asc'))).toEqual({
      available: true,
    });
  });

  it('fully inside booking is rejected with overlap reason', () => {
    const r = checkAvailability(openRoom, 615, 645, CURRENT_TIME, bookings('asc'));
    expect(r.available).toBe(false);
    if (!r.available) {
      expect(r.reasons.some((x) => /overlaps/i.test(x))).toBe(true);
    }
  });

  it('blocked room is rejected with blocked reason', () => {
    const r = checkAvailability(blockedRoom, 550, 570, CURRENT_TIME, bookings('asc'));
    expect(r.available).toBe(false);
    if (!r.available) {
      expect(r.reasons.some((x) => /blocked/i.test(x))).toBe(true);
    }
  });

  it('other-room booking at same time is available', () => {
    expect(checkAvailability({ ...openRoom, id: 'RX' }, 600, 660, CURRENT_TIME, bookings('other'))).toEqual({
      available: true,
    });
  });
});
