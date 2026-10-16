import type { PartId } from '@/domain/parts';
import { TimeSignature } from '@/domain/time-signature';
import { MusicalEvent } from '@/domain/musical-event';

export class Measure<T extends TimeSignature = TimeSignature> {
    public readonly timeSignature: T;
    public readonly events: MusicalEvent[];
    public readonly part: PartId;
    public readonly number: number;

    public constructor(
        timeSignature: T,
        events: MusicalEvent[] = [],
        part: PartId = 'soprano',
        number = 1,
    ) {
        this.timeSignature = timeSignature;
        this.events = [...events];
        this.part = part;
        this.number = number;
    }
}

export default Measure;
