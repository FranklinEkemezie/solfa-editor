import { useEffect } from 'react';

export type ToastMessage = { id: number; tone: 'info' | 'warning'; message: string };

export function ToastViewport({
    messages,
    dismiss,
}: {
    messages: ToastMessage[];
    dismiss: (id: number) => void;
}) {
    useEffect(() => {
        if (messages.length === 0) return undefined;
        const timeout = window.setTimeout(() => dismiss(messages[0].id), 3600);
        return () => window.clearTimeout(timeout);
    }, [dismiss, messages]);

    return (
        <div className="toast-viewport" aria-live="polite">
            {messages.map((toast) => (
                <button
                    key={toast.id}
                    className={`toast toast-${toast.tone}`}
                    onClick={() => dismiss(toast.id)}
                >
                    <span className="toast-dot" />
                    {toast.message}
                </button>
            ))}
        </div>
    );
}
