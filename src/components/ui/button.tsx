import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'icon' | 'danger';
};

export function Button({ children, variant = 'secondary', className = '', ...props }: ButtonProps) {
  return (
    <button className={`ui-button ui-button-${variant} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
