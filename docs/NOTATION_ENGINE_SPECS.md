# Task: Implement the Solfa Notation Engine

## 1. Objective

Implement a robust, maintainable notation engine for the existing Solfa Editor application.

This is a **major feature and architectural change, not a small patch and not a complete application rewrite**.

The current prototype already has a working, although imperfect, musical domain model, editor, rendering system, playback functionality, and input handling. The goal is to replace the existing approach to musical input with a natural, compact tonic-solfa DSL (domain-specific language) that can be parsed into a well-defined Musical Intermediate Representation (IR).

The implementation must support:

1. Lexical analysis (tokenisation).
2. Syntax analysis (parsing).
3. Semantic analysis.
4. Construction of the Musical IR.
5. Integration with the existing editor, rendering, and playback systems.
6. Reliable editing, deletion, undo, and redo.
7. Comprehensive tests for each layer and their integration.

The application should allow users to enter solfa notation efficiently using either a physical keyboard or the custom on-screen keyboard.

### Important implementation principles

- Inspect the existing codebase before making changes.
- Reuse existing domain models and utilities when they already represent the required concept.
- Modify existing models when their responsibilities remain valid but their representations need to change.
- Replace models where their current design fundamentally conflicts with the new requirements.
- Introduce new models only when existing ones cannot reasonably represent the required concept.
- Do not maintain two competing representations of the same concept without a clear reason.
- Preserve existing functionality that is compatible with the new architecture.
- Keep the notation engine independent of the UI framework and playback library.
- Use the existing coding conventions, naming conventions, and architectural patterns where appropriate.
- Implement the feature incrementally, with meaningful, atomic Git commits.

Do not begin by rewriting the entire application or immediately replacing all existing models. First understand their responsibilities and determine how they fit into the new design.

---

# 2. Inspect the Existing Codebase

Before implementation, inspect the relevant parts of the repository.

At a minimum, examine:

- `src/domain/pitch.ts`
- `src/domain/note.ts`
- `src/domain/musical-event.ts`
- `src/domain/score.ts`
- `src/domain/measure.ts`
- `src/domain/duration.ts`
- `src/domain/fraction.ts`
- `src/domain/letter.ts`
- `src/domain/accidental.ts`
- `src/domain/solfa.ts`
- `src/domain/key.ts`
- `src/domain/key-signature.ts`
- `src/domain/time-signature.ts`
- `src/domain/parts.ts`
- `src/domain/music.ts`
- `src/domain/score-factory.ts`
- `src/domain/score-validation.ts`
- `src/features/score-editor/editor/syllable-input.ts`
- `src/features/score-editor/editor/input-rules.ts`
- `src/features/score-editor/editor/syllable-input.test.ts`
- The editor document schema and its domain adapters.
- The editor's state management, cursor positioning, and undo/redo implementation.
- The existing rendering and playback modules.

These paths are starting points, not an exhaustive list. Follow the dependencies when necessary.

Pay particular attention to how the current application represents notes, durations, measures, keys, voices, and continuations.

Produce a brief implementation plan identifying:

1. Which existing models can be reused unchanged.
2. Which require modification.
3. Which should be replaced.
4. Which new models or modules are necessary.
5. How the notation engine will integrate with the editor and existing downstream consumers.

Do not create a separate implementation of a concept that the existing domain model already handles correctly.

If a design decision is genuinely ambiguous, identify it explicitly and explain the chosen interpretation rather than silently introducing arbitrary behaviour.

---

# 3. Architecture Overview

Create a dedicated **Notation Engine** responsible for transforming the DSL source into a Musical IR.

The intended pipeline is:

```text
DSL source for a voice
        |
        v
Lexical Analysis
        |
        v
Syntax Analysis
        |
        v
Semantic Analysis
        |
        v
Musical Intermediate Representation
        |
        +------------------+
        |                  |
        v                  v
Rendering             Playback
```

The rendering and playback modules already exist. They may need substantial modifications to consume the new IR, but they are not the responsibility of the notation engine itself.

Keep their responsibilities separate.

The notation engine must not depend on React, Tiptap, or Tone.js.

Use ordinary TypeScript domain models and functions. Do not introduce a parser generator or another major dependency without first establishing that it is necessary.

A suggested organisation is:

```text
src/
├── domain/
│   ├── ...
│   └── ...
├── features/
│   ├── notation/
│   │   ├── lexer.ts
│   │   ├── tokens.ts
│   │   ├── grammar.ts
│   │   ├── parser.ts
│   │   ├── semantic-analysis.ts
│   │   ├── notation-engine.ts
│   │   ├── source-position.ts
│   │   └── ...
│   └── score-editor/
│       └── ...
```

This is illustrative. Adapt the final directory structure to the existing project conventions. Do not create unnecessary one-file-per-concept abstractions merely to match this example.

The public interface should provide a clear way to transform a voice's source notation and its relevant configuration into the resulting Musical IR, together with source-position mappings and useful diagnostics.

---

# 4. The DSL: Token Vocabulary

The initial language supports duration specifiers, solfa pitches, accidentals, octave modifiers, continuations, and rests.

## 4.1 Duration specifiers

| Symbol | Duration       |
| ------ | -------------- |
| `:`    | Quarter note   |
| `.`    | Eighth note    |
| `,`    | Sixteenth note |

A duration specifier establishes the current duration.

That duration persists until another duration specifier overrides it.

A duration change affects subsequent musical events. It does not retroactively change previously interpreted events.

Consecutive duration specifiers are valid. The latest specifier determines the duration of subsequent events.

Example:

```text
:.d
```

Interpretation:

- `:` establishes quarter-note duration.
- `.` overrides it with eighth-note duration.
- `d` is an eighth note.

The original source must retain both duration symbols.

Do not simplify or rewrite the source merely because an earlier duration specifier has been superseded.

## 4.2 Natural solfa pitches

The accepted natural solfa syllables are:

```text
d r m f s l t
```

These represent the seven diatonic scale degrees.

## 4.3 Chromatic solfa pitches

The accepted chromatic syllables are:

```text
de re ma fe ba se ta
```

Use the existing solfa definitions and their documented meanings where applicable.

The intended relationships are:

| Syllable | Meaning                |
| -------- | ---------------------- |
| `de`     | Raised first degree    |
| `re`     | Raised second degree   |
| `ma`     | Lowered third degree   |
| `fe`     | Raised fourth degree   |
| `ba`     | Lowered fifth degree   |
| `se`     | Raised fifth degree    |
| `ta`     | Lowered seventh degree |

These syllables are movable relative to the composition's key. They must not be permanently mapped to the same absolute pitch letters regardless of key.

## 4.4 Accidentals

The supported accidental symbols are:

- `#` — sharp.
- `b` — flat.

An accidental modifies a pitch, not the composition's global key.

Examples include:

```text
d#
r#
mb
f#
sb
s#
tb
```

An accidental following a pitch is attached to that pitch.

The latest accidental modifier replaces the previous accidental modifier on the same pitch. It does not stack with the previous modifier.

For example, repeated accidental modifiers must not accidentally produce a double accidental.

Double-sharp and double-flat input are outside the scope of this implementation. Do not introduce input syntax for them.

Use the existing `Accidental` enum if appropriate, but ensure the notation engine only accepts the accidental values supported by this DSL.

**Important:** distinguish the accidental inherent in a chromatic solfa syllable from an explicit accidental modifier. The resulting pitch must have a single, well-defined degree and accidental. Follow the existing solfa conventions, and test equivalent spellings such as `de` and `d#`. Do not allow modifier processing to accidentally double-apply a chromatic alteration.

## 4.5 Octave modifiers

The octave modifiers are:

```text
'   ''   1   2   3   ...
```

Their meanings are:

| Modifier | Octave offset |
| -------- | ------------: |
| `'`      |     +1 octave |
| `''`     |    +2 octaves |
| `1`      |     -1 octave |
| `2`      |    -2 octaves |
| `3`      |    -3 octaves |

The apostrophe sequence `''` is one modifier specifying an offset of +2. It is not two independent modifiers.

Octave modifiers attach to pitches and may appear in either order relative to accidental modifiers.

Examples:

```text
d'#
d#'
d''
d''1
```

The first two examples specify the same pitch alteration and octave offset.

In `d''1`, the latest octave modifier overrides the earlier octave modifier. The result is an octave offset of -1, not a cumulative offset of +1.

This override behaviour is intentional: correcting an octave marker must not cause repeated edits to produce increasingly distant octaves.

Represent the resolved pitch with an absolute octave in the Musical IR, using the voice's configured reference octave and the applicable modifier.

Do not confuse the octave modifier's relative offset with the absolute octave stored in the resulting pitch.

## 4.6 Continuation

The continuation symbol is:

```text
-
```

Each continuation extends the immediately preceding pitch by one unit of the current duration.

Repeated continuations extend that pitch repeatedly. They are not idempotent.

Example:

```text
:d--
```

Interpretation:

- `d` occupies one quarter-note unit.
- The first `-` extends it by one quarter-note unit.
- The second `-` extends it by another quarter-note unit.

The resulting sounding note lasts three quarter-note units.

A continuation does not create a new pitch.

Consecutive continuation symbols are valid. A continuation must have a preceding pitch to extend.

If a new duration specifier appears before a continuation, the continuation uses the newly established duration.

The presentation layer may normalise the resulting rhythm. For example, it may display a long note using an equivalent representation that is clearer to the user. Such normalisation must not silently rewrite the underlying source.

## 4.7 Rest

A literal ASCII space (`U+0020`) represents a rest lasting one unit of the current duration.

Multiple consecutive spaces represent multiple rests.

For example:

```text
:d  r
```

The two spaces between `d` and `r` represent two consecutive rests.

A rest consumes musical time but does not extend or modify a pitch.

Only the literal ASCII space is accepted as a rest. Tabs, line breaks, and other whitespace characters are invalid in this version of the language.

**Never trim, collapse, or normalise the source string.** Doing so would destroy meaningful rests.

## 4.8 Source preservation

Preserve the exact original DSL string, including:

- Duration specifiers.
- Pitch syllables.
- Modifier ordering.
- Continuation symbols.
- Every literal space.

Do not reconstruct the source from the resulting Musical IR. Different source strings may have equivalent musical meanings while differing in their notation.

---

# 5. Lexical Analysis: Tokenisation

Implement lexical analysis as a dedicated layer.

Its responsibilities include:

1. Recognising valid pitch syllables.
2. Recognising duration specifiers.
3. Recognising octave modifiers.
4. Recognising accidentals.
5. Recognising continuations.
6. Recognising literal-space rests.
7. Preserving source ranges.
8. Rejecting unsupported characters and invalid sequences.

## 5.1 Longest valid match with backtracking

Do not implement a naïve greedy tokenizer that always accepts the longest token at the current position without checking the remainder.

Instead, implement **longest valid matching with backtracking**.

At each relevant source position:

1. Identify the valid token candidates that begin at that position.
2. Consider the candidates in longest-first order.
3. Test whether a candidate permits the remaining input to be interpreted as a valid sequence under the grammar and applicable lexical rules.
4. If the remainder cannot be interpreted validly, backtrack and consider the next candidate.
5. Select the longest candidate that permits a valid interpretation of the complete sequence.
6. If no candidate leads to a valid interpretation, report a useful error.

Use memoisation or another suitable technique if needed to avoid exponential behaviour on longer sequences.

The implementation must remain readable and maintainable. Do not optimise prematurely, but do not choose an algorithm that becomes impractical for ordinary musical input.

### Example A: A valid longer pitch

```text
se
```

The sequence is recognised as the chromatic syllable `se`, not as `s` followed by an invalid `e`.

### Example B: Backtracking

Consider:

```text
sba
```

The intended interpretation is:

```text
s + ba
```

The tokenizer must not commit to `sb` as a pitch-plus-accidental interpretation if that choice leaves an invalid remainder.

It must backtrack and find the valid interpretation consisting of `s` followed by `ba`.

This example illustrates why choosing the locally longest token is insufficient.

### Example C: Compact pitch sequences

```text
ddemdsfeltasebam
```

The tokenizer must identify the valid sequence of natural and chromatic syllables without requiring spaces between notes.

Use the complete pitch vocabulary and grammar when determining token boundaries.

### Example D: Duration and continuation

```text
:d--
```

The sequence must be tokenised as a duration specifier, pitch, and two continuation symbols.

### Example E: Whitespace

A literal ASCII space is a rest token.

A newline or tab is invalid. Do not use general-purpose whitespace trimming or splitting that changes the source.

## 5.2 Context-sensitive keyboard input

The editor's physical keyboard input requires a distinction between a key press and a completed DSL token.

For example:

- Pressing `d` creates a natural pitch `d`.
- Pressing `e` immediately after that pitch can extend it into the chromatic syllable `de`.
- Pressing `r` after `d` starts a new pitch rather than extending `d`.
- Pressing `b` at a position where a new pitch is expected should produce the valid syllable `ba`.
- Pressing `b` after a pitch, where the grammar permits an accidental, can apply a flat to that pitch.

The letter `b` is special because it can participate in both a chromatic pitch syllable and an accidental.

The on-screen keyboard provides `[ba]` as a dedicated key, so mobile input can emit the completed syllable directly.

Do not assume that every physical key press must be appended literally to the DSL. Implement a deliberate input-composition layer that translates physical key presses into valid notation edits.

The existing `syllable-input.ts` and related tests already implement part of the current composition behaviour. Inspect them and reuse useful ideas, but do not preserve logic that conflicts with the new source-based editing model.

Keep the input adapter separate from the notation grammar. The physical keyboard and on-screen keyboard should ultimately produce equivalent DSL edits.

## 5.3 Source positions

Every token must retain its original source range.

Use a consistent convention, preferably zero-based, half-open ranges:

```typescript
interface SourceRange {
    start: number;
    end: number;
}
```

A token covering the first two characters has a range of `[0, 2)`.

Source ranges are essential for:

- Associating musical events with the text that produced them.
- Maintaining the cursor position.
- Implementing deletion.
- Supporting undo and redo.
- Translating presentation edits into source edits.
- Producing useful diagnostics.

Account for the editor's indexing convention when converting between source ranges and UI positions.

---

# 6. Syntax Analysis: Grammar and Parsing

Implement a dedicated parser that recognises the structure of the token sequence.

Do not combine all tokenisation, grammar validation, semantic processing, and IR construction into one large function.

The grammar below describes the initial structural rules. Treat the symbols as token categories emitted by lexical analysis rather than assuming every grammar terminal is a single character.

## 6.1 Token categories

The lexer should expose token categories equivalent to:

```text
DURATION       := ":" | "." | ","

PITCH          := "d" | "r" | "m" | "f" | "s" | "l" | "t"
                | "de" | "re" | "ma" | "fe" | "ba" | "se" | "ta"

ACCIDENTAL     := "#" | "b"

OCTAVE         := "'" | "''" | positive integer offset token

CONTINUATION   := "-"

REST           := literal ASCII space
```

This is a description of the token vocabulary, not a replacement for the full lexer implementation.

Octave modifiers must be tokenised so that `''` represents an offset of +2, while the integer tokens represent negative octave offsets.

The physical-keyboard adapter may transform a key press into a complete pitch token before the source is updated. In particular, pressing `b` at pitch-entry position produces `ba`; it must not leave a standalone `b` in the source as an unfinished pitch.

## 6.2 EBNF grammar

Use the following grammar as the initial formal structure:

```ebnf
(* A voice's notation starts with a duration specifier. *)
Document           = DurationSpecifier, { Item } ;

(* A duration change, pitch event, or rest. *)
Item                = DurationSpecifier
                    | PitchEvent
                    | Rest ;

(* A pitch followed by zero or more modifiers and continuations. *)
PitchEvent          = Pitch, { PitchModifier }, { Continuation } ;

Pitch               = NaturalPitch | ChromaticPitch ;

NaturalPitch        = "d" | "r" | "m" | "f" | "s" | "l" | "t" ;

ChromaticPitch      = "de" | "re" | "ma" | "fe"
                    | "ba" | "se" | "ta" ;

PitchModifier       = Accidental | OctaveModifier ;

Accidental          = "#" | "b" ;

OctaveModifier      = "'" | "''" | NegativeOctaveOffset ;

NegativeOctaveOffset = PositiveInteger ;

DurationSpecifier   = ":" | "." | "," ;

Continuation        = "-" ;

Rest                = " " ;
```

### Grammar implementation requirements

The grammar is deliberately expressed in terms of token categories, even though the illustrative terminals use their textual spellings.

The actual parser must consume the lexer's token objects, not repeatedly scan arbitrary substrings independently.

The EBNF specifies the structural form. The parser and semantic layer must also enforce the transition rules and modifier attachment rules described below.

In particular:

- The first token must be a duration specifier.
- A duration specifier may be followed by another duration specifier, a pitch, or a rest.
- A duration specifier cannot be followed directly by a continuation, octave modifier, or accidental.
- A continuation may be followed by a pitch, another continuation, a rest, or a duration specifier.
- A rest may be followed by a pitch, another rest, or a duration specifier.
- An accidental or octave modifier cannot modify a rest or continuation.
- An octave and accidental modifier may appear in either order when modifying the same pitch.
- A pitch may be followed by another pitch.
- Consecutive duration specifiers are valid.
- Consecutive rests are valid.
- Consecutive continuations are valid when they extend an existing pitch.

If the EBNF needs a small refinement to express these constraints precisely, update it and add tests for the resulting grammar. Keep the formal grammar and implementation consistent.

Do not silently introduce support for syntax that has not been specified.

## 6.3 Parsing output

The parser should produce a structured representation of the source sequence, not directly call Tone.js or render UI components.

The intermediate parse structure should preserve:

- The recognised token type.
- The token's original text.
- Its source range.
- The structural relationships between pitches, modifiers, continuations, durations, and rests.

The parser must reject invalid sequences and provide useful error information, including the source position where parsing failed.

Do not silently discard invalid characters or reinterpret an invalid sequence as a different valid sequence unless the specified backtracking rules explicitly permit that interpretation.

---

# 7. Semantic Analysis

Semantic analysis converts the structurally valid parse representation into meaningful musical events.

This stage should be independent of the editor and playback system.

## 7.1 Duration state

Maintain a current duration while processing the sequence.

Initialise it from the first duration specifier.

Whenever another duration specifier occurs, replace the current duration.

Every subsequent pitch, continuation, or rest uses the applicable duration.

A duration change does not retroactively modify previously processed events.

Preserve the original sequence of duration specifiers in the source even when some specifiers are superseded.

## 7.2 Pitch degree and accidental

The primary identity of a movable solfa note must be its scale degree, not an absolute pitch letter.

Introduce or adapt a `Degree` enum with exactly these accepted values:

```typescript
enum Degree {
    I = 'I',
    II = 'II',
    III = 'III',
    IV = 'IV',
    V = 'V',
    VI = 'VI',
    VII = 'VII',
}
```

Use the existing `Letter` enum for contexts where absolute pitch spelling requires C, D, E, F, G, A, or B.

**Modify the existing `Pitch` model to use `Degree` in place of `Letter`.** Do not introduce a parallel `SolfaPitch` class that duplicates the existing model's responsibility unless the codebase inspection demonstrates a compelling reason.

A pitch's solfa degree remains stable when the composition's key changes.

Its sounding pitch is resolved using the current key and the appropriate accidental.

The chromatic solfa syllables must map to the corresponding degree and accidental, using the project's existing solfa conventions.

For example, the natural syllable `d` and the chromatic syllable `de` share degree I, but their default accidental states differ.

The same principle applies to the other chromatic syllables.

When an explicit accidental modifier is present, resolve the pitch's accidental according to the specified override rules. Do not apply a chromatic alteration twice.

## 7.3 Octave resolution

The octave stored in the resulting `Pitch` must be an absolute octave.

Determine it using:

1. The voice's configured reference octave.
2. The pitch's octave modifier, if present.
3. The documented override behaviour of successive octave modifiers.

The reference octave must be configurable per voice rather than hardcoded globally.

Soprano and alto will generally use the same reference octave, while tenor and bass will generally use another shared reference octave. Keep these defaults configurable rather than embedding assumptions throughout the parser.

Use existing voice and part definitions where possible.

Do not make the notation engine depend on the current UI's rendering conventions.

## 7.4 Continuations

Each continuation extends the preceding pitch by one unit of the current duration.

Repeated continuations extend the same note repeatedly.

Do not create a separate independent pitch for every continuation.

If the existing IR represents a sustained note through a combination of note duration and continuation flags, determine whether that representation remains suitable. Reuse it if it can express the required result unambiguously; otherwise, adapt it.

The resulting musical representation must preserve enough information for the existing rendering and playback modules to produce the intended sustained note.

## 7.5 Rests

Each rest consumes one unit of the current duration.

Multiple spaces must produce multiple rests.

Reuse the existing `MusicalEvent` abstraction and introduce or adapt a rest event model if the current domain model does not represent rests correctly.

Do not represent rests as pitches with arbitrary placeholder values.

## 7.6 Invalid input

Invalid input must be rejected according to the grammar and transition rules.

The editor should not maintain arbitrary invalid intermediate notation states.

The input adapter should prevent unsupported key combinations from corrupting the source, and the parser should still validate all resulting source strings.

Do not silently return a partially valid Musical IR for an invalid sequence and treat it as a successful parse.

If a parse fails, return a structured failure result with useful diagnostics.

---

# 8. Musical Intermediate Representation

The Musical IR is the end result of the notation engine.

It must represent the musical meaning of the source, not the mechanics of keyboard input.

The application already has domain models for `Score`, `Measure`, `Note`, `MusicalEvent`, `Pitch`, `Duration`, and related concepts.

**Inspect and adapt these models before introducing new ones.**

## 8.1 Pitch

Modify the existing `Pitch` model so that it stores a `Degree` instead of a `Letter`.

Its conceptual responsibility is:

```typescript
class Pitch {
    public readonly degree: Degree;
    public readonly accidental: Accidental;
    public readonly octave: number;
}
```

This is a description of the intended representation, not a requirement to copy this snippet verbatim.

The important changes are:

- Replace the pitch's primary `Letter` identity with `Degree`.
- Retain `Accidental`.
- Retain an absolute `octave`.
- Update the constructor, validation, conversion functions, and dependent code.
- Preserve `Letter` for other application features, especially staff notation.
- Remove or adapt `toMidi()` if it assumes that the pitch's identity is an absolute letter.

The sounding pitch cannot be derived from `Degree` alone. It requires the composition's key and applicable accidental.

Keep that conversion in an appropriate musical-resolution function or domain service.

Do not make `Pitch` depend on Tone.js.

## 8.2 Note and musical events

Reuse the existing `Note` and `MusicalEvent` abstractions if they can represent the new requirements.

The resulting note representation should preserve:

- Its `Pitch`.
- Its exact duration.
- Its solfa syllable or equivalent spelling information, if needed to preserve enharmonic distinctions.
- Any continuation or tie information required by the existing rendering and playback systems.
- Existing lyric information where applicable.
- Source mapping where appropriate, without unnecessarily coupling the core musical model to the editor.

The exact representation should be determined after inspecting the existing domain model.

Do not duplicate information in multiple fields unless there is a clear domain requirement.

Introduce a dedicated rest event if necessary.

## 8.3 Duration and fraction arithmetic

The existing project has a custom fraction utility.

Reuse and extend it as needed. Do not replace exact musical timing with floating-point arithmetic.

Represent event durations and accumulated musical time using rational arithmetic.

This is important for:

- Continuation duration.
- Measure boundaries.
- Event positions.
- Playback scheduling.
- Avoiding accumulated rounding errors.

Use the existing duration abstractions wherever possible.

Do not introduce a second fraction implementation.

## 8.4 Score-level metadata

The source DSL is for expressing musical events, not document metadata.

Do not put title, subtitle, author, key, time signature, tempo, or other document-level metadata into the DSL.

The existing `Score` model already represents several of these properties. Reuse it and extend it only when necessary.

The source notation should be stored separately from the resulting Musical IR.

## 8.5 Per-voice source

Each voice must have its own source sequence.

Use the existing `PartId` and voice-related domain structures where possible.

Conceptually, the application needs the equivalent of:

```typescript
interface VoiceNotationSource {
    part: PartId;
    source: string;
}
```

This is illustrative. Reuse an existing source/document model if it already serves the same purpose.

The reference octave belongs to the voice's configuration, not to the DSL text.

The overall document should maintain its metadata and voice organisation independently of the notation strings.

## 8.6 Key changes and sounding pitch

The same solfa composition must remain the same notated composition when the key changes.

For example, a melody expressed using `d r m f s l t` must preserve those degrees when the key changes from C major to D major.

The key determines the corresponding sounding pitches.

The notation engine should therefore produce a Musical IR whose note identities are independent of absolute key-specific letter names.

When playback is requested:

1. Resolve each degree using the current key.
2. Apply the relevant accidental.
3. Resolve the absolute octave.
4. Convert the resulting pitch to a format appropriate for Tone.js.

Do not permanently convert the stored solfa degrees into C, D, E, F, G, A, or B during parsing.

Similarly, staff transcription must derive the appropriate absolute pitch spelling from the Musical IR and key.

Keep the conversion from movable solfa to sounding pitch separate from parsing.

## 8.7 Modulation

Modulation syntax and behaviour are outside the scope of this implementation.

However, avoid architectural decisions that would make modulation unnecessarily difficult to introduce later.

The current design should allow pitch resolution to account for additional key context in the future without requiring the DSL parser to be rewritten.

Do not implement speculative modulation functionality as part of this task.

---

# 9. Measure and Timing Integration

The DSL has no explicit measure separator.

The application must infer measures from the time signature and the durations of musical events.

Do not require the user to manually insert measure separators into the DSL.

Reuse the existing `TimeSignature`, `Measure`, and fraction abstractions where appropriate.

Determine how the current application constructs measures and adapt that mechanism to work with the new IR.

The notation engine should not embed UI-specific measure layout.

The downstream musical processing or score-building layer should calculate event positions and measure boundaries using exact fraction arithmetic.

Document the policy for events that cross measure boundaries, and test it. Do not silently truncate musical durations or lose timing information.

---

# 10. Editing and Source Synchronisation

Editing is a major source of potential inconsistencies, so implement it conservatively.

The detailed editing UX is not yet fully specified. The initial implementation should prioritise safe, predictable source editing over an elaborate bidirectional editor.

## 10.1 Source of truth

The raw DSL string for each voice is the canonical editable source.

The Musical IR is derived from that source.

The UI presentation is derived from the source and its resulting musical representation.

Do not maintain three independently mutable versions of the same musical content.

The data flow should be:

```text
User input
    |
    v
Source edit
    |
    v
Tokenisation and parsing
    |
    v
Semantic analysis
    |
    v
Musical IR
    |
    v
Presentation and playback
```

## 10.2 Cursor and source mapping

Maintain a reliable mapping between the editor's current cursor position and the corresponding source position.

The mapping must support:

- Inserting a pitch.
- Appending a modifier.
- Replacing a natural syllable with a chromatic syllable.
- Deleting from the cursor.
- Translating a displayed event to its source range.
- Undo and redo.

Use source ranges produced by the notation engine instead of searching for matching substrings in the source.

Repeated notes and repeated syllables must not cause the wrong event to be edited.

## 10.3 Input composition

Desktop physical-keyboard input and mobile on-screen-keyboard input must produce equivalent notation edits.

The mobile keyboard has dedicated keys for supported chromatic syllables, including `[ba]`.

Desktop input may require composition:

- `d` may initially produce `d`.
- A subsequent `e` can extend it into `de`.
- Other valid pitch prefixes must be handled according to the token vocabulary.
- `b` at pitch-entry position must map to `ba`.
- `b` after an existing pitch may be interpreted as a flat accidental when the grammar permits it.

The editor must update the relevant source token and then regenerate the derived representation.

Do not independently mutate a note in the IR and leave the source unchanged.

## 10.4 Deletion

Backspace must work predictably.

Deleting should remove the appropriate source character or logical input unit and then recompute the affected voice's Musical IR.

Pay special attention to:

- Deleting one character from a multi-character syllable.
- Deleting a chromatic syllable.
- Deleting an accidental.
- Deleting an octave modifier.
- Deleting a duration specifier.
- Deleting a continuation.
- Deleting a rest.

Because duration and tokenisation can affect subsequent events, do not assume that removing one character only affects one musical event.

If the current editor uses atomic note objects rather than a source-based text representation, determine how to integrate source-based editing without creating competing state.

## 10.5 Editing restrictions

For this implementation, assume users primarily enter notation sequentially and do not frequently navigate backward to rewrite arbitrary earlier events.

However, deletion from the cursor, undo, and redo must work.

Do not build a sophisticated bidirectional editing system for every possible operation before the initial notation engine is functional.

Implement a clear, conservative editing model and document its restrictions.

If arbitrary mid-sequence edits cannot yet be supported safely, do not pretend they are fully supported. Make the limitation explicit and design the interfaces so that more advanced editing can be added later.

## 10.6 Invalid edits

Do not allow an invalid edit to leave the source and Musical IR out of sync.

Use a predictable transaction:

1. Construct the proposed source edit.
2. Validate and parse the resulting source.
3. If valid, commit the source and its corresponding IR together.
4. If invalid, reject the edit or restore the last valid source.
5. Keep the cursor and undo/redo history consistent with the chosen behaviour.

Choose the least complicated behaviour compatible with the existing editor architecture.

Document the chosen policy.

## 10.7 Undo and redo

Preserve the existing undo/redo behaviour wherever possible.

Undo and redo must restore the corresponding source and musical state together.

Do not maintain an undo history that restores the source while leaving stale parsed events or presentation data.

If the existing editor history is tied to its current structured document model, inspect it carefully before replacing or adapting it.

---

# 11. Parsing Strategy and Performance

For the initial implementation, reparse the entire affected voice whenever its source changes.

This is intentional.

The language contains persistent duration state, pitch modifiers, continuations, and longest-valid-match tokenisation with backtracking. An apparently local edit can change the interpretation of subsequent source.

Full-voice reparsing is simpler to reason about and test.

Do not implement incremental parsing unless there is a compelling, demonstrated need.

However, separate the layers so that incremental processing could be introduced later without rewriting the entire application.

React rendering is a separate concern. Recomputing one voice's IR must not automatically require rebuilding unrelated document UI.

Use the existing state-management approach and React's normal rendering mechanisms appropriately. Avoid premature optimisation.

---

# 12. Testing Requirements

Write comprehensive tests for every layer of the notation engine.

Do not rely exclusively on end-to-end tests.

Use the existing Vitest setup and follow the current test conventions.

## 12.1 Lexer tests

Cover:

- Every supported natural solfa syllable.
- Every supported chromatic solfa syllable.
- Every duration specifier.
- Both accidentals.
- Octave modifiers, including `''`.
- Continuations.
- Literal-space rests.
- Invalid whitespace.
- Unsupported characters.
- Compact pitch sequences.
- Longest-valid matching.
- Backtracking when a longer local match makes the remainder invalid.
- Source ranges.
- Ambiguity involving `b`.
- Invalid token sequences.

Include explicit regression tests for the `sba` backtracking example.

## 12.2 Parser tests

Cover:

- The mandatory initial duration specifier.
- Valid sequences of pitches.
- Duration changes.
- Consecutive duration specifiers.
- Consecutive rests.
- Consecutive continuations.
- Modifier ordering.
- Invalid transitions.
- Accidental attachment.
- Octave attachment.
- Invalid modifiers following rests or continuations.
- Useful error locations.
- Empty musical content following the initial duration specifier, if supported by the agreed grammar.

Ensure the parser's behaviour matches the formal grammar.

## 12.3 Semantic-analysis tests

Cover:

- Duration persistence.
- Duration overrides.
- Correct duration assignment to subsequent events.
- Octave offsets.
- Octave override behaviour.
- Accidental override behaviour.
- Chromatic syllable mapping.
- Equivalent spellings.
- Continuation accumulation.
- Rest durations.
- Voice-specific reference octaves.
- Invalid continuation sequences.
- Exact fractional timing.

For example:

```text
:d--
```

must represent a note lasting three quarter-note units.

Test that a subsequent duration change affects subsequent continuations, not previously processed events.

## 12.4 Musical IR tests

Verify that:

- The resulting pitch uses `Degree`, not `Letter`, as its primary identity.
- All seven Roman-numeral degrees are supported.
- Accidentals are represented correctly.
- Octaves are resolved correctly.
- Notes and rests preserve their exact durations.
- Existing note information that remains relevant is preserved.
- Source notation is not lost.
- The IR can be consumed by the existing downstream modules after adaptation.

## 12.5 Key-resolution tests

Verify that the same solfa composition resolves to the appropriate different sounding pitches when the key changes.

For example, the tonic degree should resolve to C in C major and D in D major.

Do not hardcode absolute pitch letters into the stored solfa identity.

Test enharmonic spellings and explicit accidentals according to the project's chosen pitch-resolution rules.

## 12.6 Editing tests

Cover:

- Physical keyboard composition.
- On-screen keyboard input.
- Natural-to-chromatic syllable replacement.
- The special `b` mapping.
- Cursor/source-position consistency.
- Backspace.
- Modifier deletion.
- Duration-specifier deletion.
- Rest deletion.
- Continuation deletion.
- Rejection of invalid edits.
- Undo and redo.
- Synchronisation between source, Musical IR, and presentation.
- Repeated syllables and source-range accuracy.

## 12.7 Integration tests

Verify that:

1. A valid DSL source produces the expected Musical IR.
2. The IR integrates with the existing rendering system.
3. Playback receives the correctly resolved sounding pitches and durations.
4. Changing the key changes sounding pitches without changing the stored solfa degrees.
5. Multiple voices are parsed independently.
6. A change to one voice does not corrupt another voice.
7. The editor and Musical IR remain consistent after edits, deletion, undo, and redo.

Use realistic sequences and edge cases, not just isolated one-token examples.

---

# 13. Integration with Existing Rendering and Playback

The application already has rendering and playback modules.

Adapt them to consume the new Musical IR rather than building new rendering or playback systems from scratch.

The existing rendering and playback code may require significant changes because the current `Pitch` model stores absolute letters.

Identify every downstream assumption that needs to change.

In particular:

- Rendering must continue to display the correct solfa syllables.
- Key changes must not rewrite the stored solfa degrees.
- Playback must resolve each degree to the correct sounding pitch.
- Playback must honour exact durations and continuations.
- Measure layout must continue to work with the new event representation.
- Existing lyrics and metadata must remain intact.
- Staff-oriented code must continue to use `Letter` where absolute pitch spelling is required.

Do not let the notation engine call rendering or playback functions directly.

Use a clear boundary between musical interpretation and its consumers.

---

# 14. Documentation

Document the notation language and its implementation.

At a minimum, include:

1. The token vocabulary.
2. The EBNF grammar.
3. The longest-valid-match and backtracking algorithm.
4. Modifier semantics.
5. Duration semantics.
6. Continuation and rest semantics.
7. Pitch-degree representation.
8. Key-relative pitch resolution.
9. Source-to-IR processing.
10. Editing behaviour and current restrictions.

Keep the documentation consistent with the implementation and tests.

Do not document features that have not actually been implemented as if they were complete.

---

# 15. Git Workflow and Incremental Commits

This is a large task. Implement it in meaningful, independently understandable stages.

Do not implement everything and then create one enormous commit.

Use standard Git commits with clear, conventional messages consistent with the repository's history.

A reasonable sequence might include:

1. `docs: specify solfa notation grammar`
2. `refactor: introduce degree-based pitch representation`
3. `feat: implement notation tokenisation`
4. `feat: implement notation parser`
5. `feat: implement notation semantic analysis`
6. `refactor: adapt musical IR to parsed notation`
7. `feat: integrate source-based voice input`
8. `fix: preserve editor cursor and history during notation edits`
9. `refactor: adapt playback to degree-based pitches`
10. `test: cover notation engine integration`

These are examples, not a rigid commit list. Split or combine work according to actual dependencies and the size of each change.

Each commit should be atomic: it should represent one coherent change and avoid unrelated modifications.

Run relevant tests before committing each logical stage.

Do not create commits that knowingly leave the repository in a broken state merely to satisfy a predetermined commit count.

Before finishing, run the appropriate project checks, including:

- Tests.
- Type checking.
- Linting.
- Production build.

Resolve failures caused by the implementation.

Do not hide failing tests or weaken existing assertions merely to make the checks pass.

---

# 16. Definition of Done

The task is complete when:

- The notation engine is implemented as a clear, maintainable module.
- The DSL token vocabulary is implemented.
- Longest-valid-match tokenisation with backtracking works correctly.
- The grammar is documented and enforced.
- Semantic analysis produces the intended musical meaning.
- The Musical IR uses degree-based pitches.
- The existing domain model is reused or adapted appropriately.
- Exact fraction arithmetic is preserved.
- Each voice has an independently stored source sequence.
- The source and resulting IR remain consistent during supported editing operations.
- Desktop and mobile input produce equivalent notation.
- Backspace, undo, and redo work correctly.
- The rendering and playback modules consume the new IR correctly.
- Changing the key changes sounding pitches without changing the stored solfa degrees.
- Tests cover every layer and the integration between layers.
- Documentation describes the implemented behaviour and limitations.
- Project checks pass.
- All work is committed incrementally using meaningful, atomic Git commits.

## Final instruction

Prioritise correctness, clarity, maintainability, and a reliable path for future extension.

This is a major change to the musical input model, so take the time to understand the existing architecture. Reuse what is sound, refactor what conflicts with the new requirements, and replace only what is necessary.

Do not silently invent additional notation features, and do not expand the scope into modulation, double accidentals, or a complete editor rewrite.

If a detail is genuinely ambiguous, document the ambiguity and your proposed resolution. Prefer the smallest decision that enables the MVP to work correctly, and keep the implementation easy to revise.

Proceed incrementally, test each layer, and integrate the completed notation engine with the existing application.
