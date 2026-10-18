# Project Specification: SATB Tonic Sol-fa Editor

## 1. Project Overview

Build a working prototype of a browser-based tonic sol-fa score editor.

The application should let a user compose a simple four-part SATB score using mostly keyboard input, display the score
in a clean musical layout, represent the music using a structured domain model, and export the score as a PDF.

This is a prototype, but its architecture must be suitable for further development into a mature, cross-platform music
application.

The primary objective is to validate the editing experience and the separation between the music domain, editor,
rendering system, and export system.

Do not attempt to implement a complete music engraving application. Prioritize the specified functionality and make
reasonable, documented decisions where details are missing.

## 2. Start by Examining My UML Diagram

I will provide a UML diagram describing my music representation.

**Treat my UML diagram as the authoritative starting point for the music domain model.**

Before writing implementation code:

1. Examine the complete UML diagram.
2. Identify its classes, interfaces, enumerations, attributes, relationships, multiplicities, and inheritance
   structures.
3. Implement the model represented by the diagram.
4. Do not silently replace it with a different model based on assumptions or a generic music-library design.
5. Identify ambiguities, missing details, and implementation decisions that the UML does not specify.
6. Resolve omissions using reasonable decisions consistent with the diagram and this specification.
7. Document significant decisions in the README or a short architecture document.

I have made changes to the UML during the design process. Do not assume that earlier descriptions of the model, previous
conversations, or generic music-domain conventions accurately represent its current contents.

**Use the supplied diagram, not previous descriptions, as the source of truth.**

If a significant contradiction exists between the diagram and this specification, identify it and explain the proposed
resolution before proceeding.

Do not block progress over minor omissions. Make reasonable decisions, document them, and continue.

## 3. Technology Stack

Use the following technologies:

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Tiptap
- Paged.js

Use compatible, stable versions of the required dependencies.

Before installation, verify the current installation instructions and compatibility requirements of the selected
versions.

### Responsibilities of the technologies

**React + TypeScript**

- Application composition.
- UI components.
- Application state and interactions.
- Integration between subsystems.

**Tailwind CSS**

- Application styling and layout.
- Responsive interface.
- Editor presentation where appropriate.

**shadcn/ui**

- Reusable interface components such as buttons, dialogs, dropdowns, and tooltips.
- Accessible interaction primitives.
- Toast notifications, using the supported notification approach for the installed version.

**Tiptap**

- Interactive editing infrastructure.
- Keyboard input.
- Cursor management and selection.
- Editor transactions and undo/redo.
- Custom document structure and editor extensions.

**Paged.js**

- Print pagination where needed.
- Pagination preview or preparation for PDF output.

**HTML and CSS**

- Ordinary text rendering.
- Score headings and metadata.
- Measure layout where appropriate.
- Print styling.

**SVG**

- Use when useful for graphical notation, particularly connected bar lines spanning multiple parts.
- Do not use SVG merely to render ordinary sol-fa syllables.

Do not introduce additional large libraries without a clear need. If a dependency is necessary, explain its purpose in
the README.

## 4. Architecture and Modularity

Organize the application into distinct subsystems.

At minimum, separate:

1. Music domain model.
2. Editor integration.
3. Domain-to-editor adapter.
4. Editor-to-domain adapter.
5. Score layout and rendering.
6. Application state and editing commands.
7. UI components.
8. PDF and print export.
9. Validation and input feedback.

These are conceptual responsibilities, not necessarily nine separate packages.

Keep the implementation understandable without introducing unnecessary abstraction layers.

### Suggested directory structure

Adapt this structure if the UML or framework conventions require a different arrangement, but preserve the separation of
responsibilities.

```text
src/
├── app/
│   ├── app.tsx
│   ├── app-provider.tsx
│   └── routes.tsx
│
├── components/
│   ├── ui/
│   ├── layout/
│   └── feedback/
│
├── features/
│   └── score-editor/
│       ├── components/
│       │   ├── score-editor.tsx
│       │   ├── score-header.tsx
│       │   ├── score-metadata.tsx
│       │   ├── score-toolbar.tsx
│       │   ├── score-line.tsx
│       │   ├── part-row.tsx
│       │   └── measure-view.tsx
│       │
│       ├── editor/
│       │   ├── create-editor.ts
│       │   ├── editor-extensions.ts
│       │   ├── input-rules.ts
│       │   ├── keyboard-shortcuts.ts
│       │   └── editor-commands.ts
│       │
│       ├── adapters/
│       │   ├── domain-to-editor.ts
│       │   ├── editor-to-domain.ts
│       │   └── editor-document-schema.ts
│       │
│       ├── layout/
│       │   ├── calculate-score-layout.ts
│       │   └── layout-types.ts
│       │
│       ├── validation/
│       │   ├── validate-score.ts
│       │   └── validate-editor-input.ts
│       │
│       └── state/
│           ├── score-store.ts
│           └── score-commands.ts
│
├── domain/
│   └── music/
│       ├── [classes and types from the UML]
│       ├── [enums from the UML]
│       ├── [domain validation]
│       └── [domain calculations]
│
├── features/
│   └── pdf-export/
│       ├── print-score.tsx
│       ├── export-score.ts
│       └── print.css
│
├── lib/
│   ├── errors/
│   └── utilities/
│
├── styles/
│   └── globals.css
│
└── main.tsx

tests/
├── unit/
├── integration/
└── fixtures/
```

This is a suggested starting point, not a requirement to create empty files or folders for every item.

Create files when they have meaningful responsibilities.

Do not create an enormous number of tiny files solely to satisfy a one-class-per-file rule. Prefer one cohesive
responsibility per file, with closely related declarations grouped when that improves readability.

### Strict modularity requirements

- `App.tsx` must not contain the entire application.
- Do not put the complete editor implementation in one component.
- Do not put the entire domain model, adapters, validation, layout, and export code in one file.
- Avoid circular dependencies.
- Keep UI components relatively small and focused.
- Keep React-specific concerns out of the core music domain.
- Keep browser APIs out of the core music domain.
- Do not let Tiptap become the authoritative representation of the music.
- Do not make the domain model depend on SVG, HTML, CSS, React, or Tiptap.
- Do not implement domain calculations inside presentation components.
- Avoid unnecessary global state.
- Prefer explicit dependencies and clear function interfaces.
- Avoid premature abstraction, speculative extensibility, and unnecessary design patterns.

A developer should be able to locate the implementation of a particular feature without searching through a giant
component.

## 5. The Music Domain Model

Implement the domain model based on the supplied UML.

Preserve its intended concepts and relationships.

The model must represent the actual music independently of how it is displayed or edited.

### Domain independence

The music model must not contain:

- React components.
- Tiptap nodes or editor instances.
- HTML elements.
- SVG elements.
- CSS classes.
- Browser selection objects.
- Pixel coordinates.
- UI-specific state.
- Toast notification logic.

Presentation-specific information belongs in the presentation subsystem.

Editor-specific information belongs in the editor integration subsystem.

### Domain calculations

Implement musical calculations in the domain layer or a clearly separated domain-service layer.

Examples include:

- Calculating the effective duration of a note.
- Calculating the total duration of a measure.
- Determining the rhythmic position of an event.
- Determining whether a measure exceeds its expected duration.
- Calculating the next rhythmic position for keyboard entry.

Use the classes and types from the UML wherever appropriate.

Do not duplicate the same musical calculation independently in the editor, renderer, and PDF exporter.

### Duration precision

If the UML models note values or durations, preserve the intended distinction between written note value and effective
musical duration.

Use exact rational arithmetic for musical durations where practical. Avoid floating-point accumulation as the primary
means of determining whether a measure fits its meter.

A written note value, an augmentation dot, a rhythmic separator, and a measure's elapsed duration are not
interchangeable concepts.

Do not infer musical duration solely from the number of characters typed.

## 6. The Four-Part SATB Score

The prototype supports exactly four parts:

- Soprano (S)
- Alto (A)
- Tenor (T)
- Bass (B)

Display the parts in that order, vertically aligned.

For the prototype, the user does not need to create arbitrary numbers of parts.

Initialize the editor with a useful default score containing four measures' worth of editing space? No: initialize with
**two measures per part**, using the initial time signature and default measure count defined by the application.

Use a default of 3/4 time unless another default is more appropriate to the supplied UML. If the default is changed,
document it.

The exact initial content should be equivalent to:

```text
S | : : : | : : : ||
A | : : : | : : : ||
T | : : : | : : : ||
B | : : : | : : : ||
```

This is a conceptual illustration, not literal text that must be stored.

The notation above represents empty rhythmic positions, not notes and not rests.

The number of initial rhythmic positions must be derived from the selected time signature and the application's initial
rhythmic subdivision policy. Do not hard-code three separators for every time signature.

For example, with a 3/4 time signature and a policy of one empty position per quarter-note beat, each measure initially
contains three empty positions.

The initial measure count is a presentation/editing convenience. It must not be confused with the number of beats in a
measure.

### Empty positions

An empty rhythmic position is not automatically a rest.

The user should be able to enter notes into empty positions. The editor must not silently convert all unfilled positions
into rests.

The editor may use subtle placeholders to show available rhythmic positions.

The domain model should represent only the musical concepts specified by the UML. If an editor-only placeholder is
required, do not incorrectly represent it as a musical note or rest.

### Measure structure

- Measure boundaries must be visible.
- Users must not need to type bar-line characters.
- Measure boundaries must be represented structurally.
- Measures must be associated with the appropriate part and score.
- Adding or removing measures must preserve the consistency of the score across all four parts.
- A measure must not silently disappear because its contents are empty.

The final bar line may be visually distinct from ordinary bar lines.

The displayed bar lines must be generated from the score structure, not treated as arbitrary characters typed by the
user.

## 7. Score Metadata and Header

The interface should have a simple, polished design.

Display:

- Score title.
- Author.
- Key.
- Time signature.
- Tempo.
- Optional tempo description.

Example:

```text
My First Tune
by Composer

C Major · 3/4 · ♩ = 100
Andante
```

This is an illustrative layout.

### Requirements

- The title must be editable.
- The author must be editable.
- The key must be editable using an appropriate control.
- The time signature must be editable.
- The tempo must be editable.
- The tempo description must be optional.
- Metadata changes must update the score representation.
- Invalid metadata must be handled gracefully.
- The header must not overwhelm the actual notation.

Use suitable shadcn/ui components where helpful.

Do not require users to edit metadata by manipulating raw JSON or domain objects.

Keep the metadata UI separate from the notation editor.

## 8. Editor Experience

The primary editing interaction should feel like typing in a text editor.

The user should not need to drag individual notes into position.

The editor must support ordinary keyboard interaction, including:

- Typing notes.
- Backspace.
- Delete.
- Cursor movement.
- Undo.
- Redo.
- Moving between parts and measures.
- Selecting and replacing note content where appropriate.

Use Tiptap and its underlying ProseMirror infrastructure to handle editing mechanics.

Do not build a custom text editor from scratch.

### Important architectural distinction

The Tiptap document is not the music domain model.

The editor is an interactive representation of the music. The domain model is the authoritative representation of the
score.

Implement explicit conversion between these representations.

Do not use `editor.getText()` as the sole method of reconstructing the music. Plain text does not reliably preserve all
the structure required by the score model.

Do not treat HTML generated by the editor as the authoritative music representation.

### Typing experience

The main supported sol-fa input characters are:

- `d`
- `r`
- `m`
- `f`
- `s`
- `l`
- `t`

Support the case convention selected for the prototype and document it. Prefer lowercase for note syllables, with the UI
displaying them consistently.

Support the rhythm-related characters needed by the agreed notation rules:

- `.` for the specified rhythmic subdivision.
- `-` for continuation where supported by the notation model.

Do not invent additional notation syntax.

Follow the agreed notation rules and the UML.

If a notation rule is ambiguous, choose a consistent interpretation, document it, and keep the implementation easy to
change.

### Input validation

Unsupported characters must not corrupt the score.

For example, entering `z` must not create an invalid musical event.

For unsupported input:

1. Reject the invalid character or operation.
2. Preserve the valid existing score.
3. Provide a concise toast warning.
4. Provide a brief, optional error sound if practical.
5. Avoid repeated notifications for every character during a rapid input sequence.

The error sound must be subtle and must not play unexpectedly during unrelated interactions.

If sound feedback is blocked by browser restrictions, the application must continue to work normally.

Use an appropriate notification component from shadcn/ui or its supported ecosystem.

Do not allow invalid characters to leak into the underlying domain model.

## 9. Rhythmic Input and Automatic Advancement

This is one of the most important parts of the prototype.

The user should not have to type measure bar lines or rhythmic separators manually.

The editor must determine the appropriate rhythmic position for new input.

### Required behaviour

When the user types a valid note syllable:

1. Interpret it as a note-entry operation.
2. Insert or replace the note at the current rhythmic position.
3. Update the editor and domain representations.
4. Determine the next suitable input position.
5. Move the cursor or active input position accordingly.

The behaviour should resemble entering notes into a simple musical text editor.

For example, in a measure with three available quarter-note positions:

```text
Before:
| : : : |

Type d:
| d : : |

Type r:
| d r : |

Type m:
| d r m |
```

The illustration describes the intended progression of rhythmic positions, not a requirement to store the notation as
literal text.

### Rhythmic separators

The colon `:` is a visual rhythmic separator.

Users must not have to type it.

The application should derive separator placement from the structured rhythmic representation and render it
automatically.

The separator must not become an independent musical event unless the UML explicitly models it that way.

### Dotted subdivision behaviour

The editor must distinguish between ordinary note entry and a subdivision operation.

The intended behaviour is:

- Typing a note syllable enters a note.
- Typing `.` performs the subdivision operation specified by the notation rules.
- Typing a subsequent note after a subdivision must place it at the next appropriate subdivision position, not
  automatically advance an entire beat.

For example, if a beat is initially represented as one empty quarter-note position, subdividing it should create the
appropriate smaller positions according to the agreed notation rules.

The user should then be able to enter multiple notes within that beat.

The editor must derive cursor advancement from the current rhythmic structure and event durations rather than merely
counting typed characters.

### Continuation

Where supported by the UML and notation rules, `-` continues the preceding note rather than creating an unrelated new
pitch.

The editor must not interpret a continuation as a new note with an independent pitch.

### Advancement policy

Implement cursor advancement as a separate, testable subsystem.

For example, a function may determine the next valid input position based on:

- Current part.
- Current measure.
- Current rhythmic position.
- Current subdivision.
- Existing event duration.
- Measure capacity.
- Whether the current position has already been filled.

Do not bury all advancement rules in a React event handler.

### Edge cases

Handle these cases consistently:

- Typing into an empty position.
- Replacing an existing note.
- Typing at the end of a measure.
- Typing at the end of the score.
- Subdividing an already occupied beat.
- Subdividing a beat that has already been subdivided.
- Backspacing at the beginning of a measure.
- Backspacing across a rhythmic boundary.
- Deleting a note that has continuations.
- Moving between SATB parts.
- Changing the time signature.
- Entering a note when no empty position remains.

For edge cases not fully specified, choose the simplest predictable behaviour and document it.

Do not silently delete valid notes to accommodate new input.

If an operation cannot be performed without damaging the score, reject it with clear feedback.

The prototype does not need to support every possible notation combination.

## 10. SATB Alignment and Score Layout

The score must display all four parts in a coherent layout.

Example:

```text
S  | d   r   m : f   - | m   r   d ||
A  | m   f   s : s   - | f   m   r ||
T  | s   s   d : r   - | d   t   l ||
B  | d   -   d : s   - | d   -   d ||
   |____________________|____________|
```

The illustration is schematic.

### Requirements

- S, A, T, and B labels must align vertically.
- Corresponding measures must align horizontally across all parts.
- Corresponding rhythmic separators must align where they represent the same structural position.
- Bar lines must span all four parts.
- A bar line must not be rendered as four visually disconnected characters if a continuous line is feasible.
- Measures should use a consistent width across the four parts.
- The layout must remain readable when the score exceeds the available viewport width.

### Rendering strategy

Use ordinary HTML text for sol-fa syllables and other textual content.

Use CSS for ordinary alignment and borders where practical.

Use SVG or another appropriate graphical representation for continuous bar lines if that produces a cleaner
implementation.

Do not force every note into SVG.

### Layout independence

Implement the score layout in a separate subsystem.

It should determine the presentation positions and dimensions required to align the parts.

Do not place layout calculations inside individual note components.

The layout subsystem should not mutate the music domain model.

For the prototype, fixed-width measures are acceptable.

Use horizontal scrolling when the score exceeds the available width.

Do not introduce sophisticated automatic engraving unless necessary to meet the requirements.

### Rhythmic alignment

Equal measure widths alone do not guarantee correct rhythmic alignment.

The layout must account for the shared rhythmic structure where necessary.

If the prototype uses a simplified layout, document its limitations.

Do not claim proportional rhythmic spacing if the layout does not actually implement it.

## 11. Domain-to-Editor and Editor-to-Domain Adapters

Implement both directions explicitly.

### Domain-to-editor adapter

Responsibilities:

- Accept a valid domain score.
- Convert the score into the editor's structured document representation.
- Preserve the score's meaningful musical structure.
- Represent all four parts.
- Represent measures and events correctly.
- Ensure the editor displays the score consistently.

The adapter must not mutate the original domain score.

### Editor-to-domain adapter

Responsibilities:

- Accept the current structured editor document.
- Convert it into the domain model.
- Validate the converted score.
- Reject invalid or inconsistent structures.
- Preserve meaningful musical information.
- Report conversion errors in a useful way.

Do not rely on the editor's visible text alone to reconstruct the score.

### Round-trip behaviour

The conversion system should satisfy the following property for valid supported scores:

```text
Domain Score
    -> Editor Document
    -> Domain Score
```

The resulting domain score should be semantically equivalent to the original.

Semantic equivalence means preserving the meaningful musical content, structure, and metadata, even if irrelevant
editor-specific details differ.

Write automated tests for this property.

Also test the reverse direction where appropriate:

```text
Editor Document
    -> Domain Score
    -> Editor Document
```

The second conversion must produce a valid, consistent editor document.

### Avoid duplicated sources of truth

The editor may maintain its own transient state for cursor position, selection, and composition.

However, there must be a clear synchronization strategy between editor transactions and the authoritative score model.

Do not create an uncontrolled feedback loop where:

1. The editor changes.
2. The domain model changes.
3. The editor is completely recreated.
4. The cursor position is lost.
5. The editor changes again.

Use the editor framework's transaction mechanisms and update only what is necessary.

Preserve cursor position, selection, and undo/redo behaviour whenever possible.

## 12. PDF Export

The prototype must support exporting the score to PDF.

Use a dedicated print view rather than printing the interactive editor directly.

### Print view

Create a read-only representation of the score from the domain model.

It should include:

- Score title.
- Author.
- Key.
- Time signature.
- Tempo.
- Optional tempo description.
- All four SATB parts.
- All measures and notes.
- Correctly aligned bar lines.
- Appropriate spacing and typography.

It must not include:

- Editor toolbar.
- Selection highlights.
- Input placeholders.
- Editing controls.
- Toast notifications.
- Debug information.
- Cursor indicators.

### PDF implementation

Use Paged.js where its pagination capabilities are useful.

For the initial prototype, ordinary browser printing may be sufficient for single-page scores.

Provide a visible **Export PDF** or **Print / Save as PDF** action.

The export workflow should:

1. Read the current valid score.
2. Render a separate print view.
3. Apply print-specific CSS.
4. Paginate the output if necessary.
5. Open or invoke the browser's print workflow.
6. Allow the user to save the result as a PDF.

Do not assume that installing Paged.js automatically creates a downloadable PDF.

Document the exact export mechanism and any browser limitations.

### Print styling

Define print styles separately from application styles.

Account for:

- Page margins.
- Page size.
- Text scaling.
- Measure widths.
- SATB alignment.
- Page breaks.
- Avoiding unnecessary splitting of related score elements.
- Legibility on paper.

Use a sensible default page size, such as A4, unless another format is justified.

The output should be readable when printed or viewed as a PDF.

Do not include browser-specific UI in the output.

## 13. Application UI and User Experience

Build a simple, polished, restrained interface.

The design should feel like a focused music-writing tool rather than a generic administration dashboard.

### Suggested interface

Header:

- Application name or wordmark.
- Score title.
- Author.

Metadata area:

- Key.
- Time signature.
- Tempo.
- Optional tempo description.

Editor area:

- SATB labels.
- Four aligned parts.
- Visible measure boundaries.
- Clear rhythmic positions.
- Keyboard-oriented interaction.

Toolbar:

- Add measure.
- Remove measure, if supported.
- Undo.
- Redo.
- Export PDF.

Feedback:

- Subtle selection state.
- Helpful empty-position indicators.
- Validation toasts.
- Optional error sound.

### Design requirements

- Use a consistent spacing system.
- Use accessible contrast.
- Make the active input position obvious.
- Avoid unnecessary animations.
- Avoid excessive gradients, shadows, and decorative effects.
- Do not sacrifice editing clarity for visual effects.
- Ensure the layout works on narrower screens.
- Keep the score usable even when horizontal scrolling is necessary.

Do not build unrelated features such as user accounts, collaboration, cloud storage, or a marketplace.

## 14. State Management

Use the simplest state-management approach that supports the required behaviour.

React state or a small dedicated store is acceptable.

Do not introduce a large state-management library without a clear need.

Keep distinct:

- Authoritative music data.
- Editor document state.
- Cursor and selection state.
- UI state.
- Export state.

Provide explicit commands for important score operations where appropriate.

Examples:

- Insert note.
- Replace note.
- Insert subdivision.
- Delete event.
- Move to next input position.
- Add measure.
- Remove measure.
- Change metadata.

Keep commands testable and avoid burying complex logic in event handlers.

## 15. Testing Requirements

Use a suitable testing framework compatible with the selected stack.

At minimum, test the domain calculations, adapters, and input logic.

### Domain tests

Test:

- Duration calculations.
- Dotted note values where supported.
- Measure duration calculations.
- Measure capacity validation.
- Time-signature behaviour.
- Score structure validation.
- Correct SATB part ordering.

Use exact arithmetic where required.

### Adapter tests

Test:

- Domain score to editor document.
- Editor document to domain score.
- Round-trip semantic equivalence.
- Preservation of metadata.
- Preservation of measures and events.
- Rejection of invalid structures.

### Input tests

Test:

- Valid syllable entry.
- Unsupported character rejection.
- Automatic advancement.
- Subdivision behaviour.
- Continuation behaviour where supported.
- Backspace and deletion at measure boundaries.
- Behaviour when the measure is full.
- Behaviour at the end of the score.

### Layout tests

Where layout calculations are represented as pure functions, test:

- Consistent measure boundaries across parts.
- Consistent rhythmic separator positions.
- Stable ordering of SATB parts.
- Minimum measure widths.

### Integration tests

Verify that:

- Editing a note updates the displayed score.
- Metadata changes appear in the print view.
- Adding a measure updates all four parts.
- Invalid input does not corrupt the score.
- PDF export uses the current score rather than stale data.

Do not attempt to test every CSS detail through unit tests.

Prefer tests that validate meaningful behaviour.

## 16. Coding Conventions

Follow established conventions for React, TypeScript, and modern JavaScript.

### Naming

Use kebab-case for file and directory names:

```text
score-editor.tsx
measure-view.tsx
domain-to-editor.ts
calculate-score-layout.ts
```

Use PascalCase for React components, classes, interfaces, and types where appropriate:

```typescript
function ScoreEditor() {}
class Score {}
interface ScoreMetadata {}
type NoteValue = ...
```

Use camelCase for variables, functions, and object properties:

```typescript
const currentMeasure = ...
function calculateDuration() {}
```

Use UPPER_SNAKE_CASE for true constants where appropriate, not for every immutable variable:

```typescript
const DEFAULT_TEMPO = 100;
```

Use meaningful names. Avoid cryptic abbreviations.

### TypeScript

- Enable strict TypeScript checking.
- Avoid `any`.
- Prefer explicit domain types.
- Use discriminated unions where they clarify domain variants.
- Use `unknown` instead of `any` for untrusted values.
- Validate data at subsystem boundaries.
- Avoid excessive type assertions.
- Avoid non-null assertions unless justified.
- Keep public function signatures clear.
- Do not duplicate types unnecessarily.
- Avoid using TypeScript interfaces merely to wrap primitives without a domain reason.

### React

- Use function components and hooks.
- Keep components focused.
- Extract nontrivial logic into dedicated modules or hooks.
- Avoid deeply nested conditional JSX.
- Do not use effects as a substitute for clear state transitions.
- Use stable keys for rendered collections.
- Preserve editor instances rather than recreating them unnecessarily.
- Keep editor transactions and cursor handling deliberate.

### General design

- Prefer composition over unnecessary inheritance.
- Use abstractions when they represent real concepts or remove meaningful duplication.
- Avoid speculative generality.
- Avoid magic numbers.
- Document non-obvious decisions.
- Keep comments useful and concise.
- Do not add comments that merely repeat the code.
- Avoid excessive defensive code that obscures ordinary behaviour.
- Handle errors at appropriate boundaries.
- Never silently swallow unexpected exceptions.

### Formatting and quality tools

Configure appropriate tools for:

- Formatting.
- Linting.
- Type checking.
- Testing.

Use ESLint and Prettier or an equivalent compatible setup.

Add scripts for common development tasks.

At minimum, the following should be available:

```text
npm run dev
npm run build
npm run lint
npm run typecheck
npm run test
```

If a particular script is not appropriate for the chosen tooling, document the alternative.

## 17. Git Workflow

Git must be used throughout development.

**Do not implement the entire project first and create one large commit at the end.**

Work incrementally.

### Initial setup

1. Inspect the existing repository.
2. Determine whether it is empty or contains existing work.
3. Preserve relevant files.
4. Initialize Git only if the repository is not already initialized.
5. Configure the initial project structure.
6. Add an appropriate `.gitignore`.
7. Create an initial commit after the project setup is functional.

Do not overwrite existing user files without examining them.

### Incremental development

Make small, logically cohesive commits.

A reasonable sequence is:

1. Project scaffolding and tooling.
2. Domain model based on the UML.
3. Domain validation and duration calculations.
4. Editor document schema and adapters.
5. Static SATB score rendering.
6. Keyboard input and automatic advancement.
7. Editing commands and error feedback.
8. Metadata controls.
9. Print view and PDF workflow.
10. Tests, documentation, and cleanup.

Adjust the order when dependencies require it.

Do not create commits that claim to implement functionality that does not work.

### Commit quality

Each commit should represent a coherent change.

Use clear commit messages, preferably following Conventional Commits:

```text
chore: scaffold React application
feat: implement music domain model
test: add duration calculation tests
feat: render four-part score
feat: support keyboard note entry
feat: add print and PDF export
docs: document architecture and development
```

Run the relevant checks before committing.

Keep the working tree clean at meaningful milestones.

Do not use destructive Git commands or rewrite existing history without explicit permission.

### Progress reporting

After each meaningful milestone, report:

- What was implemented.
- Which files or subsystems changed.
- Which tests or checks passed.
- The commit hash and message.
- Any known limitations.
- The next planned milestone.

This is important because I intend to read the code and understand how the application was implemented.

Do not wait until the end to explain the architecture.

## 18. README and Documentation

Write a detailed, accurate README.

The README must reflect the actual implementation, not the intended future design.

Include:

1. Project name.
2. Project overview.
3. Goals and non-goals.
4. Current features.
5. Technology stack.
6. Installation instructions.
7. Development instructions.
8. Available npm scripts.
9. Architecture overview.
10. Directory structure.
11. Description of the music domain model.
12. How the UML was translated into code.
13. Editor architecture.
14. Domain-to-editor conversion.
15. Editor-to-domain conversion.
16. Keyboard input rules.
17. Rhythmic advancement rules.
18. SATB layout strategy.
19. PDF export workflow.
20. Testing instructions.
21. Known limitations.
22. Future extension points.
23. License information.

Include a simple architecture diagram using Mermaid if useful.

Explain where important behaviours are implemented so that I can continue development without relying on an AI agent to
rediscover the project structure.

Document significant assumptions made where the UML was silent.

Do not claim features are supported unless they actually work.

## 19. Repository and Project Hygiene

Add appropriate project files, including:

- `.gitignore`
- `README.md`
- `LICENSE`
- `package.json`
- TypeScript configuration.
- Vite configuration.
- Tailwind configuration or CSS-first setup, depending on the chosen Tailwind version.
- ESLint configuration.
- Prettier configuration.
- Test configuration.
- Any required shadcn/ui configuration.
- Lockfile.
- `.editorconfig`, where appropriate.

Use the official MIT License template.

Do not invent the copyright holder's legal name. Use a clearly marked placeholder if necessary.

The `.gitignore` should exclude at least:

- `node_modules/`
- Build output.
- Coverage output.
- Environment files containing secrets.
- Local logs.
- Operating-system artifacts.
- IDE-specific files where appropriate.

Do not ignore source files or configuration required to reproduce the development environment.

Commit the lockfile so dependency versions can be reproduced.

Do not commit generated secrets, personal credentials, or unnecessary build artifacts.

## 20. Scope Control

This is a prototype, not a complete music notation suite.

Do not implement:

- Musical ornaments.
- Complex articulations.
- Crescendo and diminuendo editing.
- Advanced dynamic markings.
- Arbitrary numbers of parts.
- Full conventional staff notation.
- MIDI import or export.
- Audio recording.
- Cloud synchronization.
- Authentication.
- Collaboration.
- A backend server.
- Complex engraving algorithms.
- Advanced score playback unless it is necessary for a clearly separated future extension.

Do not add features simply because a music application might eventually need them.

Focus on the specified editing, rendering, and PDF workflow.

## 21. Definition of Done

The prototype is complete when all the following conditions are met.

### Application

- The project installs successfully.
- The development server starts.
- The production build succeeds.
- The application runs without critical console errors.

### Music model

- The domain model follows the supplied UML.
- Significant assumptions are documented.
- The model does not depend on React, Tiptap, HTML, or SVG.
- Domain calculations have automated tests.

### Editor

- The application displays a score title and author.
- Key, time signature, and tempo are displayed and editable.
- The tempo description is optional.
- Four SATB parts are displayed in the correct order.
- Initial measures are created automatically.
- Users do not need to type measure bar lines.
- Users do not need to type rhythmic separators.
- Valid sol-fa syllables can be entered with the keyboard.
- Cursor advancement follows the documented rhythmic rules.
- Subdivision behaviour works for the supported cases.
- Backspace and deletion behave predictably.
- Invalid input is rejected without corrupting the score.
- Error feedback is provided.
- Adding a measure preserves alignment across all four parts.
- The editor remains usable without dragging notes.

### Architecture

- The domain-to-editor adapter exists.
- The editor-to-domain adapter exists.
- Round-trip tests verify preservation of supported musical data.
- Layout calculations are separate from the domain model.
- The editor does not become the authoritative music representation.
- UI components and subsystems are modular and readable.

### PDF

- A dedicated print view exists.
- It uses the current score.
- It displays the four parts coherently.
- It excludes interactive editor controls.
- The user can save a PDF through the documented workflow.
- The exported result is readable.

### Quality and documentation

- Linting passes.
- Type checking passes.
- Automated tests pass.
- The production build passes.
- The README is complete and accurate.
- The MIT license file is present.
- `.gitignore` and project configuration are appropriate.
- Development was recorded in incremental Git commits.
- The final report identifies any remaining limitations.

Do not declare the project complete merely because the interface looks good.

The core editing and export workflow must actually work.

## 22. Execution Instructions

Work in the following manner.

### Phase 1: Inspect and plan

- Inspect the repository.
- Examine the supplied UML.
- Confirm the existing environment.
- Identify ambiguities.
- Propose the domain model implementation and project structure.
- Record important assumptions.

Do not spend excessive time producing a plan instead of implementing the project.

### Phase 2: Build incrementally

Implement the application in small, verifiable milestones.

After each milestone:

1. Run relevant tests and checks.
2. Inspect the result.
3. Fix regressions.
4. Commit the working change.
5. Report progress.

Do not defer all testing until the end.

### Phase 3: Verify the complete workflow

Test the application manually and automatically.

Verify the following sequence:

1. Open the application.
2. See the initialized SATB score.
3. Change the title and metadata.
4. Enter sol-fa syllables using the keyboard.
5. Subdivide a beat using the supported notation.
6. Navigate between positions and parts.
7. Correct an entry using Backspace or Delete.
8. Add a measure.
9. Confirm that the four parts remain aligned.
10. Export the score as a PDF.
11. Inspect the PDF for clipping, incorrect alignment, and missing content.
12. Run the production build and test suite.

### Phase 4: Explain the implementation

At completion, provide:

- A summary of the implemented features.
- The final project structure.
- The key architectural decisions.
- How the domain model relates to the UML.
- How the adapters work.
- How keyboard input and rhythmic advancement work.
- How SATB alignment is implemented.
- How PDF export works.
- Commands to run, test, lint, and build the application.
- The Git commit history for the implementation.
- Known limitations and sensible next steps.

Explain the implementation in a way that helps me understand and continue developing it myself.

Do not merely say that the code is modular or maintainable. Show how the responsibilities are separated and where the
important logic lives.

**Final priority: build a small, working, readable prototype with a sound architecture—not an impressive-looking mock-up
with incomplete editing behaviour.**
