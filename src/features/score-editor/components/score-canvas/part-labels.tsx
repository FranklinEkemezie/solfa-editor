import { PARTS } from '@/domain/music';
import { PartLabelMenu } from '@/features/score-editor/components/score-canvas/part-label-menu';
import { PART_LABEL_WIDTH_PX } from '@/features/score-editor/layout/page-geometry';
import type { ScoreView } from '@/features/score-editor/model/score-view';

/**
 * The part names at the head of a system.
 *
 * The same abbreviations the score uses are set against every system, in one
 * fixed column, so the four rows can be read at a glance from any system. Each
 * name is also the way into that part's own actions, such as its lyric line.
 */
export function PartLabels({ view }: { view: ScoreView }) {
    return (
        <div className="shrink-0" style={{ width: PART_LABEL_WIDTH_PX }}>
            {PARTS.map((part) => (
                <PartLabelMenu
                    key={part.id}
                    part={part}
                    hasLyrics={view.parts[part.id].hasLyrics}
                />
            ))}
        </div>
    );
}
