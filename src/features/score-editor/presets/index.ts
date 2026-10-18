import { gloriaJudeNnam } from '@/features/score-editor/presets/gloria-jude-nnam';
import { hallelujahChorus } from '@/features/score-editor/presets/hallelujah-chorus';
import {
    parseScorePreset,
    ScorePresetError,
    type ScorePreset,
} from '@/features/score-editor/presets/score-preset';

/**
 * The score the editor opens with.
 *
 * Swap the sample by pointing this at another preset — `gloriaJudeNnam` is
 * kept alongside the default for exactly that — and start from the empty
 * default (an untitled score with two silent measures) by commenting the line
 * out. Nothing else needs to change either way.
 */
export const ACTIVE_PRESET: ScorePreset | null = hallelujahChorus;

export { gloriaJudeNnam, hallelujahChorus, parseScorePreset, ScorePresetError };
export type { ScorePreset };
