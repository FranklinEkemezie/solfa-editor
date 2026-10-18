import { useCallback, useState } from 'react';
import type { ToastMessage, ToastTone } from '@/components/feedback/toast-message';

const MAX_VISIBLE_TOASTS = 3;

export function useToasts() {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const addToast = useCallback((message: string, tone: ToastTone = 'warning') => {
        setToasts((current) => {
            if (current.some((toast) => toast.message === message)) return current;
            return [...current.slice(-(MAX_VISIBLE_TOASTS - 1)), { id: Date.now(), tone, message }];
        });
    }, []);

    const dismiss = useCallback((id: number) => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
    }, []);

    return { toasts, addToast, dismiss };
}
