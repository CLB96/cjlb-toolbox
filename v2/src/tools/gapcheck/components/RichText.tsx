import { Fragment } from 'react'

const STRONG = /<strong>(.*?)<\/strong>/g

/** Pinta los textos del diccionario que llevan `<strong>` como elementos React (sin innerHTML). */
export function RichText({ text }: { text: string }) {
  const parts = text.split(STRONG)
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? <strong key={i}>{part}</strong> : <Fragment key={i}>{part}</Fragment>,
      )}
    </>
  )
}
