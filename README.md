# Solfa Editor

A browser-based SATB tonic sol-fa score editor built with React, TypeScript, Vite, Tailwind, and a Tiptap-backed editing
surface. The project is organized around a domain-first music model so the score remains independent from editor-specific
and presentation-specific concerns.

## What this prototype includes

- SATB score composition with soprano, alto, tenor, and bass measures
- Keyboard-first sol-fa entry for the diatonic (`d r m f s l t`) and chromatic
  (`de re ma fe ba se ta`) syllables. A chromatic syllable is typed as its two
  letters, so `d` then `e` writes `de` rather than two notes.
- An on-screen keyboard for touch devices that mirrors the physical input keys.
  It is docked on small screens and hidden from the `lg` breakpoint up, where the
  hardware keyboard can already type every syllable. It slides away while a field
  in the masthead is being typed into
- Pinch to zoom the sheet on a touch screen. The gesture scales the page, the way
  the zoom controls do, instead of magnifying the whole app
- Rhythmic subdivision with dots and commas, plus `-` for continuations
- Bars that read in two halves are marked at the half bar (`/`), and the score closes with a double
  barline (`||`), the way a printed score does
- Inline editing of the title, subtitle, composer, key, time signature, and tempo straight from the score
  masthead
- Automatic score growth: reaching the last slot of the last measure appends a new one
- Real A4 sheets, read the way a document is read. A score too tall for one page breaks across as
  many sheets as it needs; the sheets sit still in the window and scroll past, with a gutter and a
  shadow between them
- A tool rail down the left for undo and redo, adding and removing measures, zooming, and printing.
  Every control is an icon with a tooltip, and the rail can be put away to give the score the whole
  window
- Playback that sounds the score in its own key and at its own tempo
- Score layout and printable PDF-style output that share the same page breaks
- Structured domain model that mirrors the UML's concepts for notes, pitch, measure, score, and durations

## Opening with a sample score

The editor opens on the score named in `src/features/score-editor/presets/index.ts`:

```ts
export const ACTIVE_PRESET: ScorePreset | null = hallelujahChorus;
```

Presets are written in the app's own tonic sol-fa text notation and parsed by
`presets/score-preset.ts`, so a score can be typed in, swapped, or dropped without touching a
component. Comment that one line out to start from the empty default — an untitled score with two
silent measures — or name another preset (`gloriaJudeNnam` ships alongside the default for exactly
that) to open on that one instead. `presets/score-preset.ts` documents the notation.

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

The rendering layer decides where the music falls and how it is looked at, and nothing else does.
`layout/page-geometry.ts` holds the sheet's measurements — A4 at 96 pixels to the inch, its margin, its
rows — `layout/score-layout.ts` turns a document into pages, systems and measures, and
`components/score-canvas/` draws them. `components/score-document.tsx` stacks those pages in reading
order, `layout/document-zoom.ts` works out the scale the document is read at, and
`hooks/use-document-zoom.ts` holds it for the app. Domain calculations remain in the domain layer and
are reused by editor validation and export code.

Because there is one layout and two consumers, the printed sheet is the page that was on screen: the
printer prints the editor's pages, system for system and measure for measure.

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
- A bar of an even number of beats greater than two is read in two halves, so the
  mark between the beats at its middle is a slash rather than a colon: 4/4 reads
  `d : m / s : m`, and 6/8 reads three beats, a slash, three more. A bar of two or
  three beats has no middle to mark. The last measure of the score closes with a
  double barline. The rule lives in `domain/bar-division.ts`, so the sheet and the
  printed page cannot disagree about where the halves fall.
- A continuation belongs to the note right before it, so the two rules follow
  from that: clearing a note or a beat is refused while the next position still
  continues it, and writing a syllable over a beat that holds only a continuation
  replaces that continuation instead of moving on.
- Cursor advancement is centralised in `advanceCursor`; when input reaches the final slot of the
  final measure it appends a fresh measure for every part rather than stopping.
- Score details are edited inline: the masthead renders plain text and swaps in an input or a
  shadcn `Select` only when activated, so there is no separate metadata form. Activating a field
  takes focus without scrolling and the masthead's clicks stop at the heading, so editing a title
  never moves the page under the pointer.
- Playback flattens the score into a single time-ordered note list measured in
  quarter notes, then converts once into seconds, so a note's length never
  depends on how its duration is spelled. Continuations prolong the note before
  them instead of sounding it again.
- Playback also follows the score's key as moveable doh. Every syllable is written as though doh were
  C, so the sounding pitch is the written pitch shifted by the key's tonic — the shift is applied to
  the notes handed to Tone.js, never written back into the notation, which keeps it off the render
  path.
- The score is laid out as real sheets: one uniform measure width for the whole score (the widest
  beat anywhere in it), never justified to fill the page, so bars stay as narrow as the music needs
  and the beats of one system line up with every other. Measures per system and systems per page come
  out of `layout/score-layout.ts`.
- The sheet is a real A4 page, and the sheets are read the way a document is read: they sit still in
  the middle of the window and the document scrolls past them. Nothing pans the page and the wheel
  never zooms; a page made wider than the window by the zoom is panned with the scrollbar the overflow
  already provides. The scrollbar's gutter is reserved, so fitting the page to the window is measured
  against the width the page will actually have.
- Zoom follows a fixed ladder of round levels (25%, 33%, 50%, … 300%) rather than multiplying, so a
  press or two cannot leave the reader at 156%. The editor opens at the page width on a narrow window
  and at the paper's true size on a wide one; resizing the window afterwards leaves the zoom alone.
- A pinch on a touch screen belongs to the reader, not to the browser: `touch-action` on the document
  keeps the window from magnifying, and `usePinchZoom` scales the sheet instead. The zoom is continuous
  between the ladder's limits and turns about the point between the fingers, so the bar being read
  stays under them; the maths is in `layout/pinch-zoom.ts` and the touches in the hook. One finger
  still scrolls with the browser's own momentum.
- The drawn keyboard is a drawer that shuts while a field in the document holds focus: the phone's own
  keyboard has the bottom of the screen, and the drawn keys would only sit beneath it. The rule is
  written with `:has()` in the stylesheet rather than tracked in state, so it cannot fall out of step
  with the field — a field removed by its own commit closes the drawer by ceasing to exist.
- PDF output is implemented as a browser print flow with a print-specific stylesheet; this is a
  sensible prototype approach without introducing a large PDF engine. Paged.js is not used: pagination
  is already decided by the layout module, and all the print stylesheet has to add is that each of the
  editor's pages starts a fresh sheet and that a system is never split across two.
- The printed page box is the editor's page box — A4 with a 70px margin, which is A4 with a margin of
  just under 19mm — so the printable width is the width the layout was measured against. The page is
  then drawn at 95%: the breaks stay where the editor put them, and the music keeps a few millimetres
  of air from the paper's edge instead of running to the margin. The title block is given air above
  and below it, so a printed heading does not read as a caption on the first system.
- The printed sheet carries no colour: ink, hairlines and barlines only. The subdivision marks (`.`,
  `,`), the colon that closes a beat and the slash at the half bar are notation rather than
  decoration, so they are set at the note's own size, colour and mono face. The score's key, time,
  tempo and tempo word are set upright in the same ink as the notes: they are part of the heading,
  not a caption under it.
- The app is a fixed frame around a scrolling document: the header carries the app name and playback,
  the rail down the left carries the commands, the on-screen keyboard is docked at the bottom on
  small screens, and only the document between them scrolls. `app/score-tools.tsx` decides which
  commands the rail offers.

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
│   ├── bar-division.ts          # Half-bar marks and the marks between beats
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
│       ├── components/         # Sheets, document, keyboard, masthead
│       ├── hooks/              # Editor, commit, playback-view, zoom and pinch state
│       ├── layout/             # Page geometry, pagination, zoom and pinch geometry
│       └── presets/            # Sample scores and their notation parser
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
