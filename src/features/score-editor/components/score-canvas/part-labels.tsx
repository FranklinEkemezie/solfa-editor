import { PARTS } from '@/domain/music';
import {
    PART_LABEL_WIDTH_PX,
    PART_ROW_HEIGHT_PX,
} from '@/features/score-editor/layout/page-geometry';

/**
 * The part names at the head of a system.
 *
 * The same abbreviations the score uses are set against every system, in one
 * fixed column, so the four rows can be read at a glance from any system.
 */
export function PartLabels() {
    return (
        <div className="shrink-0" style={{ width: PART_LABEL_WIDTH_PX }}>
            {PARTS.map((part) => (
                <div
                    key={part.id}
                    className="flex items-center font-serif text-[13px] font-bold text-green-dark"
                    style={{ height: PART_ROW_HEIGHT_PX }}
                    title={part.label}
                >
                    {part.shortLabel}
                </div>
            ))}
        </div>
    );
}
