import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export function MetadataToggle({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
    return (
        <button
            type="button"
            className="inline-flex items-center gap-2 border border-line rounded-full text-green-dark px-3 h-9"
            onClick={onToggle}
            aria-label={isOpen ? 'Hide score details' : 'Show score details'}
        >
            {isOpen ? (
                <PanelLeftClose size={16} strokeWidth={2} />
            ) : (
                <PanelLeftOpen size={16} strokeWidth={2} />
            )}
            <span>{isOpen ? 'Hide' : 'Details'}</span>
        </button>
    );
}
