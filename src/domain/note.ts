import { MusicalEvent } from '@/domain/musical-event';
import { Pitch } from '@/domain/pitch';
import { Duration } from '@/domain/duration';
import type { SolfaSyllable } from '@/domain/solfa';

export class Note extends MusicalEvent {
    public readonly pitch: Pitch;
    public readonly syllable: SolfaSyllable;
    public readonly continuation: boolean;
    public readonly lyric: string;

    public constructor(
        pitch: Pitch,
        duration: Duration,
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
