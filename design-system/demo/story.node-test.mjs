import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
function load(file) {
  const source = readFileSync(new URL(file, import.meta.url), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const exports = {};
  // Sibling TS modules ('./playback') are transpiled the same way; everything else is a real require.
  const local = spec => ['.ts', '.tsx'].map(ext => spec + ext).find(p => existsSync(new URL(p, import.meta.url)));
  new Function('exports', 'require', js)(exports, spec => spec.startsWith('./') && local(spec) ? load(local(spec)) : require(spec));
  return exports;
}

test('tape marks primary as served, other providers as rerouted, null as lost, unrevealed as pending', () => {
  const { tapeCells, tapeCounts } = load('./outcome-tape.ts');
  const cells = tapeCells(['primary', 'backup', null, 'primary'], 'primary', 3);
  assert.deepEqual(cells, ['served', 'rerouted', 'lost', 'pending']);
  assert.deepEqual(tapeCounts(cells), { served: 1, rerouted: 1, lost: 1, pending: 1 });
});

test('tape reveals up to the tick of the current breaker event', () => {
  const { revealedTicks } = load('./outcome-tape.ts');
  const frame = { total: 3, complete: false, event: { evidenceIds: ['primary', 'tick:9'] } };
  assert.equal(revealedTicks(frame, 30), 10);
});

test('tape is fully revealed when playback is complete, when the trace is empty, or under reduced motion', () => {
  const { revealedTicks } = load('./outcome-tape.ts');
  assert.equal(revealedTicks({ total: 3, complete: true, event: { evidenceIds: ['tick:9'] } }, 30), 30);
  assert.equal(revealedTicks({ total: 0, complete: false }, 30), 30);
  assert.equal(revealedTicks({ total: 3, complete: false, event: { evidenceIds: ['tick:2'] } }, 30, true), 30);
});

test('tape reveals nothing when the event carries no tick', () => {
  const { revealedTicks } = load('./outcome-tape.ts');
  assert.equal(revealedTicks({ total: 2, complete: false, event: { evidenceIds: ['primary'] } }, 30), 0);
});

const { renderToStaticMarkup } = require('react-dom/server');
const { createElement: h } = require('react');

test('why-I-built-it renders nothing until Manuel provides the text', () => {
  const { WhyIBuiltIt } = load('./project-story.tsx');
  assert.equal(renderToStaticMarkup(h(WhyIBuiltIt, { title: 'Why', text: '   ' })), '');
  assert.match(renderToStaticMarkup(h(WhyIBuiltIt, { title: 'Why', text: 'Real note' })), /Real note/);
});

test('story sections are numbered with two digits and highlight one word', () => {
  const { StorySection } = load('./project-story.tsx');
  const html = renderToStaticMarkup(h(StorySection, { index: 2, heading: { before: 'Try', accent: 'it' } }));
  assert.match(html, />02</);
  assert.match(html, /class="text-accent">it</);
});

test('outcome tape exposes one cell per request with its status and a legend', () => {
  const { OutcomeTape } = load('./project-story.tsx');
  const html = renderToStaticMarkup(h(OutcomeTape, { cells: ['served', 'rerouted', 'lost', 'pending'], labels: { served: 'served', rerouted: 'rerouted', lost: 'lost' }, ariaLabel: 'Requests' }));
  assert.equal((html.match(/data-tape-cell=/g) ?? []).length, 4);
  assert.match(html, /data-tape-cell="lost"/);
  // Lost cells carry a non-color mark so red/green colorblind visitors can tell them apart.
  assert.match(html, /data-tape-cell="lost"[^>]*><span aria-hidden="true">×<\/span>/);
  assert.doesNotMatch(html, /data-tape-cell="served"[^>]*><span aria-hidden="true">×/);
  assert.match(html, /aria-label="Requests"/);
  assert.match(html, />rerouted</);
});

test('engineer notes are a native collapsed disclosure', () => {
  const { EngineerNotes } = load('./project-story.tsx');
  const html = renderToStaticMarkup(h(EngineerNotes, { summary: 'For engineers', children: 'x' }));
  assert.match(html, /^<details[^>]*><summary[^>]*>For engineers<\/summary>/);
  assert.doesNotMatch(html, /<details[^>]*open/);
});

test('analogy dictionary renders every term with its meaning', () => {
  const { AnalogyBlock } = load('./project-story.tsx');
  const html = renderToStaticMarkup(h(AnalogyBlock, { paragraphs: ['p'], dictionaryLabel: 'In the diagram', dictionary: [{ term: 'the highway', means: 'the main provider' }, { term: 'the crash', means: 'the outage' }] }));
  assert.equal((html.match(/<dt/g) ?? []).length, 2);
  assert.match(html, /the main provider/);
});

test('flow diagram draws every node in the SVG and as a stacked mobile card, with its analogy', () => {
  const { FlowDiagram } = load('./flow-diagram.tsx');
  const nodes = [
    { id: 'gateway', x: 0, y: 0, name: 'Gateway', sub: 'routes', analogy: 'the GPS', tone: 'active' },
    { id: 'primary', x: 200, y: 0, name: 'Provider A', sub: 'main', analogy: 'the highway', tone: 'danger' },
  ];
  const html = renderToStaticMarkup(h(FlowDiagram, { nodes, edges: [{ from: 'gateway', to: 'primary', tone: 'danger' }], width: 400, height: 100, ariaLabel: 'Route' }));
  assert.equal((html.match(/data-flow-node=/g) ?? []).length, 2);
  assert.equal((html.match(/data-flow-card=/g) ?? []).length, 2);
  assert.match(html, /<svg[^>]*class="[^"]*hidden[^"]*sm:block/);
  assert.match(html, /<ol[^>]*class="[^"]*sm:hidden/);
  assert.equal((html.match(/= the GPS/g) ?? []).length, 2);
  assert.equal((html.match(/data-flow-edge="gateway-primary"/g) ?? []).length, 1);
});

test('flow diagram marks danger and success with a symbol, not color alone', () => {
  const { FlowDiagram } = load('./flow-diagram.tsx');
  const nodes = [
    { id: 'a', x: 0, y: 0, name: 'A', sub: '', analogy: 'x', tone: 'danger' },
    { id: 'b', x: 200, y: 0, name: 'B', sub: '', analogy: 'y', tone: 'success' },
    { id: 'c', x: 400, y: 0, name: 'C', sub: '', analogy: 'z', tone: 'idle' },
  ];
  const html = renderToStaticMarkup(h(FlowDiagram, { nodes, edges: [], width: 600, height: 100, ariaLabel: 'r' }));
  assert.equal((html.match(/✕/g) ?? []).length, 2);
  assert.equal((html.match(/✓/g) ?? []).length, 2);
  assert.match(html, /data-flow-card="c"[^>]*data-tone="idle"/);
});

test('trace player heading can drop to h3 inside a story section', () => {
  const { TracePlayer } = load('./trace-player.tsx');
  const trace = [{ id: 'a', step: 1, messageKey: 'k' }];
  const base = { trace, translate: k => k, locale: 'en' };
  assert.match(renderToStaticMarkup(h(TracePlayer, base)), /<h2[^>]*>Computed trace/);
  assert.match(renderToStaticMarkup(h(TracePlayer, { ...base, headingLevel: 'h3' })), /<h3[^>]*>Computed trace/);
});

test('copy lint walks nested copy, calls sentence functions, and reports each forbidden pattern', () => {
  const { lintStory, storyStrings } = load('./copy-lint.ts');
  const story = { a: 'Plain sentence.', b: ['ok', { c: 'We leverage synergy' }], f: (on, off) => (on < off ? 'fewer — oops' : `served ${on}`) };
  const strings = storyStrings(story);
  assert.ok(strings.includes('served 27'));
  assert.ok(strings.includes('fewer — oops'), 'reverse case is exercised');
  const violations = lintStory(story);
  assert.equal(violations.length, 2);
  assert.ok(violations.some(v => v.includes('leverag')));
  assert.ok(violations.some(v => v.includes('—')));
  assert.deepEqual(lintStory({ a: 'Two short lines. Then a longer one about customers.' }), []);
});

test('copy lint also exercises the falsy branch of boolean controls', () => {
  const { lintStory } = load('./copy-lint.ts');
  assert.equal(lintStory({ q: (end, backup) => (backup ? `with backup to ${end}` : `without backup — to ${end}`) }).length > 0, true);
});

test('flow diagram cards announce each status and mark "off" without color', () => {
  const { FlowDiagram } = load('./flow-diagram.tsx');
  const nodes = ['danger', 'success', 'off', 'active', 'idle'].map((tone, i) => ({ id: tone, x: i * 200, y: 0, name: tone, sub: '', analogy: 'a', tone }));
  const html = renderToStaticMarkup(h(FlowDiagram, { nodes, edges: [], width: 1000, height: 100, ariaLabel: 'r', statusLabels: { danger: 'down', success: 'on', off: 'off', active: 'routing' } }));
  for (const label of ['down', 'on', 'off', 'routing']) assert.match(html, new RegExp(`<span class="sr-only">[^<]*${label}</span>`), label);
  assert.match(html, /data-flow-card="off"[\s\S]*?–/);
});

test('outcome tape takes its column count from the caller', () => {
  const { OutcomeTape } = load('./project-story.tsx');
  const labels = { served: 's', rerouted: 'r', lost: 'l' };
  const html = renderToStaticMarkup(h(OutcomeTape, { cells: Array(24).fill('served'), labels, ariaLabel: 'x', columns: 24 }));
  assert.match(html, /--tape-cols:24/);
  assert.match(html, /--tape-cols-sm:12/);
  assert.match(renderToStaticMarkup(h(OutcomeTape, { cells: ['served'], labels, ariaLabel: 'x' })), /--tape-cols:30/);
});
