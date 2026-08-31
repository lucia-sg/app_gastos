import { state } from './state.js';
import { FUND_PALETTE } from './icons.js';

export function getCategory(id){ return state.categories.find(c=>c.id===id); }
export function getArea(id){ return state.areas.find(a=>a.id===id); }
export function getFund(id){ return state.funds.find(f=>f.id===id); }
export function fundColor(fund){
  const idx = state.funds.findIndex(f=>f.id===fund.id);
  return FUND_PALETTE[idx % FUND_PALETTE.length];
}

export function expensesForMonth(ym){
  return state.expenses.filter(e=>e.date.slice(0,7)===ym);
}
export function aportacionesForMonth(ym){
  return state.movements.filter(m=>m.type==='aportacion' && m.date.slice(0,7)===ym);
}
export function categorySpent(catId, ym){
  if(catId==='inversion'){
    return aportacionesForMonth(ym).reduce((s,m)=>s+m.amount,0);
  }
  return expensesForMonth(ym).filter(e=>e.category===catId).reduce((s,e)=>s+e.amount,0);
}
export function categoryBudget(catId){
  const cat = getCategory(catId);
  return (state.income * (cat.percent/100)) || 0;
}

export function totalAportado(fundId){
  return state.movements.filter(m=>m.fundId===fundId && m.type==='aportacion').reduce((s,m)=>s+m.amount,0);
}
export function lastValor(fundId){
  const vals = state.movements.filter(m=>m.fundId===fundId && m.type==='valor').sort((a,b)=>a.date.localeCompare(b.date));
  return vals.length ? vals[vals.length-1].amount : null;
}
