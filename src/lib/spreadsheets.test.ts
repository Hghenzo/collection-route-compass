import { afterEach, describe, expect, it, vi } from 'vitest';
import * as XLSX from 'xlsx';
import type { Tables } from '@/integrations/supabase/types';
import { exportWorkbook, planningExportRows, sheetDownload } from './spreadsheets';

vi.mock('xlsx', async (importOriginal) => {
 const actual = await importOriginal<typeof XLSX>();
 return {...actual, writeFile: vi.fn()};
});

const row: Tables<'planning_stores'> = {
 id: 'record-1', planning_id: 'planning-1', store_id: 'store-1',
 store_code_snapshot: '00042', store_name_snapshot: 'Loja de teste',
 full_address_snapshot: 'Rua São João, 10; sala "A"', region_snapshot: 'Centro',
 route_id: 'route-1', predicted_volume: 125, volume_class: 'alto',
 needs_extra_route: true, needs_support: true, support_type: 'equipe_adicional',
 priority: 'critica', status: 'confirmada', notes: 'Primeira linha\nSegunda linha',
 duplicate_justification: 'Coleta adicional', created_at: '2026-10-16T04:00:00Z',
 updated_at: '2026-10-16T04:05:00Z', created_by: 'creator-1', updated_by: 'editor-1',
};
const planning = {collection_date: '2026-10-16', shift: 'noite' as const};
const routes = [{id: 'route-1', code: 'R-01'}];

afterEach(() => vi.restoreAllMocks());

describe('Planning spreadsheet exports', () => {
 it('preserves every stored planning field, date, shift and route code in Excel', () => {
  const records = planningExportRows([row], planning, routes);
  const output = XLSX.write(exportWorkbook(records), {type: 'array', bookType: 'xlsx'});
  const restored = XLSX.read(output, {type: 'array'});
  const sheet = restored.Sheets['Planejamento'];
  if (!sheet) throw new Error('Missing exported sheet');
  expect(XLSX.utils.sheet_to_json(sheet)).toEqual([{...row, ...planning, route_code: 'R-01'}]);
 });

 it('uses valid Excel writing options and downloads the expected file', () => {
  const writeFile = vi.mocked(XLSX.writeFile);
  sheetDownload('planejamento', planningExportRows([row], planning, routes));
  expect(writeFile).toHaveBeenCalledWith(expect.anything(), 'planejamento.xlsx', {bookType: 'xlsx'});
 });

 it('downloads semicolon CSV with BOM, quoted text and every field intact', async () => {
  let exported: Blob | undefined;
  Object.defineProperty(URL, 'createObjectURL', {configurable: true, value: vi.fn((blob: Blob) => {exported = blob; return 'blob:test';})});
  Object.defineProperty(URL, 'revokeObjectURL', {configurable: true, value: vi.fn()});
  let filename = '';
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {filename = this.download;});
  sheetDownload('planejamento', planningExportRows([row], planning, routes), 'csv');
  if (!exported) throw new Error('No CSV download');
  const blob = exported;
  const csv = await new Promise<string>((resolve, reject) => {
   const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsText(blob);
  });
  expect(filename).toBe('planejamento.csv');
  expect(csv).toContain('"id";"planning_id"');
  expect(csv).toContain('"Rua São João, 10; sala ""A"""');
  const restored = XLSX.read(csv, {type: 'string', raw: true, FS: ';'});
  const sheet = restored.Sheets[restored.SheetNames[0] ?? ''];
  if (!sheet) throw new Error('Missing CSV sheet');
  const [record] = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {defval: ''});
  const expected = {...row, ...planning, route_code: 'R-01'};
  expect(record).toEqual(Object.fromEntries(Object.entries(expected).map(([key, value]) => [key, typeof value === 'boolean' ? String(value).toUpperCase() : String(value)])));
 });

 it('keeps unassigned values and only exports the supplied filtered rows', () => {
  const unassigned = {...row, route_id: null, support_type: null, volume_class: null, duplicate_justification: null, predicted_volume: 0, needs_support: false};
  expect(planningExportRows([unassigned], planning, routes)).toEqual([{...unassigned, ...planning, route_code: ''}]);
  expect(planningExportRows([], planning, routes)).toEqual([]);
 });

 it('exports formula-like text as safe literal strings', () => {
  const book = exportWorkbook([{notes: '=SUM(A1:A2)', name: '+test', address: '@test'}]);
  const sheet = book.Sheets['Planejamento'];
  if (!sheet) throw new Error('Missing sheet');
  expect(XLSX.utils.sheet_to_json(sheet)).toEqual([{notes: "'=SUM(A1:A2)", name: "'+test", address: "'@test"}]);
  expect(sheet['A2'].f).toBeUndefined();
 });
});