import { NoteValue } from '@/domain/note-value';
import { PARTS, type PartId } from '@/domain/parts';
import { emptyVoices, type ScoreDocument } from '@/domain/score-document';
import { Tempo } from '@/domain/tempo';
import { VOICE_SETTINGS } from '@/domain/voice';
import { parseVoice } from '@/features/notation/notation-engine';
import {
    keyFromOptionValue,
    timeSignatureFromOptionValue,
} from '@/features/score-editor/adapters/metadata-options';

/**
 * A sample score, written in the same language the editor edits.
 *
 * A preset is only metadata and four notation sources — the very strings a
 * writer would type — so opening a sample and typing into it are the same
 * thing. There is no second representation of the music to keep in step.
 */
export type ScorePreset = {
    title: string;
    subtitle?: string;
    author?: string;
    /** An encoded key, the same form the masthead's key select uses. */
    key: string;
    /** An encoded time signature, the same form the masthead's time select uses. */
    timeSignature: string;
    tempo: { beatsPerMinute: number; description?: string; beatUnit?: NoteValue };
    /** The notation source of each voice. */
    parts: Record<PartId, string>;
    /** A floor, for a sample that wants more blank measures than it writes. */
    measureCount?: number;
};

export class ScorePresetError extends Error {
    public constructor(message: string) {
        super(message);
        this.name = 'ScorePresetError';
    }
}

/** Turn a written preset into the document the editor opens with. */
export function presetDocument(preset: ScorePreset): ScoreDocument {
    const voices = emptyVoices();

    for (const part of PARTS) {
        const source = preset.parts[part.id] ?? '';
        const result = parseVoice(source, VOICE_SETTINGS[part.id]);
        if (!result.ok) {
            const diagnostic = result.diagnostics[0];
            throw new ScorePresetError(
                `${part.label} in “${preset.title}”: ${diagnostic?.message ?? 'the notation could not be read.'}`,
            );
        }
        voices[part.id] = source;
    }

    return {
        title: preset.title,
        subtitle: preset.subtitle ?? '',
        author: preset.author ?? '',
        lyrics: '',
        timeSignature: timeSignatureFromOptionValue(preset.timeSignature),
        key: keyFromOptionValue(preset.key),
        tempo: new Tempo(
            preset.tempo.beatUnit ?? NoteValue.QUARTER,
            preset.tempo.beatsPerMinute,
            preset.tempo.description ?? '',
        ),
        voices,
        measureCount: preset.measureCount ?? 1,
    };
}
