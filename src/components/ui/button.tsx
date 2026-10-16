import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'ghost' | 'icon' | 'danger';
    size?: 'sm' | 'md' | 'lg';
};

export function Button({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    ...rest
}: ButtonProps) {
    const variants: Record<string, string> = {
        primary: 'bg-green-dark text-white hover:bg-green-dark/90',
        secondary: 'bg-white border border-line text-ink hover:bg-gray-50',
        ghost: 'bg-transparent text-ink hover:bg-gray-100',
        danger: 'bg-red-600 text-white hover:bg-red-700',
        icon: 'bg-transparent p-1 text-ink hover:bg-gray-100',
    };

    const sizes: Record<string, string> = {
        sm: 'px-2 py-1 text-sm',
        md: 'px-3 py-2 text-base',
        lg: 'px-4 py-3 text-lg',
    };

    const classes = `inline-flex items-center justify-center rounded-md transition ${variants[variant]} ${sizes[size]} ${className}`;

    return (
        <button className={classes} {...rest}>
            {children}
        </button>
    );
}
