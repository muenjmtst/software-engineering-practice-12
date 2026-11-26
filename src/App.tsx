import { useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  Clock,
  DoorClosed,
  Users,
  XCircle,
} from 'lucide-react';
import { bookings as initialBookings, rooms } from '@/data';
import {
  MAX_DURATION,
  MINUTES_PER_DAY,
  minutesToTime,
  timeToMinutes,
} from '@/availability';
import type { Booking, Room } from '@/types';
import ExplanationPanel from '@/ExplanationPanel';
import { evaluateRequest } from '@/practice12';
import type { Practice12Result } from '@/practice12';

function App() {
  const [roomId, setRoomId] = useState<string>(rooms[0].id);
  const [startTime, setStartTime] = useState('10:30');
  const [duration, setDuration] = useState('60');
  const [blocked, setBlocked] = useState(false);
  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
  });
  const [currentTimeStr, setCurrentTimeStr] = useState('09:00');
  const [result, setResult] = useState<Practice12Result | null>(null);

  const selectedRoom: Room | undefined = rooms.find((r) => r.id === roomId);
  const startMinutes = timeToMinutes(startTime);
  const durationNumber = duration.trim() === '' ? NaN : Number(duration);
  const endMinutes = startMinutes === null || !Number.isInteger(durationNumber) ? null : startMinutes + durationNumber;
  const endTime = endMinutes !== null && endMinutes >= 0 && endMinutes <= MINUTES_PER_DAY
    ? minutesToTime(endMinutes) : '';
  const roomBookings: Booking[] = useMemo(
    () => initialBookings.filter((b) => b.roomId === roomId),
    [roomId],
  );

  const handleCheck = () => {
    if (!selectedRoom) return;
    setResult(evaluateRequest(selectedRoom, initialBookings, {
      date, startTime, duration, blocked, now: new Date(), currentTimeOverride: currentTimeStr,
    }));
  };

  const todaySchedule = roomBookings
    .slice()
    .sort((a, b) => a.start - b.start)
    .map((b) => `${minutesToTime(b.start)} – ${minutesToTime(b.end)} (${b.bookedBy})`);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
            <CalendarCheck size={22} />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Smart Campus Room Checker</h1>
            <p className="text-sm text-slate-500">Find a valid booking slot for your study room</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-7">
        <div className="grid gap-6 md:grid-cols-5">
          {/* Form Card */}
          <section className="md:col-span-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-base font-semibold">Check availability</h2>
            <p className="mb-5 text-sm text-slate-500">
              Pick a future date, start time and duration. All times use a 24-hour clock.
            </p>

            {/* Room select */}
            <label htmlFor="room" className="mb-1 block text-sm font-medium text-slate-700">Room</label>
            <div className="relative mb-4">
              <select
                id="room"
                value={roomId}
                onChange={(e) => {
                  setRoomId(e.target.value);
                  setResult(null);
                }}
                className="w-full appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pl-3 pr-9 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} — {r.building} (cap {r.capacity})
                    {r.blocked ? ' [BLOCKED]' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected room summary — visible on all screen sizes */}
            {selectedRoom && (
              <div className="mb-5 rounded-lg border border-slate-100 bg-slate-50 p-3">
                <p className="text-sm font-medium text-slate-700">{selectedRoom.name}</p>
                <p className="text-xs text-slate-500">{selectedRoom.building}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600">
                    <Users size={13} /> {selectedRoom.capacity} seats
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                      blocked
                        ? 'bg-red-100 text-red-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    <DoorClosed size={13} />
                    {blocked ? 'Blocked' : 'Open'}
                  </span>
                </div>
              </div>
            )}

            <label htmlFor="booking-date" className="mb-1 block text-sm font-medium">Date</label>
            <input id="booking-date" type="date" value={date} onChange={(e) => { setDate(e.target.value); setResult(null); }} className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2.5" />
            {/* Time inputs */}
            <div className="mb-4 grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="start-time" className="mb-1 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  <Clock size={14} /> Start time
                </label>
                <input
                  id="start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    setResult(null);
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <div>
                <label htmlFor="duration" className="mb-1 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  <Clock size={14} /> Duration (minutes)
                </label>
                <input
                  id="duration"
                  type="number"
                  value={duration}
                  onChange={(e) => {
                    setDuration(e.target.value);
                    setResult(null);
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>

            {/* Duration hint */}
            <div className="mb-4 flex flex-col gap-1 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <span>End time: {endTime || 'invalid'} · Duration: {duration || '0'} min</span>
              <span>Max allowed: {MAX_DURATION} min · Day ends at {minutesToTime(MINUTES_PER_DAY)}</span>
            </div>

            <label className="mb-4 flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={blocked} onChange={(e) => { setBlocked(e.target.checked); setResult(null); }} /> Room blocked (test control)</label>

            {/* Current-time override for testing */}
            <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
              <label htmlFor="current-time" className="mb-1 block text-xs font-semibold text-amber-800">
                Current time (for testing)
              </label>
              <input
                id="current-time"
                type="time"
                value={currentTimeStr}
                onChange={(e) => {
                  setCurrentTimeStr(e.target.value);
                  setResult(null);
                }}
                className="w-full rounded-md border border-amber-300 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              />
            </div>

            <button
              onClick={handleCheck}
              className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[.99]"
            >
              Check Availability
            </button>

            {/* Confirmed result remains separate from the optional explanation. */}
            {result && (
              <div
                role="status"
                data-testid="confirmed-status"
                className={`mt-5 rounded-xl border p-4 ${
                  result.available
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {result.available ? (
                    <CheckCircle2 className="text-emerald-600" size={20} />
                  ) : (
                    <XCircle className="text-red-600" size={20} />
                  )}
                  <span
                    className={`text-sm font-semibold ${
                      result.available ? 'text-emerald-700' : 'text-red-700'
                    }`}
                  >
                    {result.available ? 'Available — you can book this slot.' : `Unavailable (${result.code})`}
                  </span>
                </div>
                {!result.available && (
                  <ul className="mt-2 space-y-1">
                    {result.reasons.map((r, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-red-600">
                        <AlertCircle size={13} className="mt-0.5 shrink-0" />
                        {r}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {result && selectedRoom && (
              <ExplanationPanel
                key={`${roomId}|${date}|${startTime}|${endTime}|${currentTimeStr}|${blocked}`}
                roomLabel={selectedRoom.name}
                startTime={startTime}
                endTime={endTime}
                result={result}
              />
            )}
          </section>

          {/* Sidebar: room schedule */}
          <aside className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-1 text-sm font-semibold">
              {selectedRoom?.name ?? 'Room'} schedule
            </h2>
            <p className="mb-4 text-xs text-slate-500">Fictional bookings for the selected date</p>

            {todaySchedule.length === 0 ? (
              <p className="rounded-lg bg-slate-50 px-3 py-6 text-center text-xs text-slate-400">
                No existing bookings.
              </p>
            ) : (
              <ul className="space-y-2">
                {todaySchedule.map((s, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600"
                  >
                    <Clock size={13} className="shrink-0 text-slate-400" />
                    {s}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 rounded-lg bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-400">
              Bookings longer than {MAX_DURATION} min and blocked rooms are rejected.
              Overlapping intervals are not allowed; back-to-back slots are fine.
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default App;
