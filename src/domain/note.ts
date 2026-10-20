import { MusicalEvent } from '@/domain/musical-event';
import { Pitch } from '@/domain/pitch';
import type { Fraction } from '@/domain/fraction';
import type { SolfaSyllable } from '@/domain/solfa';

export class Note extends MusicalEvent {
    public readonly pitch: Pitch;
    public readonly syllable: SolfaSyllable;
    /**
     * True when this note is the continuation of a note that began earlier —
     * in the written source it is the same note held across a barline, not a
     * new attack.
     */
    public readonly continuation: boolean;
    public readonly lyric: string;

    public constructor(
        pitch: Pitch,
        duration: Fraction,
        syllable: SolfaSyllable,
        continuation = false,
        lyric = '',
    ) {
        super(duration);
        this.pitch = pitch;
        this.syllable = syllable;
        this.continuation = continuation;
        this.lyric = lyric;
    }
}

export default Note;
