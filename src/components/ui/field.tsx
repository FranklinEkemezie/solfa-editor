import type { InputHTMLAttributes, SelectHTMLAttributes } from 'react';

type LabelProps = { label: string; hint?: string; children: React.ReactNode };

export function Field({ label, hint, children }: LabelProps) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}

export function TextField(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="text-field" {...props} />;
}

export function SelectField(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="text-field select-field" {...props} />;
}
