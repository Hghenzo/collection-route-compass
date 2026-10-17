import * as XLSX from 'xlsx';
import type { Tables } from '@/integrations/supabase/types';
export const importFields=[['store_code','ID da loja'],['name','Nome'],['full_address','Endereço'],['street','Rua'],['street_number','Número'],['region','Região'],['city','Cidade'],['route','Rota'],['predicted_volume','Volume'],['notes','Observações']] as const;
export type ImportRow=Record<(typeof importFields)[number][0],string>;
const aliases:Record<string,string[]>= {store_code:['id','id da loja','codigo','codigo da loja','store code'],name:['loja','nome','nome da loja'],full_address:['endereco','endereco completo'],street:['rua','logradouro'],street_number:['numero'],region:['regiao','bairro'],city:['cidade'],route:['rota','rota atribuida'],predicted_volume:['volume','pacotes','volume previsto','volume previsto de pacotes'],notes:['observacoes','obs']};
export function normalize(value:string){return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/_/g,' ').trim();}
export function inferMapping(headers:string[]){return Object.fromEntries(importFields.map(([field])=>[field,headers.find(h=>aliases[field]?.includes(normalize(h)))??''])) as Record<keyof ImportRow,string>;}
export function validateImport(rows:ImportRow[]){const seen=new Set<string>();return rows.map(row=>{const errors:string[]=[];if(!row.store_code.trim())errors.push('ID obrigatório');if(!row.name.trim())errors.push('Nome obrigatório');if(seen.has(row.store_code.trim())) errors.push('ID repetido');seen.add(row.store_code.trim());if(row.predicted_volume!==''&&(!/^\d+$/.test(row.predicted_volume)||Number(row.predicted_volume)>2147483647)) errors.push('Volume inteiro e não negativo');return errors;});}
export function planningExportRows(rows: Tables<'planning_stores'>[], planning: Pick<Tables<'plannings'>, 'collection_date' | 'shift'>, routes: {id: string; code: string}[]) {
 return rows.map(row => ({...row, collection_date: planning.collection_date, shift: planning.shift, route_code: routes.find(route => route.id === row.route_id)?.code ?? ''}));
}
export function exportWorkbook(rows:Record<string,unknown>[]){
 const safe=rows.map(row=>Object.fromEntries(Object.entries(row).map(([k,v])=>[k,typeof v==='string'&&/^[=+\-@]/.test(v)?`'${v}`:v])));
 const book=XLSX.utils.book_new();XLSX.utils.book_append_sheet(book,XLSX.utils.json_to_sheet(safe),'Planejamento');return book;
}
export function sheetDownload(filename:string,rows:Record<string,unknown>[],format:'xlsx'|'csv'='xlsx'){
 const book=exportWorkbook(rows);
 if(format==='xlsx'){XLSX.writeFile(book,`${filename}.xlsx`,{bookType:'xlsx'});return;}
 const sheet=book.Sheets['Planejamento'];
 if(!sheet)return;
 const csv=XLSX.utils.sheet_to_csv(sheet,{FS:';',forceQuotes:true});
 const url=URL.createObjectURL(new Blob(['\uFEFF',csv],{type:'text/csv;charset=utf-8'}));
 const anchor=document.createElement('a');anchor.href=url;anchor.download=`${filename}.csv`;anchor.click();
 setTimeout(()=>URL.revokeObjectURL(url),0);
}
export async function readSheet(file:File){const bytes=await file.arrayBuffer();const book=/\.csv$/i.test(file.name)?XLSX.read(new TextDecoder('utf-8').decode(bytes),{type:'string',raw:true}):XLSX.read(bytes,{type:'array'});const name=book.SheetNames[0];if(!name)throw new Error('Arquivo sem planilha');const sheet=book.Sheets[name];if(!sheet)throw new Error('Planilha não encontrada');return XLSX.utils.sheet_to_json<Record<string,string>>(sheet,{defval:'',raw:false});}
