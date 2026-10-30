import type { ElementType, HTMLAttributes } from 'react'

type Props = HTMLAttributes<HTMLElement> & {
  as?: ElementType
  dense?: boolean
}

export function GlassPanel({ as: Tag = 'div', dense = false, className = '', ...rest }: Props) {
  const cls = ['glass', dense ? 'glass--dense' : '', className].filter(Boolean).join(' ')
  return <Tag className={cls} {...rest} />
}
