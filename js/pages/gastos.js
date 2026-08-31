import { ICONS } from '../icons.js';
import { state } from '../state.js';
import { uiState, toast } from '../ui.js';
import { money, dateLabel, shiftYM, ymLabel } from '../format.js';
import { expensesForMonth } from '../selectors.js';
import { listItemHTML, deleteExpense } from './inicio.js';

export function renderGastos(){
  const el = document.getElementById('gastosContent');
  const ym = uiState.selectedMonth;
  let html = '';
  html += `<div class="month-switch">
    <button id="mPrevG">${ICONS.chevL}</button>
    <div class="label">${ymLabel(ym)}</div>
    <button id="mNextG">${ICONS.chevR}</button>
  </div>`;

  html += `<div class="chip-row" id="chipRow">
    <button class="chip ${uiState.expenseFilter==='all'?'active':''}" data-cat="all">Todas</button>
    ${state.categories.filter(c=>c.id!=='inversion').map(c=>`<button class="chip ${uiState.expenseFilter===c.id?'active':''}" data-cat="${c.id}">${c.name}</button>`).join('')}
  </div>`;

  let list = expensesForMonth(ym);
  if(uiState.expenseFilter!=='all') list = list.filter(e=>e.category===uiState.expenseFilter);
  list = list.slice().sort((a,b)=> b.date.localeCompare(a.date) || (b.createdAt-a.createdAt));

  const totalShown = list.reduce((s,e)=>s+e.amount,0);
  html += `<div class="section-head" style="margin-top:16px;"><h2>Gastos</h2><span class="pill" style="background:var(--surface-2); color:var(--ink-soft);">${money(totalShown)}</span></div>`;

  if(list.length===0){
    html += `<div class="card"><div class="empty">
      <div class="glyph">${ICONS.receipt}</div>
      <div class="msg">No hay gastos que coincidan aquí todavía.<br>Pulsa el botón <b>+</b> para añadir el primero.</div>
    </div></div>`;
  } else {
    const groups = {};
    list.forEach(e=>{ (groups[e.date] = groups[e.date]||[]).push(e); });
    Object.keys(groups).sort((a,b)=>b.localeCompare(a)).forEach(date=>{
      html += `<div class="day-group"><div class="day-label">${dateLabel(date)}</div><div class="card"><div class="list">`;
      html += groups[date].map(e=>listItemHTML(e)).join('');
      html += `</div></div></div>`;
    });
  }

  el.innerHTML = html;

  document.getElementById('mPrevG').addEventListener('click', ()=>{ uiState.selectedMonth = shiftYM(uiState.selectedMonth,-1); renderGastos(); });
  document.getElementById('mNextG').addEventListener('click', ()=>{ uiState.selectedMonth = shiftYM(uiState.selectedMonth,1); renderGastos(); });
  document.querySelectorAll('#chipRow .chip').forEach(c=>c.addEventListener('click', ()=>{ uiState.expenseFilter = c.dataset.cat; renderGastos(); }));
  document.querySelectorAll('[data-del-expense]').forEach(b=>{
    b.addEventListener('click', ()=>{ deleteExpense(b.dataset.delExpense); });
  });
}
