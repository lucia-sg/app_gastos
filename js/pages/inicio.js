import { ICONS, CAT_ICON, CAT_COLOR } from '../icons.js';
import { state, saveState } from '../state.js';
import { uiState, switchPage, renderCurrentPage, toast } from '../ui.js';
import { money, pctFmt, ymLabel, dateLabelShort, escapeHTML, todayYM, shiftYM } from '../format.js';
import { getCategory, categorySpent, categoryBudget, totalAportado, lastValor, expensesForMonth } from '../selectors.js';
import { openIncomeModal } from '../modals.js';

export function renderInicio(){
  const el = document.getElementById('inicioContent');
  const ym = uiState.selectedMonth;
  const isCurrent = ym === todayYM();

  let totalSpent = 0, totalBudget = 0;
  state.categories.forEach(c=>{ totalSpent += categorySpent(c.id, ym); totalBudget += categoryBudget(c.id); });
  const disponible = totalBudget - totalSpent;

  let html = '';
  html += `<div class="month-switch">
    <button id="mPrev">${ICONS.chevL}</button>
    <div>
      <div class="label">${ymLabel(ym)}</div>
      ${!isCurrent?`<div class="jump" id="mJump">Volver a este mes</div>`:''}
    </div>
    <button id="mNext">${ICONS.chevR}</button>
  </div>`;

  if(state.income <= 0){
    html += `<div class="card" style="text-align:center; padding:28px 18px;">
      <div class="empty">
        <div class="glyph">${ICONS.emptyBox}</div>
        <div class="msg">Aún no has configurado tu <b>ingreso mensual</b>.<br>Añádelo para repartir tu dinero entre las cinco categorías.</div>
      </div>
      <button class="btn primary" id="setIncomeBtn" style="margin-top:6px;">Configurar ingreso</button>
    </div>`;
    el.innerHTML = html;
    bindInicioEvents();
    return;
  }

  html += `<div class="hero">
    <div class="eyebrow">Disponible este mes</div>
    <div class="amount">${money(disponible)}</div>
    <div class="sub">
      <span>Presupuestado <b class="num">${money(totalBudget)}</b></span>
      <span>Gastado <b class="num">${money(totalSpent)}</b></span>
    </div>
    <div class="income-edit">
      <span>Nómina ${money(state.income)}</span>
      <button id="editIncomeBtn">${ICONS.pencil} Editar</button>
    </div>
  </div>`;

  html += `<div class="section-head"><h2>Tus categorías</h2></div>`;
  html += `<div class="cat-grid">`;
  state.categories.forEach(cat=>{
    const budget = categoryBudget(cat.id);
    const spent = categorySpent(cat.id, ym);
    const avail = budget - spent;
    const pct = budget>0 ? Math.min(100, (spent/budget)*100) : 0;
    const over = avail < 0;
    const col = CAT_COLOR[cat.id];
    html += `<div class="cat-card">
      <div class="row1">
        <div class="cat-icon" style="background:${col.bg}; color:${col.c};">${ICONS[CAT_ICON[cat.id]]}</div>
        <div class="name">${cat.name}</div>
        <div class="pct">${cat.percent}%</div>
      </div>
      <div class="figures">
        <div>
          <div class="spent" style="text-align:left;">${over?'Excedido en':'Disponible'}</div>
          <div class="avail ${over?'neg':''}">${money(Math.abs(avail))}</div>
        </div>
        <div class="spent">Gastado<br><span class="num">${money(spent)}</span> / ${money(budget)}</div>
      </div>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%; background:${over?'var(--warn)':col.c};"></div></div>
    </div>`;
  });
  html += `</div>`;

  // investment mini summary
  const totalInv = state.funds.reduce((s,f)=>s+totalAportado(f.id),0);
  let totalVal = 0, anyVal = false;
  state.funds.forEach(f=>{ const v = lastValor(f.id); if(v!==null){ totalVal += v; anyVal = true; } });
  const rent = (anyVal && totalInv>0) ? ((totalVal-totalInv)/totalInv*100) : null;

  html += `<div class="section-head"><h2>Inversión</h2><button class="action" id="goInvest">Ver todo</button></div>`;
  if(state.funds.length===0){
    html += `<div class="card">
      <div class="empty" style="padding:14px 4px;">
        <div class="glyph" style="width:34px;height:34px;">${ICONS.trend}</div>
        <div class="msg">Todavía no tienes ningún fondo. Añade el primero desde la pestaña Inversión.</div>
      </div>
    </div>`;
  } else {
    html += `<div class="card mini-invest">
      <div class="cat-icon">${ICONS.trend}</div>
      <div class="figs">
        <div class="label">Aportado ${money(totalInv)}</div>
        <div class="val">${anyVal? money(totalVal) : money(totalInv)}</div>
      </div>
      ${rent!==null ? `<div class="perf ${rent>0?'up':(rent<0?'down':'flat')}">${rent>0?'+':''}${pctFmt(rent)}</div>` : ''}
    </div>`;
  }

  // recent expenses
  const recent = expensesForMonth(ym).slice().sort((a,b)=>b.date.localeCompare(a.date) || b.createdAt-a.createdAt).slice(0,5);
  html += `<div class="section-head"><h2>Movimientos recientes</h2><button class="action" id="goGastos">Ver todo</button></div>`;
  html += `<div class="card">`;
  if(recent.length===0){
    html += `<div class="empty" style="padding:14px 4px;">
      <div class="glyph" style="width:34px;height:34px;">${ICONS.receipt}</div>
      <div class="msg">Todavía no has añadido gastos este mes.</div>
    </div>`;
  } else {
    html += `<div class="list">` + recent.map(e=>listItemHTML(e)).join('') + `</div>`;
  }
  html += `</div>`;

  el.innerHTML = html;
  bindInicioEvents();
}

export function listItemHTML(e){
  const cat = getCategory(e.category);
  const col = CAT_COLOR[e.category];
  return `<div class="list-item" data-id="${e.id}">
    <div class="cat-icon" style="width:36px;height:36px; background:${col.bg}; color:${col.c};">${ICONS[CAT_ICON[e.category]]}</div>
    <div class="info">
      <div class="area">${escapeHTML(e.areaName)}</div>
      <div class="meta">${dateLabelShort(e.date)}${e.note? ' · '+escapeHTML(e.note):''}</div>
    </div>
    <div class="amount num">${money(e.amount)}</div>
    <button class="del" data-del-expense="${e.id}">${ICONS.x}</button>
  </div>`;
}

function bindInicioEvents(){
  const b1=document.getElementById('mPrev'), b2=document.getElementById('mNext'), b3=document.getElementById('mJump');
  if(b1) b1.addEventListener('click', ()=>{ uiState.selectedMonth = shiftYM(uiState.selectedMonth,-1); renderInicio(); });
  if(b2) b2.addEventListener('click', ()=>{ uiState.selectedMonth = shiftYM(uiState.selectedMonth,1); renderInicio(); });
  if(b3) b3.addEventListener('click', ()=>{ uiState.selectedMonth = todayYM(); renderInicio(); });
  const ei = document.getElementById('editIncomeBtn'); if(ei) ei.addEventListener('click', openIncomeModal);
  const si = document.getElementById('setIncomeBtn'); if(si) si.addEventListener('click', openIncomeModal);
  const gi = document.getElementById('goInvest'); if(gi) gi.addEventListener('click', ()=>switchPage('inversion'));
  const gg = document.getElementById('goGastos'); if(gg) gg.addEventListener('click', ()=>switchPage('gastos'));
  document.querySelectorAll('[data-del-expense]').forEach(b=>{
    b.addEventListener('click', ()=>{ deleteExpense(b.dataset.delExpense); });
  });
}

export function deleteExpense(id){
  state.expenses = state.expenses.filter(e=>e.id!==id);
  saveState();
  renderCurrentPage();
  toast('Gasto eliminado');
}
