export const STORAGE_KEY = 'finanzas_app_v1';

export function uid(){
  return Math.random().toString(36).slice(2,10) + Date.now().toString(36).slice(-4);
}

export function defaultState(){
  return {
    income: 0,
    categories: [
      { id:'basicos',   name:'Gastos básicos', percent:40 },
      { id:'inversion', name:'Inversión',       percent:15 },
      { id:'educacion', name:'Educación',       percent:10 },
      { id:'lujos',     name:'Lujos',           percent:15 },
      { id:'hormiga',   name:'Gastos hormiga',  percent:20 },
    ],
    areas: [
      { id:uid(), name:'Alquiler',      category:'basicos' },
      { id:uid(), name:'Gasolina',      category:'basicos' },
      { id:uid(), name:'Supermercado',  category:'basicos' },
      { id:uid(), name:'Libros',        category:'educacion' },
      { id:uid(), name:'Cursos',        category:'educacion' },
      { id:uid(), name:'Restaurantes',  category:'lujos' },
      { id:uid(), name:'Skincare',      category:'lujos' },
      { id:uid(), name:'Maquillaje',    category:'lujos' },
      { id:uid(), name:'Fiestas',       category:'lujos' },
      { id:uid(), name:'Regalos',       category:'hormiga' },
      { id:uid(), name:'Ropa',          category:'hormiga' },
      { id:uid(), name:'Suscripciones', category:'hormiga' },
    ],
    expenses: [],
    funds: [],
    movements: [], // {id, fundId, date, type:'aportacion'|'valor', amount}
  };
}

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return defaultState();
    const parsed = JSON.parse(raw);
    if(!parsed.categories || !parsed.areas) return defaultState();
    if(!parsed.funds) parsed.funds = [];
    if(!parsed.movements) parsed.movements = [];
    return parsed;
  }catch(e){ return defaultState(); }
}

export const state = loadState();

export function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Reemplaza el contenido del estado manteniendo la misma referencia,
// para que los módulos que ya importaron `state` vean los datos nuevos.
export function resetState(){
  Object.keys(state).forEach(k => delete state[k]);
  Object.assign(state, defaultState());
  saveState();
}

export function replaceState(data){
  Object.keys(state).forEach(k => delete state[k]);
  Object.assign(state, data);
  if(!state.funds) state.funds = [];
  if(!state.movements) state.movements = [];
  saveState();
}
