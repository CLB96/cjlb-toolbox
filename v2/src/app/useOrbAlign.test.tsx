import { render } from '@testing-library/react'
import { useRef } from 'react'
import { useOrbAlign } from './useOrbAlign'

function Shell({ active, height }: { active: boolean; height: number }) {
  const ref = useRef<HTMLDivElement>(null)
  useOrbAlign(ref, active)
  return (
    <div ref={ref} data-testid="shell">
      <main className="tool-host">
        <div role="tabpanel">
          <header
            className="vz-head"
            ref={(el) => {
              if (el) Object.defineProperty(el, 'offsetHeight', { value: height, configurable: true })
            }}
          />
        </div>
      </main>
    </div>
  )
}

test('centra el círculo con la cabecera de la herramienta', () => {
  const { getByTestId } = render(<Shell active height={64} />)
  expect(getByTestId('shell').style.getPropertyValue('--orb-y')).toBe('24px')
})

test('con una cabecera baja no sube más que el margen mínimo', () => {
  const { getByTestId } = render(<Shell active height={20} />)
  expect(getByTestId('shell').style.getPropertyValue('--orb-y')).toBe('4px')
})

test('sin colapsar no deja variable puesta', () => {
  const { getByTestId } = render(<Shell active={false} height={64} />)
  expect(getByTestId('shell').style.getPropertyValue('--orb-y')).toBe('')
})
