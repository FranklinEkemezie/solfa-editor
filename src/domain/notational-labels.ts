import { NOTE_VALUE_UNITS, type NoteValue } from '@/domain/note-value';
import type { TimeSignature } from '@/domain/time-signature';

export function noteValueDenominator(note: NoteValue): number {
    const unit = NOTE_VALUE_UNITS[note];
    return (unit.denominator * 4) / unit.numerator;
}

export function timeSignatureLabel(signature: TimeSignature): string {
    return `${signature.count}/${noteValueDenominator(signature.note)}`;
}
