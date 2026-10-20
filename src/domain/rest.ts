import { MusicalEvent } from '@/domain/musical-event';
import type { Fraction } from '@/domain/fraction';

/** Silence that still occupies its place in the bar. */
export class Rest extends MusicalEvent {
    public constructor(duration: Fraction) {
        super(duration);
    }
}

export default Rest;
