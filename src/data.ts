import type { Booking, Room } from '@/types';

export const rooms: Room[] = [
  { id: 'A101', name: 'Study Room A101', building: 'North Wing', capacity: 8, blocked: false },
];

export const bookings: Booking[] = [
  { roomId: 'A101', start: 540, end: 600, bookedBy: 'Alice' },   // 9:00–10:00
  { roomId: 'A101', start: 780, end: 840, bookedBy: 'Bob' },     // 13:00–14:00
];
