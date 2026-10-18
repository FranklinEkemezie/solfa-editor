import { PARTS } from '@/domain/music';

export function PartLabels() {
    return (
        <div className="w-[84px] shrink-0 pt-7">
            {PARTS.map((part) => (
                <div
                    key={part.id}
                    className="flex h-[52px] items-center font-serif text-[15px] font-bold text-green-dark"
                    title={part.label}
                >
                    {part.shortLabel}
                    <span className="ml-2 text-[11px] font-normal text-muted">{part.label}</span>
                </div>
            ))}
        </div>
    );
}
