import type { ToastMessage } from '@/components/feedback/toast-message';

export function ToastItem({
    toast,
    onDismiss,
}: {
    toast: ToastMessage;
    onDismiss: (id: number) => void;
}) {
    return (
        <button className={`toast toast-${toast.tone}`} onClick={() => onDismiss(toast.id)}>
            <span className="toast-dot" />
            {toast.message}
        </button>
    );
}
