"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import type { TraceEvent } from './types';
import type { Locale } from '../i18n/locale';
import { advancePlayback, autoPlayback, currentPlayback, playbackFrame, type PlaybackFrame, type PlaybackState } from './playback';
function subscribeMotion(callback: () => void) { const media = window.matchMedia('(prefers-reduced-motion: reduce)'); media.addEventListener('change', callback); return () => media.removeEventListener('change', callback); }
export function TracePlayer({ trace, locale = 'en', executionMs, translate, renderStage, collapsible = false, autoPlay = false, onComplete, headingLevel = 'h2' }: {
    trace: TraceEvent[];
    locale?: Locale;
    executionMs?: number;
    collapsible?: boolean;
    /** Start playback as soon as a new trace arrives. */
    autoPlay?: boolean;
    /** Called once every step is shown (immediately under reduced motion). */
    onComplete?: () => void;
    /** Use 'h3' when the player sits inside a section that already has an h2. */
    headingLevel?: 'h2' | 'h3';
    translate: (key: string) => string;
    renderStage?: (frame: PlaybackFrame<TraceEvent>) => ReactNode;
}) {
    const reducedMotion = useSyncExternalStore(subscribeMotion, () => window.matchMedia('(prefers-reduced-motion: reduce)').matches, () => false);
    const [state, setState] = useState<PlaybackState<TraceEvent>>(() => { const initial = { trace, visible: 1, playing: false }; return autoPlay ? autoPlayback(initial) : initial; });
    const [speed, setSpeed] = useState(1);
    const current = currentPlayback(state, trace);
    if (current !== state)
        setState(autoPlay ? autoPlayback(current) : current);
    useEffect(() => { if (!current.playing || reducedMotion)
        return; const timer = setInterval(() => setState(value => advancePlayback(currentPlayback(value, trace))), 800 / speed); return () => clearInterval(timer); }, [current.playing, speed, trace, reducedMotion]);
    const count = reducedMotion ? trace.length : Math.min(current.visible, trace.length);
    const playing = current.playing;
    const complete = trace.length > 0 && count >= trace.length;
    // Latest callback in a ref so an inline arrow from the parent does not re-fire it on every render.
    const onCompleteRef = useRef(onComplete);
    useEffect(() => { onCompleteRef.current = onComplete; });
    useEffect(() => { if (complete)
        onCompleteRef.current?.(); }, [complete, trace]);
    const Heading = headingLevel;
    return <div className="min-w-0 space-y-4" data-decision-journey>{renderStage?.(playbackFrame(trace, count))}<section className="rounded-xl border border-border p-5"><div className="mb-5 flex flex-wrap items-center gap-3"><Heading className="mr-auto font-mono text-xs uppercase tracking-wider">{locale === 'en' ? 'Computed trace · playback' : 'Traza calculada · reproducción'}</Heading>{executionMs !== undefined && <span className="text-xs text-foreground/60">{locale === 'en' ? 'Execution' : 'Ejecución'}: {executionMs.toFixed(2)} ms</span>}<button type="button" disabled={reducedMotion || trace.length === 0} onClick={() => setState({ ...current, visible: count >= trace.length ? 1 : current.visible, playing: !playing })} className="rounded border border-border px-3 py-1 text-sm disabled:opacity-40">{playing && !reducedMotion ? (locale === 'en' ? 'Pause' : 'Pausa') : (locale === 'en' ? 'Play' : 'Reproducir')}</button><button type="button" disabled={reducedMotion || count <= 1} onClick={() => setState({ ...current, playing: false, visible: count - 1 })} className="rounded border border-border px-3 py-1 text-sm disabled:opacity-40">{locale === 'en' ? 'Previous step' : 'Paso anterior'}</button><button type="button" disabled={reducedMotion || count >= trace.length} onClick={() => setState({ ...current, playing: false, visible: count + 1 })} className="rounded border border-border px-3 py-1 text-sm disabled:opacity-40">{locale === 'en' ? 'Next step' : 'Siguiente paso'}</button><button type="button" onClick={() => setState({ ...current, playing: false, visible: trace.length })} className="rounded border border-border px-3 py-1 text-sm">{locale === 'en' ? 'Show all' : 'Ver todo'}</button><label className="text-xs">{locale === 'en' ? 'Speed' : 'Velocidad'} <select value={speed} onChange={e => setSpeed(Number(e.target.value))} className="bg-background"><option value={1}>1×</option><option value={2}>2×</option><option value={4}>4×</option></select></label></div>{collapsible ? <details data-trace-details><summary className="cursor-pointer text-sm focus-visible:outline-2 focus-visible:outline-accent">{locale === 'en' ? 'Inspect computed steps' : 'Inspeccionar pasos calculados'}</summary><div className="mt-4"><ol className="space-y-3" aria-live="polite">{trace.slice(0, count).map(event => <li key={event.id} className="flex gap-4 border-l-2 border-info/40 pl-4"><span className="font-mono text-xs text-foreground/40">{String(event.step).padStart(2, '0')}</span><div><p className="text-sm">{translate(event.messageKey)}</p>{event.evidenceIds?.length ? <p className="mt-1 font-mono text-xs text-foreground/50">{event.evidenceIds.join(' · ')}</p> : null}</div></li>)}</ol><p className="mt-4 text-xs text-foreground/50">{locale === 'en' ? 'Playback reveals already computed steps; it is not model latency.' : 'La reproducción muestra pasos ya calculados; no representa la latencia de un modelo.'}</p></div></details> : <><ol className="space-y-3" aria-live="polite">{trace.slice(0, count).map(event => <li key={event.id} className="flex gap-4 border-l-2 border-info/40 pl-4"><span className="font-mono text-xs text-foreground/40">{String(event.step).padStart(2, '0')}</span><div><p className="text-sm">{translate(event.messageKey)}</p>{event.evidenceIds?.length ? <p className="mt-1 font-mono text-xs text-foreground/50">{event.evidenceIds.join(' · ')}</p> : null}</div></li>)}</ol><p className="mt-4 text-xs text-foreground/50">{locale === 'en' ? 'Playback reveals already computed steps; it is not model latency.' : 'La reproducción muestra pasos ya calculados; no representa la latencia de un modelo.'}</p></>}</section></div>;
}
