# Solfa Editor

A browser-based SATB tonic sol-fa score editor built with React, TypeScript, Vite, and Tailwind. The project is
organized around a domain-first music model and a shared notation language, so the score remains independent
from editor-specific and presentation-specific concerns.

## What this prototype includes

- SATB score composition with soprano, alto, tenor, and bass voices
- One notation language for the whole score: every voice is a string such as `:d-.sl:sd---`, and the page,
  playback and print are all derived from it
- Keyboard-first sol-fa entry for the diatonic (`d r m f s l t`) and chromatic
  (`de re ma fe ba se ta`) syllables. A chromatic syllable is typed as its two
  letters, so `d` then `e` writes `de` rather than two notes. `#` and `b` set an explicit
  accidental after a note.
- An on-screen keyboard for touch devices that mirrors the physical input keys. Every syllable is one press.
  The duration keys sit on their own line above the notes, with the accidentals at the far end of it;
  the bottom line carries the octave selectors, the continuation key, a wide space bar (a rest) and
  delete. The octave selector raises or lowers the notes being entered by one or two octaves, moves the
  note already at the caret, and writes the mark with the next syllable, so the page shows a raised
  octave as a superscript and a lowered one as a subscript. The three duration keys (`.` `:` `,`)
  choose the length of the notes that follow and the one in force is lit. The dock is hidden from the
  `lg` breakpoint up, where the hardware keyboard can already type everything, and it slides away while
  a field in the masthead is being typed into
- Pinch to zoom the sheet on a touch screen. The gesture scales the page, the way
  the zoom controls do, instead of magnifying the whole app
- Absolute rhythmic values — `:` a quarter, `.` an eighth, `,` a sixteenth, `-` to hold the note before it,
  and a space for a rest — with bars inferred from the time signature
- Bars that read in two halves are marked at the half bar (`/`), and the score closes with a double
  barline (`||`), the way a printed score does
- Inline editing of the title, subtitle, composer, key, time signature, and tempo straight from the score
  masthead
- Automatic score growth: music that runs past the last measure adds measures; the rail can add or remove
  blank ones
- Real A4 sheets, read the way a document is read. A score too tall for one page breaks across as
  many sheets as it needs; the sheets sit still in the window and scroll past, with a gutter and a
  shadow between them
- A document library in the browser. The header names the open score, shows its save state, and keeps
  a Save button next to playback. Each score is written separately to IndexedDB as it changes; the
  File section of the rail creates a new score from a small form (title, subtitle, composer, key,
  time and tempo) and opens any saved score from a newest-first picker. Reopening the editor restores
  the last active score, its caret and its zoom
- A quiet note preview while writing: entering a syllable, completing a chromatic syllable,
  adding an accidental or changing an octave sounds the note just written, in its voice's register
  and the score's key. The preview is one short monophonic tone, so fast typing replaces the previous
  note instead of stacking echoes
- Feedback that stays out of the way. Successful keystrokes are silent; only invalid input and
  errors raise a message, and messages sit at the top right so they never cover the phone keyboard
- A tool rail down the left for files, undo and redo, adding and removing measures, zooming, and
  printing. Every control is an icon with a tooltip, and the rail can be put away to give the score
  the whole window
- Playback that sounds the score in its own key and at its own tempo, with held notes sounding as one note
- Score layout and printable PDF-style output that share the same page breaks
- Structured domain model that mirrors the UML's concepts for notes, pitch, measure, score, and durations

## The notation language

A voice is a line of text and nothing else. The whole language is in
[`docs/NOTATION_ENGINE_SPECS.md`](docs/NOTATION_ENGINE_SPECS.md); the short form is:

| Symbol                 | Meaning                                                     |
| ---------------------- | ----------------------------------------------------------- |
| `d r m f s l t`        | the diatonic degrees                                        |
| `de re ma fe ba se ta` | the chromatic syllables                                     |
| `:`                    | a quarter-note duration                                     |
| `.`                    | an eighth-note duration                                     |
| `,`                    | a sixteenth-note duration                                   |
| `-`                    | hold the note before it for the current duration            |
| a space                | a rest for the current duration                             |
| `#` / `b`              | an explicit sharp or flat on the note before it             |
| `'` and digits         | octave marks, one or more octaves from the voice's register |

Octave marks are drawn as a superscript for a raised note (`d'` is d¹) and a subscript for a lowered one
(`d1` is d₁).

A duration stays in force until it is changed, so `:dmsl` is four quarter notes and `.dmsl` is four
eighths. A note's length is the sum of its own duration and every `-` after it. Modifiers (`#`, `b`,
octave marks) attach to the note immediately before them; there are no bars in the source, because the
bars are where the time signature says they fall.

A rest writes an explicit silence; it is not a separator: `:d s` is _d_, a quarter rest, then _s_.

Invalid text is never stored. The editor parses every candidate source before keeping it, so the score in
the document can always be read by the engine; a rejected edit leaves the previous source and explains
what the language would accept. Typing is token-atomic, so a two-letter syllable is undone as one step.

## Opening score

The editor opens the score that was last active in this browser. On a fresh browser it opens on a
blank, untitled score with four silent measures. The rail's File section creates a new document or
opens one from the library:

- **New document** saves the current sheet, then starts a blank one with the title, subtitle,
  composer, key, time signature and tempo entered in the dialog. The new sheet is written to the
  library immediately, so it is there to reopen even before the first note.
- **Open document** saves the current sheet, then shows every saved score newest first. A short
  summary under the picker shows the selected score's composer, key, time signature, length and
  save time before it is opened.

Both actions save first on purpose: autosave may still be holding the last keystrokes, and switching
documents must never be the moment that work is lost. If that save fails, the switch is refused and
the current score stays open.

Scores written by the first persistence version are migrated automatically the first time this
version opens the database. The old `scores` store is copied into the document library and left in
place as a fallback; it is never deleted. A damaged old record is skipped and reported rather than
guessed at.

The Gloria sample is one press away on the tool rail (`Open the Gloria sample`); it opens as an
undoable step, so the blank score is one undo back. The sample scores are kept in
`src/features/score-editor/presets/` and can also be made the opening score by pointing the switch at
one of them:

```ts
export const ACTIVE_PRESET: ScorePreset | null = gloriaJudeNnam;
```

With `ACTIVE_PRESET` left `null`, the editor starts empty. `hallelujahChorus` and `gloriaJudeNnam` are
both available. Presets are metadata plus four notation strings, built by `presets/score-preset.ts`, so
a score can be typed in, swapped, or dropped without touching a component. Each preset is validated when
it is opened, so a mistake in a sample is reported with the voice's name rather than half-drawn on the
page.

## Architecture and design decisions

### Domain-first model

The source of truth is the `src/domain/` module rather than the page's UI state. Each domain concept lives in
its own file so the module graph is easy to navigate and individual entities can be imported without pulling in the full
aggregation surface. This keeps musical logic independent from browser APIs and markup.

The domain model follows the UML's main concepts, and there is only one model of a solfa note:

- `letter.ts` — `Letter` enum (A–G), kept for the key's name
- `accidental.ts` — `Accidental` enum
- `degree.ts` — `Degree` (I–VII), the scale-step identity a solfa syllable stands for
- `pitch.ts` — `Pitch` as a degree, an accidental and an octave
- `pitch-resolution.ts` — `soundingMidi(pitch, key)`, which turns a degree-based pitch into a sounding one
- `solfa.ts` — the diatonic and chromatic syllables and `SOLFA_TO_DEGREE`
- `voice.ts` — `VOICE_SETTINGS`, the reference octave that separates soprano, alto, tenor and bass
- `mode.ts`, `note-value.ts`, `fraction.ts` — durations in exact quarter-note fractions
- `key-signature.ts`, `key.ts`, `key-tonic.ts` — keys and their tonics
- `time-signature.ts` — `TimeSignature` with capacity calculation
- `tempo.ts` — `Tempo`
- `musical-event.ts`, `note.ts`, `rest.ts` — the event base and its two kinds
- `measure.ts`, `score.ts` — a measure of events, and a score of measures
- `score-document.ts` — `ScoreDocument`, the stored truth: metadata and one notation source per voice
- `music.ts` — aggregate re-exports

### The notation engine

One language is shared by both keyboards and by the samples. `features/notation/` holds it end to end:
`lexer.ts` turns text into tokens, `parser.ts` reads a token sequence with an explicit grammar
(`grammar.ts`), `diagnostics.ts` explains what it cannot read, and `notation-engine.ts` exposes `parseVoice`.
`semantic-analysis.ts` then folds the parse into `musical-ir.ts`: events with exact quarter-note starts and
lengths, the source range each came from, and any explicit modifiers.

`features/score-editor/model/build-score.ts` is the only place measures are inferred. It parses all four
voices, finds the longest, and lays them over the same number of measures. `model/score-view.ts` is what the
page draws: measures, beats, and the items in each beat, including the continuations that show a held note.
Nothing is stored twice: the document's sources are the only editable truth, and the page, the `Score` used
by playback, and the print all come from them.

`features/score-editor/editing/` is the editing surface. Every command is a pure function from a document
and a caret to a new document and caret — `insertSyllable`, `insertDuration`, `insertRest`,
`insertContinuation`, `applyAccidental`, `deletePrevious`, `composeKey` for a physical key and `moveCaret` —
and each one re-parses its candidate before accepting it. The on-screen keyboard calls those functions
directly; the physical keyboard reaches them through `composeKey`. That is the only difference between the
two ways of writing.

### Presentation boundary

The rendering layer decides where the music falls and how it is looked at, and nothing else does.
`layout/page-geometry.ts` holds the sheet's measurements — A4 at 96 pixels to the inch, its margin, its
rows — `layout/score-layout.ts` turns the derived view into pages, systems and measures, and
`components/score-canvas/` draws them. `components/score-document.tsx` stacks those pages in reading
order and is the focusable writing surface, `layout/document-zoom.ts` works out the scale the document is
read at, and `hooks/use-document-zoom.ts` holds it for the app.

Because there is one layout and two consumers, the printed sheet is the page that was on screen: the
printer prints the editor's pages, system for system and measure for measure.

### Saving a score

`features/persistence/` is its own feature. `score-storage.ts` is a versioned codec: it turns the
document's value objects into plain data and validates every field when reading a score back. Version
2 records carry both a creation time and the time of the last write.

`indexed-db-score-store.ts` keeps every score in a `documents` store keyed by id and indexed by save
time, plus a small `preferences` store that remembers the active document. Saving a score and
remembering it as active happen in one transaction, so the editor's default score and the library
cannot disagree. `legacy-score-migration.ts` reads version 1 records and re-encodes them into the
library; the database upgrade runs that migration inside its own transaction, and the old store is
retained untouched afterwards.

`autosave.ts` is a small debounced writer that always follows an in-flight write with the newest
snapshot instead of queueing every keystroke. `use-score-persistence.ts` hydrates the editor before
arming autosave, so the blank opening document can never overwrite saved work, and it flushes when
the page is hidden. It also owns the save-first transition when a document is created or opened. The
stored record contains all metadata, all four voice sources, the measure count, the caret, the zoom,
and the creation and save times; undo history is deliberately left out and starts fresh on reopening.

`features/document-library/` owns the New and Open dialogs, the small details model for a newly
created score, and the human wording for saved times. It depends on the persistence feature rather
than the other way round.

### Notable implementation decisions

- `DEFAULT_TIME_SIGNATURE` is set to a usable 4/4 default for a working prototype.
- Chromatic syllables follow a vowel convention: `e` raises a degree and `a` lowers one, so `re`/`ma`
  (D♯/E♭) and `fe`/`ba` (F♯/G♭) are enharmonic spellings of the same pitch. An explicit `#` or `b`
  after a syllable replaces that syllable's own accidental rather than stacking on it.
- A beat's subdivision marks are derived, not stored: one item in a beat has no mark, two are a halved
  beat (`s.l`) and four are a quartered one (`s,l.f,l`). A beat that holds a held note and a new one
  keeps them apart with a space rather than a subdivision mark, because they are two events and not a
  divided beat.
- A bar of an even number of beats greater than two is read in two halves, so the
  mark between the beats at its middle is a slash rather than a colon: 4/4 reads
  `d : m / s : m`, and 6/8 reads three beats, a slash, three more. A bar of two or
  three beats has no middle to mark. The last measure of the score closes with a
  double barline. The rule lives in `domain/bar-division.ts`, so the sheet and the
  printed page cannot disagree about where the halves fall.
- A continuation belongs to the note before it. A note that crosses a barline is shown as a tied
  segment in the next measure, but it stays one note to the ear: playback sounds its whole written
  length rather than re-attacking at the bar.
- Notes can be held past the last measure's end, which grows the score. The document carries a floor
  (`measureCount`) as well, so the rail can add a blank measure or take a blank one back; the last
  measure cannot be removed while it still holds music.
- The caret is a voice and an offset into its source, so it belongs to the text rather than to a beat.
  Clicking a beat puts the caret at the end of the event sounding there — a held note's caret sits after
  its last `-` — and typing writes at that point. History keeps the document and the caret together, so
  undo returns the writer to where they were; moving the caret alone is never an undo step.
- Score details are edited inline: the masthead renders plain text and swaps in an input or a
  shadcn `Select` only when activated, so there is no separate metadata form. Activating a field
  takes focus without scrolling and the masthead's clicks stop at the heading, so editing a title
  never moves the page under the pointer.
- Playback reads the exact quarter-note start and length the notation engine recorded, converting once
  into seconds, so a note's length never depends on how its duration is spelled. A held note is a
  single event of its full written length.
- Playback follows the score's key as moveable doh. Every syllable is written as though doh were C, so
  the sounding pitch is the written pitch shifted by the key's tonic — the shift is applied to the notes
  handed to Tone.js, never written back into the notation, which keeps it off the render path. Each
  voice also sounds in its own reference octave (soprano and alto at 4, tenor and bass at 3), which
  is what separates the four parts.
- Typing feedback is a separate, deliberately small audio path. `editing/notation-editing.ts` exposes
  the pitch ending at the caret, and `audio/note-preview.ts` sounds it through one reusable
  monophonic Web Audio voice. A new note cuts the old tone off, the envelope is short enough not to
  echo under the next key, and the pitch already includes the voice's reference octave and the
  score's key. The same path serves the physical and on-screen keyboards, so a whole syllable entered
  in one press sounds once.
- Successful edits do not raise toasts. The editing bridge reports only rejections, which also play
  the existing error tone, while playback and storage failures use the same warning style. The toast
  viewport sits below the header at the top right, out of the way of the on-screen keyboard.
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
├── domain/                     # Pure music domain model (no React dependencies)
│   ├── accidental.ts
│   ├── bar-division.ts         # Half-bar marks and the marks between beats
│   ├── beat-division.ts        # Dot/comma beat subdivisions and their marks
│   ├── degree.ts               # The scale degree a syllable stands for
│   ├── fraction.ts             # Exact quarter-note arithmetic
│   ├── key-signature.ts, key.ts, key-tonic.ts
│   ├── letter.ts, mode.ts
│   ├── measure.ts, score.ts
│   ├── music.ts                # Aggregate re-exports
│   ├── musical-event.ts, note.ts, rest.ts
│   ├── note-value.ts
│   ├── parts.ts, voice.ts      # The four voices and their registers
│   ├── pitch.ts, pitch-resolution.ts
│   ├── score-document.ts       # Metadata plus four notation sources
│   ├── solfa.ts
│   ├── tempo.ts, time-signature.ts
│   └── notational-labels.ts
├── features/
│   ├── document-library/       # New/Open dialogs and saved-time wording
│   ├── notation/               # The shared language: lexer, grammar, parser, IR
│   ├── pdf-export/             # Print / PDF export
│   ├── persistence/            # Versioned codec, IndexedDB library, migration, autosave
│   ├── playback/               # Tone.js audio playback
│   └── score-editor/
│       ├── adapters/           # Key/time option encoding, masthead labels
│       ├── components/         # Sheets, document, keyboard, masthead
│       ├── editing/            # Token-atomic commands and keyboard composition
│       ├── hooks/              # Editing bridge, zoom and pinch state
│       ├── layout/             # Page geometry, pagination, zoom and pinch geometry
│       ├── model/              # Derived page view and the score builder
│       ├── presets/            # Sample scores as notation sources
│       └── state/              # Store, history, metadata commands
└── styles/                     # Global CSS and Tailwind entry
```

## Notes for continuation

This project is a strong prototype foundation rather than a final music engraving system. It keeps the core architecture
modular enough for future work on:

- richer notation: tuplets, lyrics, dynamics and repeats (the grammar has room for them; the IR is the place to carry them)
- stem and beam engraving — the page currently draws the sol-fa letters, not staff notation
- a more forgiving accidentals model: an accidental after a held note currently has to be written before its continuations
- richer rhythmic validation — the language accepts rhythms that cross bars freely, and the page ties them
- PDF export polishing
- collaborative editing or multi-voice composition tools

The work already in the repo establishes a clean separation between the music domain, the shared notation language,
editing state, renderer, and printing layer. The remaining work is mostly refinement and validation rather than a
complete rewrite.
