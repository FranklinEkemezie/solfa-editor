import { useEffect } from 'react';
import { ToastItem } from '@/components/feedback/toast-item';
import type { ToastMessage } from '@/components/feedback/toast-message';

const DISMISS_DELAY_MS = 3600;

export function ToastViewport({
    messages,
    dismiss,
}: {
    messages: ToastMessage[];
    dismiss: (id: number) => void;
}) {
    useEffect(() => {
        if (messages.length === 0) return undefined;
        const timeout = window.setTimeout(() => dismiss(messages[0].id), DISMISS_DELAY_MS);
        return () => window.clearTimeout(timeout);
    }, [dismiss, messages]);

    return (
        <div
            className="toast-viewport fixed right-4 top-16 z-[100] flex max-h-[calc(100dvh-5rem)] w-[min(320px,calc(100vw-2rem))] flex-col gap-2 overflow-y-auto"
            aria-live="polite"
        >
            {messages.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
            ))}
        </div>
    );
}
