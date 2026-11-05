import type { ReactNode } from 'react'
import { useI18n } from '../../../i18n/useI18n'

/** Mismo formato que el original: es-MX / en-US con hasta `digits` decimales. */
export function useQnFormat(): (value: number, digits?: number) => string {
  const { lang } = useI18n()
  const locale = lang === 'es' ? 'es-MX' : 'en-US'
  return (value, digits = 2) => Number(value).toLocaleString(locale, { maximumFractionDigits: digits })
}

interface FieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  step?: string
  min?: string
}

export function NumberField({ label, value, onChange, disabled, step = 'any', min = '0' }: FieldProps) {
  return (
    <label className="qn-field">
      <span>{label}</span>
      <input type="number" inputMode="decimal" step={step} min={min} value={value} disabled={disabled}
        onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}

export function Choice({ children, ...input }: { children: ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="qn-choice">
      <input {...input} />
      <span>{children}</span>
    </label>
  )
}
