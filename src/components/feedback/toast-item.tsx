import type { ToastMessage } from '@/components/feedback/toast-message';

const TONE_BORDER: Record<ToastMessage['tone'], string> = {
    info: 'border-line',
    warning: 'border-amber',
};

const TONE_DOT: Record<ToastMessage['tone'], string> = {
    info: 'bg-green',
    warning: 'bg-amber',
};

export function ToastItem({
    toast,
    onDismiss,
}: {
    toast: ToastMessage;
    onDismiss: (id: number) => void;
}) {
    return (
        <button
            type="button"
            className={`flex items-center gap-2 rounded-md border bg-paper px-3 py-2 text-left text-sm text-ink shadow-toast ${TONE_BORDER[toast.tone]}`}
            onClick={() => onDismiss(toast.id)}
        >
            <span className={`h-2 w-2 shrink-0 rounded-full ${TONE_DOT[toast.tone]}`} />
            {toast.message}
        </button>
    );
}
