import { Fragment, type ReactNode } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { IconButton } from '@/components/ui/icon-button';

/** One control in the rail: a name, the face to draw, and what it does. */
export type ToolRailItem = {
    /** Tooltip text and accessible name. */
    label: string;
    icon: ReactNode;
    onSelect: () => void;
    disabled?: boolean;
};

/** A run of related controls, divided from the run below it. */
export type ToolRailGroup = {
    /** Distinguishes the group's items; never shown. */
    id: string;
    items: ToolRailItem[];
};

/**
 * The tool rail down the left of the document.
 *
 * It knows nothing about the score: the shell hands it groups of controls and
 * this decides only how they are arranged. Icons carry the meaning, so every
 * control names itself on hover and to keyboard and screen reader users. The
 * rail can be put away to give the document the whole window, and a single chip
 * then floats over it to bring the rail back.
 */
export function ToolRail({
    groups,
    open,
    onToggle,
}: {
    groups: ToolRailGroup[];
    open: boolean;
    onToggle: () => void;
}) {
    if (!open) {
        return (
            <div className="absolute left-3 top-3 z-20">
                <IconButton
                    label="Show tools"
                    variant="secondary"
                    onClick={onToggle}
                    className="size-9 shadow-panel"
                >
                    <PanelLeftOpen size={16} strokeWidth={2} />
                </IconButton>
            </div>
        );
    }

    return (
        <aside
            aria-label="Score tools"
            className="z-20 flex w-14 flex-none flex-col items-center gap-0.5 overflow-y-auto border-r border-line bg-paper py-2"
        >
            <IconButton
                label="Hide tools"
                onClick={onToggle}
                className="size-9 text-ink-muted hover:text-ink"
            >
                <PanelLeftClose size={16} strokeWidth={2} />
            </IconButton>
            {groups.map((group) => (
                <Fragment key={group.id}>
                    <span className="my-1.5 h-px w-6 flex-none bg-line" aria-hidden="true" />
                    {group.items.map((item) => (
                        <IconButton
                            key={item.label}
                            label={item.label}
                            onClick={item.onSelect}
                            disabled={item.disabled}
                            className="size-9 text-ink-muted hover:text-ink"
                        >
                            {item.icon}
                        </IconButton>
                    ))}
                </Fragment>
            ))}
        </aside>
    );
}
