export interface Room {
  id: string;
  name: string;
  building: string;
  capacity: number;
  blocked: boolean;
}

export interface Booking {
  roomId: string;
  start: number; // minutes from midnight
  end: number; // minutes from midnight
  bookedBy: string;
}

export type AvailabilityResult =
  | { available: true }
  | { available: false; reasons: string[] };
