import { gloriaJudeNnam } from '@/features/score-editor/presets/gloria-jude-nnam';
import { hallelujahChorus } from '@/features/score-editor/presets/hallelujah-chorus';
import {
    presetDocument,
    ScorePresetError,
    type ScorePreset,
} from '@/features/score-editor/presets/score-preset';

/**
 * The score the editor opens with.
 *
 * The editor opens blank, on an untitled score with four silent measures. The
 * samples are kept beside this switch rather than deleted: point it at
 * `hallelujahChorus` or `gloriaJudeNnam` to open on one of them again, and
 * nothing else needs to change.
 */
export const ACTIVE_PRESET: ScorePreset | null = null;

export { gloriaJudeNnam, hallelujahChorus, presetDocument, ScorePresetError };
export type { ScorePreset };
