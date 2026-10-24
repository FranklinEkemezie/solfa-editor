import { NOTE_VALUE_UNITS, NoteValue } from '@/domain/note-value';
import type { TimeSignature } from '@/domain/time-signature';

const NOTE_VALUE_LABELS: Record<NoteValue, string> = {
    [NoteValue.WHOLE]: 'Whole note',
    [NoteValue.HALF]: 'Half note',
    [NoteValue.QUARTER]: 'Quarter note',
    [NoteValue.EIGHTH]: 'Eighth note',
    [NoteValue.SIXTEENTH]: 'Sixteenth note',
    [NoteValue.THIRTY_SECOND]: 'Thirty-second note',
    [NoteValue.SIXTY_FOURTH]: 'Sixty-fourth note',
};

export function noteValueDenominator(note: NoteValue): number {
    const unit = NOTE_VALUE_UNITS[note];
    return (unit.denominator * 4) / unit.numerator;
}

export function noteValueLabel(note: NoteValue): string {
    return NOTE_VALUE_LABELS[note];
}

export function timeSignatureLabel(signature: TimeSignature): string {
    return `${signature.count}/${noteValueDenominator(signature.note)}`;
}
