import {
  Accidental,
  Duration,
  Key,
  Note,
  NoteValue,
  PARTS,
  SOLFA_TO_PITCH,
  type SolfaSyllable,
  Tempo,
  TimeSignature,
} from '../../../domain/music';
import type { EditorDocument, EditorMeasure, EditorSlot } from '../adapters/editor-document-schema';

export type EditorPosition = { measureId: string; slotIndex: number };

function getPartMeasures(document: EditorDocument, part: EditorMeasure['part']): EditorMeasure[] {
  return document.measures
    .filter((measure) => measure.part === part)
    .sort((left, right) => left.number - right.number);
}

export function findMeasure(document: EditorDocument, measureId: string): EditorMeasure | undefined {
  return document.measures.find((measure) => measure.id === measureId);
}

export function replaceSlot(
  document: EditorDocument,
  position: EditorPosition,
  syllable: SolfaSyllable,
): EditorDocument {
  return mapMeasure(document, position.measureId, (measure) => ({
    ...measure,
    slots: measure.slots.map((slot, index) =>
      index === position.slotIndex
        ? { ...slot, syllable, continuation: false }
        : slot,
    ),
  }));
}

export function setSlotDuration(
  document: EditorDocument,
  position: EditorPosition,
  noteValue: NoteValue,
): EditorDocument | null {
  const measure = findMeasure(document, position.measureId);
  if (!measure || !measure.slots[position.slotIndex]) return null;

  return mapMeasure(document, position.measureId, (current) => ({
    ...current,
    slots: current.slots.map((slot, index) =>
      index === position.slotIndex ? { ...slot, noteValue } : slot,
    ),
  }));
}

export function clearSlot(document: EditorDocument, position: EditorPosition): EditorDocument {
  return mapMeasure(document, position.measureId, (measure) => ({
    ...measure,
    slots: measure.slots.map((slot, index) =>
      index === position.slotIndex ? { id: slot.id, noteValue: slot.noteValue } : slot,
    ),
  }));
}

export function continueSlot(document: EditorDocument, position: EditorPosition): EditorDocument | null {
  const measureIndex = document.measures.findIndex((measure) => measure.id === position.measureId);
  if (measureIndex < 0) return null;
  const measure = document.measures[measureIndex];
  const previous = measure.slots[position.slotIndex - 1];
  if (!previous?.syllable) return null;
  return mapMeasure(document, position.measureId, (current) => ({
    ...current,
    slots: current.slots.map((slot, index) =>
      index === position.slotIndex
        ? { ...slot, syllable: previous.syllable, continuation: true }
        : slot,
    ),
  }));
}

export function subdivideSlot(document: EditorDocument, position: EditorPosition): EditorDocument | null {
  const measure = findMeasure(document, position.measureId);
  if (!measure) return null;
  const slot = measure.slots[position.slotIndex];
  if (!slot || slot.noteValue !== NoteValue.QUARTER) return null;
  const nextNoteValue = NoteValue.EIGHTH;
  const replacement: [EditorSlot, EditorSlot] = [
    { ...slot, id: `${slot.id}-a`, noteValue: nextNoteValue },
    { id: `${slot.id}-b`, noteValue: nextNoteValue },
  ];
  return mapMeasure(document, position.measureId, (current) => ({
    ...current,
    slots: [...current.slots.slice(0, position.slotIndex), ...replacement, ...current.slots.slice(position.slotIndex + 1)],
  }));
}

export function advancePosition(document: EditorDocument, position: EditorPosition): EditorPosition {
  const measure = findMeasure(document, position.measureId);
  if (!measure) return position;

  if (position.slotIndex + 1 < measure.slots.length) {
    return { measureId: measure.id, slotIndex: position.slotIndex + 1 };
  }

  const partMeasures = getPartMeasures(document, measure.part);
  const currentIndex = partMeasures.findIndex((candidate) => candidate.id === measure.id);
  const nextMeasure = partMeasures[currentIndex + 1];
  if (nextMeasure) {
    return { measureId: nextMeasure.id, slotIndex: 0 };
  }

  return { measureId: measure.id, slotIndex: Math.max(0, measure.slots.length - 1) };
}

export function previousPosition(document: EditorDocument, position: EditorPosition): EditorPosition {
  const measure = findMeasure(document, position.measureId);
  if (!measure) return position;
  if (position.slotIndex > 0) return { measureId: position.measureId, slotIndex: position.slotIndex - 1 };

  const partMeasures = getPartMeasures(document, measure.part);
  const currentIndex = partMeasures.findIndex((candidate) => candidate.id === measure.id);
  const previousMeasure = partMeasures[currentIndex - 1];
  if (previousMeasure) {
    return { measureId: previousMeasure.id, slotIndex: Math.max(0, previousMeasure.slots.length - 1) };
  }

  return { measureId: measure.id, slotIndex: 0 };
}

export function addMeasure(document: EditorDocument): EditorDocument {
  const currentNumbers = document.measures.filter((measure) => measure.part === 'soprano').map((measure) => measure.number);
  const nextNumber = Math.max(0, ...currentNumbers) + 1;
  const parts: EditorMeasure[] = (['soprano', 'alto', 'tenor', 'bass'] as const).map((part) => ({
    id: `${part}-${nextNumber}`,
    part,
    number: nextNumber,
    timeSignature: document.timeSignature,
    slots: Array.from({ length: document.timeSignature.count }, (_, index) => ({
      id: `${part}-${nextNumber}-${index}`,
      noteValue: NoteValue.QUARTER,
    })),
  }));
  return { ...document, measures: [...document.measures, ...parts] };
}

export function removeLastMeasure(document: EditorDocument): EditorDocument | null {
  const numbers = document.measures.filter((measure) => measure.part === 'soprano').map((measure) => measure.number);
  if (numbers.length <= 1) return null;
  const lastNumber = Math.max(...numbers);
  return { ...document, measures: document.measures.filter((measure) => measure.number !== lastNumber) };
}

export type MetadataPatch = Partial<Pick<EditorDocument, 'title' | 'author' | 'timeSignature' | 'key' | 'tempo' | 'lyrics'>>;

export function patchMetadata(document: EditorDocument, patch: MetadataPatch): EditorDocument {
  return { ...document, ...patch };
}

export function makeKey(
  letter: EditorDocument['key']['letter'],
  mode: EditorDocument['key']['mode'],
  accidental: Accidental,
  count: number,
): Key {
  return new Key(letter, { accidental, count } as never, mode);
}

export function makeTimeSignature(note: NoteValue, count: number): TimeSignature {
  return new TimeSignature(note, count);
}

export function makeTempo(beatUnit: NoteValue, bpm: number, description: string): Tempo {
  return new Tempo(beatUnit, bpm, description);
}

export function noteForSlot(slot: EditorSlot): Note | null {
  return slot.syllable
    ? new Note(SOLFA_TO_PITCH[slot.syllable], new Duration(slot.noteValue), slot.syllable, slot.continuation ?? false)
    : null;
}

function mapMeasure(
  document: EditorDocument,
  measureId: string,
  mapper: (measure: EditorMeasure) => EditorMeasure,
): EditorDocument {
  return {
    ...document,
    measures: document.measures.map((measure) => (measure.id === measureId ? mapper(measure) : measure)),
  };
}
