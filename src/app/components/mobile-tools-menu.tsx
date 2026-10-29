import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { ToolRailGroup } from '@/app/components/tool-rail';
import { cn } from '@/lib/utils';

/**
 * The tool rail, folded into a menu for narrow screens.
 *
 * A fixed rail costs a phone more width than it can spare, so the same groups
 * are offered as a sheet from the header. The items are the rail's items; the
 * only difference is that they carry their names as well as their icons.
 */
export function MobileToolsMenu({
    groups,
    open,
    onOpenChange,
}: {
    groups: ToolRailGroup[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                aria-describedby={undefined}
                className="w-[min(24rem,calc(100vw-2rem))] gap-3 p-5"
            >
                <DialogHeader>
                    <DialogTitle>Tools</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4">
                    {groups.map((group) => (
                        <section key={group.id} className="grid gap-1.5">
                            <h3 className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
                                {group.label}
                            </h3>
                            <div className="grid grid-cols-2 gap-1.5">
                                {group.items.map((item) => (
                                    <button
                                        key={item.label}
                                        type="button"
                                        disabled={item.disabled}
                                        onClick={() => {
                                            onOpenChange(false);
                                            item.onSelect();
                                        }}
                                        className={cn(
                                            'flex min-h-11 items-center gap-2 rounded-md border border-line bg-paper px-2.5 py-2 text-left text-sm text-ink transition',
                                            'hover:bg-green-wash/60 disabled:opacity-40',
                                        )}
                                    >
                                        <span className="shrink-0 text-ink-muted">{item.icon}</span>
                                        <span className="min-w-0 truncate">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
