export const BUTTON_VARIANTS = {
    primary: 'bg-primary text-on-primary hover:bg-primary/90',
    secondary: 'border border-line bg-paper text-ink hover:bg-green-wash/60',
    ghost: 'bg-transparent text-ink hover:bg-green-wash/60',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    icon: 'bg-transparent p-1 text-ink hover:bg-green-wash/60',
} as const;

export const BUTTON_SIZES = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-3 py-2 text-base',
    lg: 'px-4 py-3 text-lg',
} as const;

export type ButtonVariant = keyof typeof BUTTON_VARIANTS;
export type ButtonSize = keyof typeof BUTTON_SIZES;
