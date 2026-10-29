import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ComponentPropsWithoutRef, ElementRef, HTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogPortal = DialogPrimitive.Portal;

export const DialogOverlay = forwardRef<
    ElementRef<typeof DialogPrimitive.Overlay>,
    ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Overlay
        ref={ref}
        className={cn(
            'fixed inset-0 z-[80] bg-black/35 p-4 backdrop-blur-[1px] print:hidden',
            className,
        )}
        {...props}
    />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

export const DialogContent = forwardRef<
    ElementRef<typeof DialogPrimitive.Content>,
    ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
    <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
            ref={ref}
            className={cn(
                'fixed left-1/2 top-1/2 z-[90] grid w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2',
                'max-h-[calc(100dvh-2rem)] gap-4 overflow-y-auto rounded-lg border border-line bg-paper p-6',
                'text-ink shadow-panel outline-none print:hidden',
                className,
            )}
            {...props}
        >
            {children}
            <DialogPrimitive.Close
                aria-label="Close"
                className="absolute right-4 top-4 rounded-sm p-1 text-muted transition-colors hover:bg-green-wash hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/30"
            >
                <X className="h-4 w-4" />
            </DialogPrimitive.Close>
        </DialogPrimitive.Content>
    </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

export function DialogHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div className={cn('flex flex-col gap-1.5 pr-6', className)} {...props} />;
}

export function DialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn('mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
            {...props}
        />
    );
}

export const DialogTitle = forwardRef<
    ElementRef<typeof DialogPrimitive.Title>,
    ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Title
        ref={ref}
        className={cn('font-serif text-xl font-semibold leading-tight text-ink', className)}
        {...props}
    />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

export const DialogDescription = forwardRef<
    ElementRef<typeof DialogPrimitive.Description>,
    ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Description
        ref={ref}
        className={cn('text-sm leading-relaxed text-ink-muted', className)}
        {...props}
    />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;
