import { ICONS, CAT_ICON, CAT_COLOR } from '../icons.js';
import { state, saveState, resetState, replaceState } from '../state.js';
import { money, todayISO, escapeHTML, toInputValue, parseInputValue } from '../format.js';
import { getCategory, getArea, categoryBudget } from '../selectors.js';
import { renderCurrentPage, toast } from '../ui.js';
import { openAddAreaModal } from '../modals.js';

export function renderAjustes(){
  const el = document.getElementById('ajustesContent');
  let html = '';

  html += `<div class="section-head" style="margin-top:14px;"><h2>Ingreso mensual</h2></div>`;
  html += `<div class="card">
    <div class="field" style="margin-bottom:0;">
      <label>Nómina neta al mes</label>
      <input type="text" id="incomeInput" value="${toInputValue(state.income||'')}" inputmode="decimal" placeholder="0">
    </div>
  </div>`;

  html += `<div class="section-head"><h2>Reparto por categorías</h2></div>`;
  const total = roundPct(state.categories.reduce((s,c)=>s+Number(c.percent),0));
  html += `<div class="card">`;
  state.categories.forEach(cat=>{
    const col = CAT_COLOR[cat.id];
    html += `<div class="pct-row">
      <div class="pct-row-top">
        <div class="cat-icon" style="background:${col.bg}; color:${col.c};">${ICONS[CAT_ICON[cat.id]]}</div>
        <div class="name">${cat.name}<div class="pct-amount" data-amount-for="${cat.id}">${money(categoryBudget(cat.id))} al mes</div></div>
        <div class="pct-input"><input type="text" inputmode="decimal" class="pctField" data-cat="${cat.id}" value="${toInputValue(cat.percent)}"><span>%</span></div>
      </div>
      <input type="range" class="pct-slider" data-cat="${cat.id}" min="0" max="100" step="1" value="${Math.min(100,Math.max(0,Math.round(cat.percent)))}">
    </div>`;
  });
  html += `<div class="pct-total ${total===100?'':'bad'}" id="pctTotal">Total repartido: ${toInputValue(total)}%${total===100?'':' — debe sumar 100%'}</div>`;
  html += `<button class="btn primary" id="savePctBtn" style="margin-top:14px;" ${total===100?'':'disabled'}>Guardar reparto</button>`;
  html += `</div>`;

  html += `<div class="section-head"><h2>Tus áreas de gasto</h2><button class="action" id="addAreaBtn">+ Añadir área</button></div>`;
  html += `<div class="card">`;
  if(state.areas.length===0){
    html += `<div class="empty" style="padding:10px 4px;"><div class="msg">No tienes áreas todavía.</div></div>`;
  } else {
    state.areas.forEach(a=>{
      html += `<div class="area-row">
        <div class="name">${escapeHTML(a.name)}</div>
        <select data-area-cat="${a.id}">
          ${state.categories.filter(c=>c.id!=='inversion').map(c=>`<option value="${c.id}" ${c.id===a.category?'selected':''}>${c.name}</option>`).join('')}
        </select>
        <button class="del" data-del-area="${a.id}">${ICONS.x}</button>
      </div>`;
    });
  }
  html += `</div>`;

  html += `<div class="section-head"><h2>Tus datos</h2></div>`;
  html += `<div class="settings-actions">
    <button class="settings-row-btn" id="exportBtn">${ICONS.download} Exportar copia de seguridad</button>
    <button class="settings-row-btn" id="importBtn">${ICONS.upload} Importar copia de seguridad</button>
    <input type="file" id="importFile" accept="application/json" style="display:none;">
    <button class="settings-row-btn danger" id="resetBtn">${ICONS.trash} Borrar todos los datos</button>
  </div>`;

  el.innerHTML = html;
  bindAjustesEvents();
}

function bindAjustesEvents(){
  document.getElementById('incomeInput').addEventListener('change', (e)=>{
    state.income = parseInputValue(e.target.value)||0;
    saveState();
    renderAjustes();
    toast('Ingreso actualizado');
  });

  const pctInputs = document.querySelectorAll('.pctField');
  const pctSliders = document.querySelectorAll('.pct-slider');

  function refreshTotal(){
    let total = 0;
    pctInputs.forEach(i=>total += (parseInputValue(i.value)||0));
    total = roundPct(total);
    const totalEl = document.getElementById('pctTotal');
    totalEl.textContent = `Total repartido: ${toInputValue(total)}%` + (total===100?'':' — debe sumar 100%');
    totalEl.classList.toggle('bad', total!==100);
    document.getElementById('savePctBtn').disabled = total!==100;
  }

  function refreshAmount(catId, percent){
    const amountEl = document.querySelector(`[data-amount-for="${catId}"]`);
    if(amountEl) amountEl.textContent = `${money(state.income * (percent/100))} al mes`;
  }

  pctInputs.forEach(inp=>{
    inp.addEventListener('input', ()=>{
      const percent = parseInputValue(inp.value)||0;
      const slider = document.querySelector(`.pct-slider[data-cat="${inp.dataset.cat}"]`);
      if(slider) slider.value = Math.min(100, Math.max(0, Math.round(percent)));
      refreshAmount(inp.dataset.cat, percent);
      refreshTotal();
    });
  });

  pctSliders.forEach(slider=>{
    slider.addEventListener('input', ()=>{
      const percent = Number(slider.value);
      const field = document.querySelector(`.pctField[data-cat="${slider.dataset.cat}"]`);
      if(field) field.value = toInputValue(percent);
      refreshAmount(slider.dataset.cat, percent);
      refreshTotal();
    });
  });

  document.getElementById('savePctBtn').addEventListener('click', ()=>{
    pctInputs.forEach(i=>{
      const cat = getCategory(i.dataset.cat);
      cat.percent = Math.max(0, parseInputValue(i.value)||0);
    });
    saveState();
    renderAjustes();
    toast('Reparto guardado');
  });

  document.getElementById('addAreaBtn').addEventListener('click', openAddAreaModal);
  document.querySelectorAll('[data-area-cat]').forEach(sel=>{
    sel.addEventListener('change', ()=>{
      const area = getArea(sel.dataset.areaCat);
      area.category = sel.value;
      saveState();
      toast('Área actualizada');
    });
  });
  document.querySelectorAll('[data-del-area]').forEach(b=>{
    b.addEventListener('click', ()=>{
      if(confirm('¿Eliminar esta área? Los gastos ya guardados no se verán afectados.')){
        state.areas = state.areas.filter(a=>a.id!==b.dataset.delArea);
        saveState(); renderAjustes();
      }
    });
  });

  document.getElementById('exportBtn').addEventListener('click', exportData);
  document.getElementById('importBtn').addEventListener('click', ()=>document.getElementById('importFile').click());
  document.getElementById('importFile').addEventListener('change', importData);
  document.getElementById('resetBtn').addEventListener('click', ()=>{
    if(confirm('Esto borrará todos tus gastos, fondos y ajustes. ¿Seguro?')){
      if(confirm('Confirma otra vez: se perderá todo de forma permanente.')){
        resetState();
        renderCurrentPage();
        toast('Datos borrados');
      }
    }
  });
}

// evita que sumas de decimales (12.5 + 87.5) queden en 99.99999999999999 por coma flotante
function roundPct(n){
  return Math.round(n*100)/100;
}

function exportData(){
  const blob = new Blob([JSON.stringify(state,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'finanzas-backup-'+todayISO()+'.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('Copia exportada');
}
function importData(e){
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const data = JSON.parse(reader.result);
      if(!data.categories || !data.areas) throw new Error('formato inválido');
      if(confirm('Se sustituirán todos tus datos actuales por los del archivo. ¿Continuar?')){
        replaceState(data);
        renderCurrentPage();
        toast('Datos importados');
      }
    }catch(err){
      alert('No se pudo leer el archivo. Asegúrate de que es una copia de seguridad válida.');
    }
    e.target.value = '';
  };
  reader.readAsText(file);
}
