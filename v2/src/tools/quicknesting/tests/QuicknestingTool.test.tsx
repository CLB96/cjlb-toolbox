import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { __resetI18nForTests } from '../../../i18n/useI18n'
import QuicknestingTool from '../QuicknestingTool'
import { drawing, lwpolyline } from './dxfBuilder'

const square = (x: number, s: number) => lwpolyline([[x, 0], [x + s, 0], [x + s, s], [x, s]], true, 'cut')

function dxfFile(name = 'piezas.dxf') {
  const text = new TextDecoder().decode(drawing([square(0, 10), square(50, 40)]))
  return new File([text], name, { type: 'application/dxf' })
}

async function loadAndConfirm(u: ReturnType<typeof userEvent.setup>) {
  const input = document.querySelector('input[type=file]') as HTMLInputElement
  await u.upload(input, dxfFile())
  await screen.findByText('DXF leído. Revisa los avisos, la escala y los contornos antes de calcular.')
}

describe('Quick Nesting en el toolbox', () => {
  beforeEach(() => {
    localStorage.clear()
    __resetI18nForTests()
  })

  it('arranca con los textos originales y sin controles propios de idioma o tema', () => {
    render(<QuicknestingTool toolId="quicknesting" active />)
    expect(screen.getByRole('heading', { name: 'Quick Nesting' })).toBeInTheDocument()
    expect(screen.getByText('Configura el tendido, carga un DXF y revisa sus contornos.')).toBeInTheDocument()
    expect(screen.getByLabelText('Ancho de rollo · mm')).toHaveValue(1450)
    expect(screen.queryByText('Procesamiento local')).toBeNull()
    expect(screen.queryByRole('button', { name: /tema/i })).toBeNull()
  })

  it('importa, selecciona, confirma y genera un acomodo automático', async () => {
    const u = userEvent.setup()
    render(<QuicknestingTool toolId="quicknesting" active />)
    await loadAndConfirm(u)
    expect(screen.getByText('piezas.dxf')).toBeInTheDocument()
    await u.click(screen.getByRole('checkbox', { name: /c1/ }))
    await u.click(screen.getByRole('button', { name: 'Generar acomodo' }))
    expect(screen.getByText('Confirma primero la escala y las piezas seleccionadas.')).toBeInTheDocument()
    await u.click(screen.getByRole('checkbox', { name: /Verifiqué las dimensiones/ }))
    await u.clear(screen.getByLabelText('Ancho de rollo · mm'))
    await u.type(screen.getByLabelText('Ancho de rollo · mm'), '22')
    await u.clear(screen.getByLabelText('Largo de tendido · mm'))
    await u.type(screen.getByLabelText('Largo de tendido · mm'), '22')
    await u.clear(screen.getByLabelText('Separación entre cortes · mm'))
    await u.type(screen.getByLabelText('Separación entre cortes · mm'), '2')
    await u.click(screen.getByRole('button', { name: 'Generar acomodo' }))
    await waitFor(() => expect(screen.getByText('Acomodo calculado por capa')).toBeInTheDocument())
    expect(screen.getByText('Piezas por capa').previousSibling).toHaveTextContent('4')
    expect(screen.getAllByText('Búsqueda terminada: no se encontró otra posición con esta heurística. No demuestra un óptimo global.').length).toBeGreaterThan(0)
    expect(document.querySelectorAll('svg polygon')).toHaveLength(4)
  })

  it('cambiar un ajuste invalida el resultado', async () => {
    const u = userEvent.setup()
    render(<QuicknestingTool toolId="quicknesting" active />)
    await loadAndConfirm(u)
    await u.click(screen.getByRole('checkbox', { name: /c1/ }))
    await u.click(screen.getByRole('checkbox', { name: /Verifiqué las dimensiones/ }))
    await u.click(screen.getByRole('button', { name: 'Generar acomodo' }))
    await screen.findByText('Acomodo calculado por capa')
    await u.type(screen.getByLabelText('Separación entre cortes · mm'), '1')
    expect(screen.queryByText('Acomodo calculado por capa')).toBeNull()
    expect(screen.getByText('La configuración cambió. Genera un nuevo acomodo para obtener resultados vigentes.')).toBeInTheDocument()
  })

  it('el diagnóstico empieza cerrado y vuelve a cerrarse en cada importación', async () => {
    const u = userEvent.setup()
    render(<QuicknestingTool toolId="quicknesting" active />)
    await loadAndConfirm(u)
    const summary = screen.getByText('Diagnóstico de importación')
    expect(summary.closest('details')).not.toHaveAttribute('open')
    await u.click(summary)
    expect(screen.getByText('Diagnóstico de importación').closest('details')).toHaveAttribute('open')
    await u.upload(document.querySelector('input[type=file]') as HTMLInputElement, dxfFile('otro.dxf'))
    await screen.findByText('otro.dxf')
    await waitFor(() => expect(screen.getByText('Diagnóstico de importación').closest('details')).not.toHaveAttribute('open'))
  })

  it('manual con varias capas muestra el plan y el grupo parcial', async () => {
    const u = userEvent.setup()
    render(<QuicknestingTool toolId="quicknesting" active />)
    await loadAndConfirm(u)
    await u.click(screen.getByRole('checkbox', { name: /c1/ }))
    await u.click(screen.getByRole('checkbox', { name: /Verifiqué las dimensiones/ }))
    await u.click(screen.getByRole('radio', { name: 'Manual · indicar cantidad' }))
    expect(screen.getByText('Se calcula según la cantidad')).toBeInTheDocument()
    await u.click(screen.getByRole('checkbox', { name: /varias capas de largo fijo/ }))
    for (const [label, value] of [['Ancho de rollo · mm', '22'], ['Largo físico de cada capa · mm', '22'], ['Separación entre cortes · mm', '2'], ['Cantidad total por patrón', '5']]) {
      await u.clear(screen.getByLabelText(label))
      await u.type(screen.getByLabelText(label), value)
    }
    await u.click(screen.getByRole('button', { name: 'Generar acomodo' }))
    await screen.findByText('Plan de capas')
    expect(screen.getByText('5 / 5 piezas · 2 capas (1 completas + 1 parciales) · 0.044 m de tela')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Parcial · 1 capa · corte separado · c1' })).toBeInTheDocument()
    await u.selectOptions(screen.getByLabelText('Acomodo que se muestra'), 'g1')
    expect(document.querySelectorAll('svg polygon')).toHaveLength(1)
  })

  it('rechaza archivos que no son DXF', async () => {
    const u = userEvent.setup({ applyAccept: false })
    render(<QuicknestingTool toolId="quicknesting" active />)
    await u.upload(document.querySelector('input[type=file]') as HTMLInputElement, new File(['x'], 'datos.txt'))
    expect(screen.getByText('Elige un archivo DXF de hasta 8 MB.')).toBeInTheDocument()
  })
})
