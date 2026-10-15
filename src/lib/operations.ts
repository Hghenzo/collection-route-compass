import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
export type Shift = 'manha' | 'tarde' | 'noite';
export type PlanningStore = Tables<'planning_stores'>;
export const operationsQuery = queryOptions({queryKey:['operations'],queryFn:async()=>{
 const [stores,plannings,routes,items,settings,profiles,roles,audit]=await Promise.all([
 supabase.from('stores').select('*').order('name'),supabase.from('plannings').select('*').order('collection_date',{ascending:false}),supabase.from('routes').select('*').order('code'),supabase.from('planning_stores').select('*').order('created_at'),supabase.from('operational_settings').select('*').maybeSingle(),supabase.from('profiles').select('*'),supabase.from('user_roles').select('*'),supabase.from('audit_logs').select('*').order('created_at',{ascending:false}).limit(300)]);
 for(const result of [stores,plannings,routes,items,settings,profiles,roles,audit]) if(result.error) throw new Error(result.error.message);
 return {stores:stores.data??[],plannings:plannings.data??[],routes:routes.data??[],items:items.data??[],settings:settings.data,profiles:profiles.data??[],roles:roles.data??[],audit:audit.data??[]};
}});
export function pageHead(title:string,description:string){return {meta:[{title:`${title} | First Mile Control`},{name:'description',content:description},{property:'og:title',content:`${title} | First Mile Control`},{property:'og:description',content:description},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]};}
export function timestamp(value:string){return new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short',timeZone:'America/Sao_Paulo',hour12:false}).format(new Date(value));}
export function operationalAlerts(items:PlanningStore[],routes:Tables<'routes'>[]){
 const alerts:{key:string;label:string;detail:string;critical:boolean}[]=[];
 for(const row of items){
 const add=(key:string,detail:string,critical=false)=>alerts.push({key:`${row.id}-${key}`,label:row.store_name_snapshot,detail,critical});
 if(!row.route_id) add('route',row.volume_class==='alto'?'Crítico: alto volume sem rota. Atribua uma rota.':'Loja sem rota. Atribua uma rota.',row.volume_class==='alto');
 if(row.volume_class==='alto'&&(!row.needs_support||!row.support_type)) add('support','Alto volume sem definição de apoio. Defina o tipo de apoio.');
 if(!row.full_address_snapshot.trim()) add('address','Endereço incompleto. Complete o endereço.');
 if(row.needs_extra_route&&!routes.some(r=>r.id===row.route_id&&r.needs_extra_route&&!r.archived)) add('extra','Rota avulsa pendente. Crie ou atribua uma rota avulsa.');
 if(items.filter(x=>x.store_id===row.store_id).length>1) add('duplicate',`Loja repetida: ${row.duplicate_justification||'verifique a justificativa operacional'}.`);
 if(row.status==='nao_planejada'&&row.route_id) add('pending','Planejamento pendente. Revise e confirme o status.');
 }
 for(const route of routes.filter(r=>!r.archived)){const volume=items.filter(i=>i.route_id===route.id).reduce((s,i)=>s+i.predicted_volume,0);if(route.capacity_packages!==null&&volume>=route.capacity_packages&&volume>0) alerts.push({key:route.id,label:`Rota ${route.code}`,detail:volume>route.capacity_packages?'Sobrecarga. Transfira lojas ou defina apoio.':'Capacidade atingida. Revise o volume antes de confirmar.',critical:volume>route.capacity_packages});}
 return alerts;
}
