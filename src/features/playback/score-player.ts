import * as Tone from 'tone';
import type { EditorDocument } from '@/features/score-editor/adapters/editor-document-schema';
import {
    buildPlaybackEvents,
    type PlaybackCallbacks,
    type PlaybackEvent,
} from '@/features/playback/playback-events';

export class ScorePlayer {
    private synth: Tone.PolySynth | null = null;
    private part: Tone.Part | null = null;
    private callbacks: PlaybackCallbacks = {};

    public async start(document: EditorDocument, callbacks: PlaybackCallbacks = {}): Promise<void> {
        this.stop();
        this.callbacks = callbacks;
        await Tone.start();

        this.synth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'triangle' },
            envelope: { attack: 0.02, decay: 0.14, sustain: 0.2, release: 0.4 },
        }).toDestination();

        const events = buildPlaybackEvents(document);
        this.part = new Tone.Part(
            (time, value) => {
                const event = value as PlaybackEvent;
                this.callbacks.onNoteStart?.(event);
                this.synth?.triggerAttackRelease(event.note, event.duration, time);
            },
            events.map((event) => [event.time, event] as [number, PlaybackEvent]),
        );

        const finalEventTime = events.length > 0 ? events[events.length - 1].time + 0.25 : 0;
        if (finalEventTime > 0) {
            Tone.Transport.scheduleOnce(() => {
                this.callbacks.onPlaybackEnded?.();
            }, finalEventTime);
        }

        this.part.start(0);
        Tone.Transport.bpm.value = document.tempo.beatsPerMinute;
        Tone.Transport.start('+0.05');
    }

    public stop(): void {
        if (this.part) {
            this.part.stop();
            this.part.dispose();
            this.part = null;
        }

        if (this.synth) {
            this.synth.dispose();
            this.synth = null;
        }

        Tone.Transport.stop();
        Tone.Transport.cancel(0);
        Tone.Transport.position = 0;
        this.callbacks = {};
    }

    public dispose(): void {
        this.stop();
    }
}
