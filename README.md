# Solfa Editor

A browser-based SATB tonic sol-fa score editor built with React, TypeScript, Vite, Tailwind, and a Tiptap-backed editing canvas. The project is organized around a domain-first music model so the score remains independent from editor-specific and presentation-specific concerns.

## What this prototype includes

- SATB score composition with soprano, alto, tenor, and bass measures
- Keyboard-first sol-fa entry using `d r m f s l t`
- rhythmic subdivision and continuation handling
- metadata editing for title, author, key, time signature, and tempo
- score layout and printable PDF-style output
- structured domain model that mirrors the UML's concepts for notes, pitch, measure, score, and durations

## Architecture and design decisions

### Domain-first model

The source of truth is the `src/domain/music.ts` model rather than the editor JSON or UI state. This keeps musical logic independent from browser APIs, markup, and Tiptap structures.

The domain model follows the UML's main concepts:

- `Letter`, `Accidental`, `Mode`, `NoteValue`
- `Pitch`, `Duration`, `KeySignature`, `TimeSignature`, `Key`, `Tempo`
- `MusicalEvent`, `Note`, `Tuplet`, `Triplet`, `Quintuplet`, `Sextuplet`
- `Measure`, `Score`

We intentionally keep the domain model serializable and minimal. UI and editor adapters convert between the domain and the editor schema rather than letting Tiptap become the authoritative model.

### Adapter boundary

The editor has a separate schema in `src/features/score-editor/adapters/editor-document-schema.ts` and a conversion boundary at:

- `domain-to-editor.ts`
- `editor-to-domain.ts`

This ensures the music domain does not depend on Tiptap or React.

### Presentation boundary

The rendering layer (`components/score-canvas.tsx`, `layout/calculate-score-layout.ts`, `print-score.tsx`) is responsible for layout decisions and the on-screen visual structure. Domain calculations remain in the domain layer and are reused by editor validation and export code.

### Notable implementation decisions

- `DEFAULT_TIME_SIGNATURE` is set to a usable 3/4 default for a working prototype.
- The sol-fa input model treats `.` as beat subdivision and `-` as continuation, which keeps the keyboard interaction fast and aligned with a simple composition workflow.
- Measure-to-slot conversion uses a rhythmic slot array rather than a full note tree so the editor remains responsive while still preserving the underlying musical model.
- PDF output is implemented as a browser print flow with a print-specific stylesheet; this is a sensible prototype approach without introducing a large PDF engine.

## Local development

1. Install dependencies:
   npm install
2. Start the development server:
   npm run dev
3. Build the project:
   npm run build
4. Run the unit tests:
   npm test

## Notes for continuation

This project is a strong prototype foundation rather than a final music engraving system. It keeps the core architecture modular enough for future work on:

- more advanced notation rules
- pitch spelling and accidental handling
- richer rhythmic validation
- PDF export polishing
- collaborative editing or multi-voice composition tools

The work already in the repo establishes a clean separation between the music domain, editing state, renderer, and printing layer. The remaining work is mostly refinement and validation rather than a complete rewrite.
