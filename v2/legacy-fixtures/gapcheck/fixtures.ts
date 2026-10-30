// Fixtures sintéticas para pruebas diferenciales (formato sheet_to_json header:1, defval:null).

const plain: unknown[][] = Array.from({ length: 10 }, (_, r) =>
  Array.from({ length: 20 }, (_, c) => Math.round((1 + ((r * 7 + c * 3) % 17) / 10) * 100) / 100),
)

export const FIXTURES: Record<string, unknown[][]> = {
  plain,
  header: [
    ['A1', ' B2 ', null, 'D4'],
    [1.5, 2.5, 3.5, 4.5],
    [1.7, 2.1, 9, 4.2],
    [2, 2.2, null, 4.9],
  ],
  ragged: [[1, 2, 3], [4], [], [5, 6]],
  numericStrings: [
    [1, 1, 1, 1],
    ['2,5', ' 3.2 ', '12abc', 'abc'],
    [' 3.2 ', '2,5', 'x', '  '],
    ['12abc', '', 7, 'abc'],
  ],
  blanks: [
    [1, null, 3],
    [null, null, 4],
    [2, null, null],
    [null, null, 5],
  ],
  numericHeader: [
    [1, 2, 3],
    [1.1, 2.2, 3.3],
    [1.4, 2.5, 3.1],
  ],
  single: [[1.7]],
  textOnlyColumn: [
    ['N', 'T'],
    [1, 'foo'],
    [2, 'bar'],
  ],
  empty: [],
}
