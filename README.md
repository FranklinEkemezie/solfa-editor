# Solfa Editor

A browser-based SATB tonic sol-fa score editor built with React, TypeScript, Vite, Tailwind, and a Tiptap-backed editing
canvas. The project is organized around a domain-first music model so the score remains independent from editor-specific
and presentation-specific concerns.

## What this prototype includes

- SATB score composition with soprano, alto, tenor, and bass measures
- Keyboard-first sol-fa entry using `d r m f s l t`
- Rhythmic subdivision and continuation handling
- Metadata editing for title, author, key, time signature, and tempo
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
- `solfa.ts` — `SolfaSyllable`, `SOLFA_SYLLABLES`, `SOLFA_TO_PITCH`
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
- The sol-fa input model treats `.` as beat subdivision and `-` as continuation, which keeps the keyboard interaction
  fast and aligned with a simple composition workflow.
- Measure-to-slot conversion uses a rhythmic slot array rather than a full note tree so the editor remains responsive
  while still preserving the underlying musical model.
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
