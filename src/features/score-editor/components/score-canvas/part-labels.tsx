import { PARTS } from '@/domain/music';

export function PartLabels() {
    return (
        <div className="w-[52px] shrink-0 pt-7 sm:w-[84px]">
            {PARTS.map((part) => (
                <div
                    key={part.id}
                    className="flex h-[52px] items-center font-serif text-[15px] font-bold text-green-dark"
                    title={part.label}
                >
                    {part.shortLabel}
                    <span className="ml-2 hidden text-[11px] font-normal text-muted sm:inline">
                        {part.label}
                    </span>
                </div>
            ))}
        </div>
    );
}
