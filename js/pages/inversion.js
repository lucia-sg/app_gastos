import { ICONS } from '../icons.js';
import { state, saveState } from '../state.js';
import { money, pctFmt, escapeHTML } from '../format.js';
import { totalAportado, lastValor, fundColor } from '../selectors.js';
import { openAddFundModal } from '../modals.js';

export function renderInversion(){
  const el = document.getElementById('inversionContent');
  let html = '';

  const totalInv = state.funds.reduce((s,f)=>s+totalAportado(f.id),0);
  let totalVal = 0, anyVal = false;
  state.funds.forEach(f=>{ const v=lastValor(f.id); if(v!==null){ totalVal+=v; anyVal=true; } });
  const rent = (anyVal && totalInv>0) ? (totalVal-totalInv) : null;
  const rentPct = (anyVal && totalInv>0) ? (rent/totalInv*100) : null;

  html += `<div class="hero" style="margin-top:14px;">
    <div class="eyebrow">Valor de tu cartera</div>
    <div class="amount">${anyVal? money(totalVal) : money(totalInv)}</div>
    <div class="sub">
      <span>Aportado <b class="num">${money(totalInv)}</b></span>
      ${rent!==null? `<span>Rentabilidad <b class="num" style="color:${rent>=0?'#B7CDBB':'#E3B2A2'}">${rent>=0?'+':''}${money(rent)} (${pctFmt(rentPct)})</b></span>`:''}
    </div>
  </div>`;

  html += `<div class="section-head"><h2>Tus fondos</h2><button class="action" id="addFundBtn">+ Añadir fondo</button></div>`;

  if(state.funds.length===0){
    html += `<div class="card"><div class="empty">
      <div class="glyph">${ICONS.trend}</div>
      <div class="msg">Registra tu fondo de inversión para llevar el seguimiento de tus aportaciones y su evolución.</div>
    </div></div>`;
  } else {
    state.funds.forEach(f=>{
      const ap = totalAportado(f.id);
      const val = lastValor(f.id);
      const col = fundColor(f);
      html += `<div class="fund-card">
        <div class="head">
          <span class="swatch" style="background:${col}"></span>
          <div class="name">${escapeHTML(f.name)}</div>
          <button class="del" data-del-fund="${f.id}">${ICONS.x}</button>
        </div>
        <div class="stats">
          <div><div class="s-label">Aportado</div><div class="s-val num">${money(ap)}</div></div>
          <div><div class="s-label">Valor actual</div><div class="s-val num">${val!==null? money(val):'—'}</div></div>
          <div><div class="s-label">Rentabilidad</div><div class="s-val num" style="color:${val!==null && val>=ap?'var(--sage)':(val!==null?'var(--warn)':'var(--ink-faint)')}">${val!==null && ap>0? ((val>=ap?'+':'')+pctFmt((val-ap)/ap*100)) : '—'}</div></div>
        </div>
      </div>`;
    });

    // evolution chart
    html += `<div class="section-head"><h2>Evolución</h2></div>`;
    html += `<div class="card"><div class="chart-wrap" id="evoChart"></div>
      <div class="chart-legend">
        <div class="item"><span class="dot" style="background:var(--ink-faint)"></span>Aportado acumulado</div>
        <div class="item"><span class="dot" style="background:var(--sage)"></span>Valor registrado</div>
      </div>
    </div>`;
  }

  // compound calculator
  html += `<div class="section-head"><h2>Calculadora de interés compuesto</h2></div>`;
  html += `<div class="card">
    <div class="field-row">
      <div class="field"><label>Capital inicial (€)</label><input type="number" id="calcInicial" value="${totalVal>0?Math.round(totalVal):Math.round(totalInv)}" min="0" step="50"></div>
      <div class="field"><label>Aportación mensual (€)</label><input type="number" id="calcMensual" value="100" min="0" step="10"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Rentabilidad anual (%)</label><input type="number" id="calcRent" value="6" min="0" step="0.1"></div>
      <div class="field"><label>Años</label><input type="number" id="calcAnos" value="10" min="1" step="1"></div>
    </div>
    <button class="btn primary" id="calcBtn">Calcular proyección</button>
    <div id="calcResult"></div>
  </div>`;

  el.innerHTML = html;

  if(state.funds.length>0) drawEvolutionChart();

  document.getElementById('addFundBtn').addEventListener('click', openAddFundModal);
  document.querySelectorAll('[data-del-fund]').forEach(b=>{
    b.addEventListener('click', ()=>{
      if(confirm('¿Eliminar este fondo y todos sus movimientos?')){
        const id = b.dataset.delFund;
        state.funds = state.funds.filter(f=>f.id!==id);
        state.movements = state.movements.filter(m=>m.fundId!==id);
        saveState(); renderInversion();
      }
    });
  });
  document.getElementById('calcBtn').addEventListener('click', runCompoundCalc);
}

function drawEvolutionChart(){
  const wrap = document.getElementById('evoChart');
  if(!wrap) return;

  // build combined date axis from all movements
  const allDates = Array.from(new Set(state.movements.map(m=>m.date))).sort();
  if(allDates.length===0){
    wrap.innerHTML = `<div class="empty" style="padding:20px 4px;"><div class="msg">Añade aportaciones o un valor actual para ver la evolución.</div></div>`;
    return;
  }
  // cumulative aportado series & valor series (using last known valor per date-step, forward-filled)
  let cumAp = 0;
  const apPoints = [];
  const valPoints = [];
  let lastKnownVal = null;
  allDates.forEach(date=>{
    const dayMovs = state.movements.filter(m=>m.date===date);
    dayMovs.forEach(m=>{
      if(m.type==='aportacion') cumAp += m.amount;
      if(m.type==='valor') lastKnownVal = m.amount;
    });
    apPoints.push({date, value:cumAp});
    if(lastKnownVal!==null) valPoints.push({date, value:lastKnownVal});
  });

  const W = 600, H = 200, PAD = 28;
  const maxVal = Math.max(...apPoints.map(p=>p.value), ...valPoints.map(p=>p.value), 1);
  const xFor = (i,n) => PAD + (i/(Math.max(n-1,1))) * (W-PAD*2);
  const yFor = v => H-PAD - (v/maxVal)*(H-PAD*2);

  function pathFor(points, allN){
    return points.map((p,i)=>{
      const idx = allDates.indexOf(p.date);
      const x = xFor(idx, allN);
      const y = yFor(p.value);
      return (i===0?'M':'L')+x.toFixed(1)+','+y.toFixed(1);
    }).join(' ');
  }

  const apPath = pathFor(apPoints, allDates.length);
  const valPath = valPoints.length ? pathFor(valPoints, allDates.length) : '';

  let svg = `<svg viewBox="0 0 ${W} ${H}" style="width:100%; height:auto; display:block;">`;
  // gridlines
  for(let i=0;i<=3;i++){
    const y = PAD + i*(H-PAD*2)/3;
    svg += `<line x1="${PAD}" y1="${y}" x2="${W-PAD}" y2="${y}" stroke="var(--border-soft)" stroke-width="1"/>`;
  }
  svg += `<path d="${apPath}" fill="none" stroke="var(--ink-faint)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="4 4"/>`;
  if(valPath) svg += `<path d="${valPath}" fill="none" stroke="var(--sage)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;
  valPoints.forEach(p=>{
    const idx = allDates.indexOf(p.date);
    svg += `<circle cx="${xFor(idx,allDates.length).toFixed(1)}" cy="${yFor(p.value).toFixed(1)}" r="3.5" fill="var(--sage)"/>`;
  });
  svg += `</svg>`;
  wrap.innerHTML = svg;
}

function runCompoundCalc(){
  const P = parseFloat(document.getElementById('calcInicial').value)||0;
  const PMT = parseFloat(document.getElementById('calcMensual').value)||0;
  const annualRate = parseFloat(document.getElementById('calcRent').value)||0;
  const years = parseInt(document.getElementById('calcAnos').value)||0;
  const r = annualRate/100/12;

  let rows = [];
  let balance = P;
  let totalAp = P;
  for(let y=1; y<=years; y++){
    for(let m=0;m<12;m++){
      balance = balance*(1+r) + PMT;
      totalAp += PMT;
    }
    rows.push({year:y, aportado: totalAp, valor: balance});
  }
  const finalVal = rows.length? rows[rows.length-1].valor : P;
  const finalAp = rows.length? rows[rows.length-1].aportado : P;
  const interes = finalVal - finalAp;

  let html = `<div class="calc-result">
    <div class="s-label" style="font-size:12px; color:var(--ink-soft);">Valor final estimado</div>
    <div class="big num">${money(finalVal)}</div>
    <div class="breakdown">
      <div>Total aportado<b class="num">${money(finalAp)}</b></div>
      <div>Intereses generados<b class="num">${money(interes)}</b></div>
    </div>
  </div>`;

  if(rows.length>0){
    const step = Math.max(1, Math.ceil(rows.length/8));
    html += `<table class="year-table"><thead><tr><th>Año</th><th>Aportado</th><th>Valor est.</th></tr></thead><tbody>`;
    rows.forEach((row,i)=>{
      if(i===rows.length-1 || i%step===0){
        html += `<tr><td>${row.year}</td><td class="num">${money(row.aportado)}</td><td class="num">${money(row.valor)}</td></tr>`;
      }
    });
    html += `</tbody></table>`;
  }

  document.getElementById('calcResult').innerHTML = html;
}
