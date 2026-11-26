import { describe, it, expect } from 'vitest';
import { timeToMinutes, minutesToTime } from '@/time';

describe('time helpers — parsing boundaries', () => {
  it('parses 00:00 as 0', () => {
    expect(timeToMinutes('00:00')).toBe(0);
  });

  it('parses 23:59 as 1439', () => {
    expect(timeToMinutes('23:59')).toBe(1439);
  });

  it('parses 12:30 as 750', () => {
    expect(timeToMinutes('12:30')).toBe(750);
  });

  it('rejects empty string', () => {
    expect(timeToMinutes('')).toBeNull();
  });

  it('rejects malformed strings', () => {
    expect(timeToMinutes('9:00')).toBeNull();
    expect(timeToMinutes('09:0')).toBeNull();
    expect(timeToMinutes('09:0A')).toBeNull();
    expect(timeToMinutes('24:00')).toBeNull();
    expect(timeToMinutes('09:60')).toBeNull();
    expect(timeToMinutes('12:3:0')).toBeNull();
    expect(timeToMinutes('abc')).toBeNull();
  });
});

describe('time helpers — formatting boundaries', () => {
  it('formats 0 as 00:00', () => {
    expect(minutesToTime(0)).toBe('00:00');
  });

  it('formats 1439 as 23:59', () => {
    expect(minutesToTime(1439)).toBe('23:59');
  });

  it('formats 750 as 12:30', () => {
    expect(minutesToTime(750)).toBe('12:30');
  });

  it('pads single-digit hours and minutes', () => {
    expect(minutesToTime(61)).toBe('01:01');
  });

  it('round trips every hour boundary', () => {
    for (let h = 0; h <= 23; h++) {
      const m = h * 60;
      expect(timeToMinutes(minutesToTime(m))).toBe(m);
    }
  });
});
