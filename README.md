# Smart Campus — Practice 11

An optional explanation of the existing room-availability decision. One fictional room (A101), two fictional bookings, no login, database, external model calls or API credentials.

## Run

Node.js 20+ and npm. Run `npm ci`, `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, then `npm run preview -- --host 127.0.0.1`. Open the printed Local URL. No environment variables are needed. Keep every original test assertion.

## User story and flow

As a student, I want a short explanation of room availability so I understand the decision.

Student time inputs -> existing parser -> unchanged deterministic checker -> confirmed UI status. Optional Explain availability -> sanitized structured context -> local mock adapter -> validated `{ explanation: string }` -> separate, labeled explanation. A failure returns a deterministic fallback. Changing an input unmounts the explanation panel and cancels pending work.

## Contract and acceptance criteria

Input: `{ roomLabel, startTime, endTime, isAvailable, reasonCode }`. `roomLabel` is nonblank and at most 80 characters, without HTML delimiters or control characters. Times are exactly HH:MM (00:00–23:59); a reversed but well-formed interval is allowed in the explanation context so the checker can explain its rejection. Empty/malformed times fail before the adapter. `reasonCode` is AVAILABLE, INVALID_INPUT, INVALID_TIME, PAST_TIME, TOO_LONG, BLOCKED, OVERLAP or OTHER. The code must agree with the supplied confirmed boolean. Only these five fields cross the boundary; no raw reasons, booking owners or booking records.

Output: exactly one own data property `{ explanation: string }` (inherited fields and accessors are rejected), at most 320 characters and two sentences. This classroom mock uses approved factual wording per reason code. Strict output validation rejects any other wording, including contradictory status, HTML, invented reservations and booking details. This intentionally restrictive validator must be redesigned and evaluated before using a free-form live model.

- AC1: all existing rules, reason strings, order, exports, fixtures and assertions stay unchanged.
- AC2: explanation agrees with the checker and invents no booking details; the checker is the only source of truth. For multiple failures, the explanation summarizes the first reason; the full original list stays visible.
- AC3: empty, malformed and oversized context or response is rejected; user fields are untrusted inert data.
- AC4: timeout (1200 ms), adapter exception, simulated missing key and invalid response yield deterministic fallback. Abort signals and cleanup bound work; stale UI answers must not appear.
- AC5: generated mock text, standard fallback and confirmed booking status are visibly distinct. No explanation creates a reservation.

## Demonstrate

Use defaults (current 09:00, start 10:30, end 11:30), Check Availability, then Explain availability. For overlap, use 13:30–14:30. Expand Classroom demo to simulate timeout, API error, missing key, malformed, contradictory or oversized output. Every mode is local; API calls and model cost are zero. Blocked-room and oversized context cases are unit fixtures, not new product controls.

The mock is browser-local, with no external service or secrets. A future real-model adapter must run on a server, minimize data, maintain timeouts and revalidate the response. It is not implemented or advertised as live AI here.
