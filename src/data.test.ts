import { expect, it } from 'vitest';
import { bookings, rooms } from '@/data';

it('ships one fictional room and only that room’s schedule', () => {
  expect(rooms.map((room) => room.id)).toEqual(['A101']);
  expect(bookings.map((booking) => booking.roomId)).toEqual(['A101', 'A101']);
});
