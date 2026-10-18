# Solfa Editor

A browser-based SATB tonic sol-fa score editor built with React, TypeScript, Vite, Tailwind, and a Tiptap-backed editing
canvas. The project is organized around a domain-first music model so the score remains independent from editor-specific
and presentation-specific concerns.

## What this prototype includes

- SATB score composition with soprano, alto, tenor, and bass measures
- Keyboard-first sol-fa entry for the diatonic (`d r m f s l t`) and chromatic
  (`de re ma fe ba se ta`) syllables. A chromatic syllable is typed as its two
  letters, so `d` then `e` writes `de` rather than two notes.
- An on-screen keyboard for touch devices that mirrors the physical input keys.
  It is docked on small screens and hidden from the `lg` breakpoint up, where the
  hardware keyboard can already type every syllable.
- Rhythmic subdivision with dots and commas, plus `-` for continuations
- Inline editing of the title, composer, key, time signature, and tempo straight from the score masthead
- Automatic score growth: reaching the last slot of the last measure appends a new one
- Score layout and printable PDF-style output
- Structured domain model that mirrors the UML's concepts for notes, pitch, measure, score, and durations

## Architecture and design decisions

### Domain-first model

The source of truth is the `src/domain/` module rather than the editor JSON or UI state. Each domain concept lives in
its own file so the module graph is easy to navigate and individual entities can be imported without pulling in the full
aggregation surface. This keeps musical logic independent from browser APIs, markup, and Tiptap structures.

The domain model follows the UML's main concepts:

- `letter.ts` — `Letter` enum (A–G)
- `accidental.ts` — `Accidental` enum
- `mode.ts` — `Mode` enum (MAJOR / MINOR)
- `note-value.ts` — `NoteValue` enum and `NOTE_VALUE_UNITS` look-up table
- `fraction.ts` — `Fraction` type and arithmetic helpers
- `pitch.ts` — `Pitch` class (letter + accidental + octave → MIDI)
- `duration.ts` — `Duration` class (note value + dots → quarter-units)
- `key-signature.ts`, `key.ts` — `KeySignature`, `Key`
- `time-signature.ts` — `TimeSignature` with capacity calculation
- `tempo.ts` — `Tempo`
- `musical-event.ts` — abstract `MusicalEvent` base
- `note.ts` — `Note` (concrete event)
- `tuplet.ts` — `Tuplet`, `Triplet`, `Quintuplet`, `Sextuplet`
- `measure.ts` — `Measure`
- `score.ts` — `Score`
- `parts.ts` — `PartId` type and `PARTS` constant
- `solfa.ts` — diatonic and chromatic syllable vocabulary and their pitches
- `music.ts` — aggregate re-exports and higher-level helpers (`validateScore`, `createEmptyScore`, label utilities)

We intentionally keep the domain model serializable and minimal. UI and editor adapters convert between the domain and
the editor schema rather than letting Tiptap become the authoritative model.

### Adapter boundary

The editor has a separate schema in `src/features/score-editor/adapters/editor-document-schema.ts` and a conversion
boundary at:

- `domain-to-editor.ts`
- `editor-to-domain.ts`

This ensures the music domain does not depend on Tiptap or React.

### Presentation boundary

The rendering layer (`components/score-canvas.tsx`, `layout/calculate-score-layout.ts`, `print-score.tsx`) is
responsible for layout decisions and the on-screen visual structure. Domain calculations remain in the domain layer and
are reused by editor validation and export code.

### Notable implementation decisions

- `DEFAULT_TIME_SIGNATURE` is set to a usable 4/4 default for a working prototype.
- Chromatic syllables follow a vowel convention: `e` raises a degree and `a` lowers one, so `re`/`ma`
  (D♯/E♭) and `fe`/`ba` (F♯/G♭) are enharmonic spellings of the same pitch.
- The sol-fa input model follows Curwen rhythm notation: a dot halves a beat
  (`d.m`) and a comma quarters it (`d,r.m,f`). A note advances the caret only
  once the beat it is on is full, so `.` and `,` keep the following notes in the
  same beat while any other syllable moves on to the next one.
- A measure is a list of beats, and each beat carries the notes written in it
  plus its division (1, 2, or 4). The marks between the notes are derived from
  that division, so the notation always reads the way the method writes it.
- A continuation belongs to the note right before it, so the two rules follow
  from that: clearing a note or a beat is refused while the next position still
  continues it, and writing a syllable over a beat that holds only a continuation
  replaces that continuation instead of moving on.
- Cursor advancement is centralised in `advanceCursor`; when input reaches the final slot of the
  final measure it appends a fresh measure for every part rather than stopping.
- Score details are edited inline: the masthead renders plain text and swaps in an input or a
  shadcn `Select` only when activated, so there is no separate metadata form.
- Playback flattens the score into a single time-ordered note list measured in
  quarter notes, then converts once into seconds, so a note's length never
  depends on how its duration is spelled. Continuations prolong the note before
  them instead of sounding it again.
- PDF output is implemented as a browser print flow with a print-specific stylesheet; this is a sensible prototype
  approach without introducing a large PDF engine.

## Prerequisites

- **Node.js** ≥ 18
- **pnpm** ≥ 9

> This project uses pnpm exclusively. Dependencies are pinned through `pnpm-lock.yaml`, so install with `pnpm install`
> (or `pnpm install --frozen-lockfile` in CI) instead of npm.

## Local development

```bash
# Install dependencies
pnpm install

# Start the development server (http://localhost:5173)
pnpm dev

# Type-check without emitting
pnpm typecheck

# Lint
pnpm lint

# Format with Prettier
pnpm format

# Run the unit tests (Vitest)
pnpm test

# Production build
pnpm build
```

## Project structure

```
src/
├── app/                        # Root React app shell
├── components/                 # Shared UI components
├── domain/                     # Pure music domain model (no React/Tiptap deps)
│   ├── accidental.ts
│   ├── beat-division.ts        # Dot/comma beat subdivisions and their marks
│   ├── duration.ts
│   ├── fraction.ts
│   ├── key-signature.ts
│   ├── key.ts
│   ├── letter.ts
│   ├── measure.ts
│   ├── mode.ts
│   ├── music.ts                # Aggregate re-exports + utility helpers
│   ├── musical-event.ts
│   ├── note-value.ts
│   ├── note.ts
│   ├── parts.ts
│   ├── pitch.ts
│   ├── score.ts
│   ├── solfa.ts
│   ├── tempo.ts
│   ├── time-signature.ts
│   ├── tuplet.ts
│   └── index.ts                # Public domain barrel
├── features/
│   ├── pdf-export/             # Print / PDF export
│   ├── playback/               # Tone.js audio playback
│   └── score-editor/           # Tiptap editor, adapters, and UI
└── styles/                     # Global CSS and Tailwind entry
```

## Notes for continuation

This project is a strong prototype foundation rather than a final music engraving system. It keeps the core architecture
modular enough for future work on:

- more advanced notation rules
- pitch spelling and accidental handling
- richer rhythmic validation
- PDF export polishing
- collaborative editing or multi-voice composition tools

The work already in the repo establishes a clean separation between the music domain, editing state, renderer, and
printing layer. The remaining work is mostly refinement and validation rather than a complete rewrite.
