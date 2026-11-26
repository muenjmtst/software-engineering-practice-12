import { describe, expect, it } from 'vitest';
import { evaluateRequest } from './practice12';
import { bookings, rooms } from './data';

const fixed = { date: '2099-01-01', startTime: '10:30', duration: '60', blocked: false, now: new Date('2098-12-31T09:00:00') };
const run = (change: Partial<typeof fixed> = {}) => evaluateRequest(rooms[0], bookings, { ...fixed, ...change });
describe('Practice 12 common contract', () => {
  it.each([
    ['T1 free', {}, true, 'AVAILABLE'],
    ['T2 overlap', { startTime: '09:30' }, false, 'OVERLAP'],
    ['T3 blocked', { blocked: true }, false, 'BLOCKED'],
    ['T4 zero', { duration: '0' }, false, 'INVALID_DURATION'],
    ['T5 121', { duration: '121' }, false, 'INVALID_DURATION'],
    ['T6 past', { date: '2098-12-30' }, false, 'PAST_START'],
    ['T7 adjacent', { startTime: '10:00' }, true, 'AVAILABLE'],
  ])('%s', (_case, input, available, code) => {
    const result = run(input);
    expect(result.available).toBe(available);
    expect(result.code).toBe(code);
  });
  it('T8 bookings remain unchanged', () => {
    const before = JSON.stringify(bookings);
    for (const change of [{}, { startTime: '09:30' }, { blocked: true }, { duration: '0' }]) run(change);
    expect(JSON.stringify(bookings)).toBe(before);
  });
  it('rejects blank duration and invalid calendar dates', () => {
    expect(run({ duration: '' }).available).toBe(false);
    expect(run({ date: '2099-02-30' }).available).toBe(false);
  });
  it('rejects an interval crossing midnight', () => {
    expect(run({ startTime: '23:30', duration: '60' }).available).toBe(false);
  });
});
