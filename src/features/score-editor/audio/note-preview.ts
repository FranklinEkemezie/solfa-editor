/**
 * The quiet note a writer hears while entering music.
 *
 * This is feedback, not playback: one short monophonic tone for the note just
 * written or changed. A new tone cuts the previous one off, so a fast writer
 * hears the latest pitch rather than a cloud of overlapping attacks. The tone
 * is deliberately shorter than a beat and has a soft attack and release, so it
 * does not echo under the next keystroke.
 *
 * The module owns one AudioContext and reuses it. Browsers only allow audio to
 * start from a user gesture; every caller here is a key press, and a blocked
 * context simply means no preview.
 */

type ActiveTone = {
    readonly oscillator: OscillatorNode;
    readonly gain: GainNode;
};

let context: AudioContext | null = null;
let active: ActiveTone | null = null;

const PREVIEW_SECONDS = 0.28;
/**
 * The preview is feedback, not background music, but it still has to be heard
 * over room noise and a phone speaker. This sits around -13 dBFS: clearly
 * present without clipping, and short enough not to fatigue a fast writer.
 */
const PREVIEW_LEVEL = 0.22;

/** Equal-tempered frequency for a MIDI note, with A4 at 440 Hz. */
export function midiToFrequency(midi: number): number {
    return 440 * 2 ** ((midi - 69) / 12);
}

function audioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (context) return context;

    const AudioContextConstructor =
        window.AudioContext ??
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextConstructor) return null;

    try {
        context = new AudioContextConstructor();
    } catch {
        context = null;
    }
    return context;
}

function silence(now: number): void {
    const tone = active;
    active = null;
    if (!tone) return;

    try {
        tone.gain.gain.cancelScheduledValues(now);
        tone.gain.gain.setValueAtTime(Math.max(tone.gain.gain.value, 0.0001), now);
        tone.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);
        tone.oscillator.stop(now + 0.03);
    } catch {
        // The oscillator may already have ended; there is nothing to silence.
    }
}

/** Sound one note, replacing whatever preview was already sounding. */
export function playNotePreview(midi: number): void {
    const audio = audioContext();
    if (!audio) return;

    if (audio.state === 'suspended') void audio.resume().catch(() => undefined);

    const now = audio.currentTime;
    silence(now);

    try {
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();

        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(midiToFrequency(midi), now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(PREVIEW_LEVEL, now + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + PREVIEW_SECONDS);

        oscillator.connect(gain).connect(audio.destination);
        oscillator.start(now);
        oscillator.stop(now + PREVIEW_SECONDS + 0.02);

        active = { oscillator, gain };
        oscillator.onended = () => {
            if (active?.oscillator === oscillator) active = null;
        };
    } catch {
        // Audio feedback is optional and can be blocked by browser policy.
    }
}
