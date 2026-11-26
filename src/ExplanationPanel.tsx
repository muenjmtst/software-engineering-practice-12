import { useEffect, useRef, useState } from 'react';
import { createExplanationContext, createMockAdapter, explainAvailability } from '@/explanation';
import type { ExplanationResult, MockMode } from '@/explanation';
import type { AvailabilityResult } from '@/types';

interface Props { roomLabel: string; startTime: string; endTime: string; result: AvailabilityResult }

export default function ExplanationPanel({ roomLabel, startTime, endTime, result }: Props) {
  const [mode, setMode] = useState<MockMode>('normal');
  const [pending, setPending] = useState(false);
  const [answer, setAnswer] = useState<ExplanationResult | null>(null);
  const active = useRef<AbortController | null>(null);
  const requestId = useRef(0);
  useEffect(() => () => { requestId.current++; active.current?.abort(); }, []);

  const handleExplain = async () => {
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    const id = ++requestId.current;
    setPending(true);
    setAnswer(null);
    let context: unknown = null;
    try { context = createExplanationContext(roomLabel, startTime, endTime, result); } catch { /* Invalid input uses the deterministic fallback. */ }
    const next = await explainAvailability(context, result.available, createMockAdapter(mode), { signal: controller.signal });
    if (id !== requestId.current || controller.signal.aborted) return;
    setAnswer(next);
    setPending(false);
  };

  return (
    <section aria-label="Availability explanation" className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-800">Understand this result</h3>
        <span className="rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700">Mock AI · no API</span>
      </div>
      <p className="mt-2 text-sm text-slate-600">Optional explanation. The confirmed status above comes from booking rules.</p>
      <button type="button" onClick={handleExplain} disabled={pending}
        className="mt-3 w-full rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-2.5 text-sm font-semibold text-indigo-800 transition hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-wait disabled:opacity-60">
        {pending ? 'Explaining…' : 'Explain availability'}
      </button>
      <div aria-live="polite" aria-atomic="true" aria-busy={pending}>
        {pending && <p className="mt-3 text-sm text-slate-600">Preparing a short explanation…</p>}
        {answer && <div className="mt-3 rounded-lg bg-slate-50 p-3" data-testid="explanation-answer">
          <p className="mb-1 text-sm font-semibold text-slate-700">{answer.source === 'fallback' ? 'Standard explanation · safe fallback' : 'Generated explanation · mock'}</p>
          <p className="text-sm leading-relaxed text-slate-700">{answer.explanation}</p>
          {answer.source === 'fallback' && <p className="mt-2 text-sm text-slate-500">The explanation service could not provide a valid answer. The confirmed status is unchanged.</p>}
          <p className="mt-2 text-xs text-slate-500">{answer.latencyMs} ms · 0 API calls · $0 model cost</p>
        </div>}
      </div>
      <details className="mt-3 text-sm text-slate-600">
        <summary className="cursor-pointer rounded focus:outline-none focus:ring-2 focus:ring-indigo-500">Classroom demo: simulate a failure</summary>
        <label htmlFor="explanation-mode" className="mb-1 mt-3 block font-medium">Explanation service mode</label>
        <select id="explanation-mode" value={mode} onChange={(event) => {
          requestId.current++;
          active.current?.abort();
          setMode(event.target.value as MockMode);
          setPending(false);
          setAnswer(null);
        }} className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="normal">Normal mock response</option>
          <option value="timeout">Timeout</option>
          <option value="error">Simulated API error</option>
          <option value="missing-key">Missing API key</option>
          <option value="malformed">Malformed response</option>
          <option value="contradictory">Contradictory response</option>
          <option value="long-output">Overly long response</option>
        </select>
        <p className="mt-2 text-sm">All modes are simulated locally. No external model or personal data is used.</p>
      </details>
    </section>
  );
}
