import { describe, it, expect } from 'vitest';
import { checkAvailability } from '@/availability';
import type { Booking, Room } from '@/types';

const CURRENT_TIME = 540;

const openRoom: Room = {
  id: 'R1',
  name: 'Test Room R1',
  building: 'North Wing',
  capacity: 10,
  blocked: false,
};

const blockedRoom: Room = { ...openRoom, id: 'R2', name: 'Test Room R2', blocked: true };

function frozenBookings(): Booking[] {
  const bs: Booking[] = [
    { roomId: 'R1', start: 600, end: 660, bookedBy: 'Alice' },
    { roomId: 'R1', start: 780, end: 840, bookedBy: 'Bob' },
  ];
  Object.freeze(bs[0]);
  Object.freeze(bs[1]);
  Object.freeze(bs);
  return bs;
}

function snapshot(b: Booking[]): Booking[] {
  return b.map((x) => ({ ...x }));
}

describe('immutability — frozen array and objects, available result', () => {
  it('does not mutate frozen bookings for an available request', () => {
    const input = frozenBookings();
    const before = snapshot([...input]);

    const result = checkAvailability(openRoom, 550, 570, CURRENT_TIME, input);

    expect(result).toEqual({ available: true });
    expect([...input]).toEqual(before);
    expect(input.map((b) => ({ ...b }))).toEqual(before);
    // Reference order preserved
    expect(input[0].start).toBe(600);
    expect(input[1].start).toBe(780);
  });
});

describe('immutability — frozen array and objects, rejected result', () => {
  it('does not mutate frozen bookings for a rejected overlap', () => {
    const input = frozenBookings();
    const before = snapshot([...input]);

    const result = checkAvailability(openRoom, 615, 645, CURRENT_TIME, input);

    expect(result.available).toBe(false);
    expect([...input]).toEqual(before);
    expect(input.map((b) => ({ ...b }))).toEqual(before);
    expect(input[0].start).toBe(600);
    expect(input[1].start).toBe(780);
  });

  it('does not mutate frozen bookings for a blocked room', () => {
    const input = frozenBookings();
    const before = snapshot([...input]);

    const result = checkAvailability(blockedRoom, 540, 570, CURRENT_TIME, input);

    expect(result.available).toBe(false);
    expect([...input]).toEqual(before);
  });

  it('does not mutate when bookings are in reversed order', () => {
    const bs: Booking[] = [
      { roomId: 'R1', start: 780, end: 840, bookedBy: 'Bob' },
      { roomId: 'R1', start: 600, end: 660, bookedBy: 'Alice' },
    ];
    Object.freeze(bs[0]);
    Object.freeze(bs[1]);
    Object.freeze(bs);
    const input = bs;
    const before = snapshot([...input]);

    const result = checkAvailability(openRoom, 615, 645, CURRENT_TIME, input);

    expect(result.available).toBe(false);
    expect([...input]).toEqual(before);
    expect(input[0].start).toBe(780);
    expect(input[1].start).toBe(600);
  });
});
