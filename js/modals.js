import { ICONS } from './icons.js';
import { state, uid, saveState } from './state.js';
import { todayISO, escapeHTML } from './format.js';
import { getArea } from './selectors.js';
import { uiState, renderCurrentPage, toast } from './ui.js';
import { renderAjustes } from './pages/ajustes.js';
import { renderInversion } from './pages/inversion.js';

const overlay = document.getElementById('modalOverlay');
const modalBody = document.getElementById('modalBody');

export function openModal(title, bodyHTML, onMount){
  modalBody.innerHTML = `
    <div class="modal-handle"></div>
    <div class="modal-head"><h3>${title}</h3><button id="modalCloseBtn">${ICONS.x}</button></div>
    ${bodyHTML}
  `;
  overlay.classList.add('open');
  document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
  if(onMount) onMount();
}
export function closeModal(){
  overlay.classList.remove('open');
}
overlay.addEventListener('click', (e)=>{ if(e.target===overlay) closeModal(); });

function areaOptionsHTML(selectedId){
  const cats = state.categories.filter(c=>c.id!=='inversion');
  return cats.map(c=>{
    const areas = state.areas.filter(a=>a.category===c.id);
    if(areas.length===0) return '';
    return `<optgroup label="${c.name}">` + areas.map(a=>`<option value="${a.id}" ${a.id===selectedId?'selected':''}>${a.name}</option>`).join('') + `</optgroup>`;
  }).join('');
}

export function openAddExpenseModal(){
  const bodyHTML = `
    <div class="field">
      <label>Área</label>
      <select id="expArea">${areaOptionsHTML(null)}</select>
    </div>
    <button class="btn link" id="toggleNewArea">+ Crear un área nueva</button>
    <div id="newAreaFields" style="display:none;">
      <div class="field-row">
        <div class="field"><label>Nombre</label><input type="text" id="newAreaName" placeholder="p.ej. Peluquería"></div>
        <div class="field"><label>Categoría</label>
          <select id="newAreaCat">${state.categories.filter(c=>c.id!=='inversion').map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}</select>
        </div>
      </div>
    </div>
    <div class="field-row">
      <div class="field"><label>Cantidad (€)</label><input type="number" id="expAmount" min="0" step="0.01" placeholder="0,00" inputmode="decimal"></div>
      <div class="field"><label>Fecha</label><input type="date" id="expDate" value="${todayISO()}"></div>
    </div>
    <div class="field"><label>Nota (opcional)</label><input type="text" id="expNote" placeholder="p.ej. cena con amigas"></div>
    <button class="btn primary" id="saveExpenseBtn">Guardar gasto</button>
  `;
  openModal('Nuevo gasto', bodyHTML, ()=>{
    if(state.areas.length===0) document.getElementById('newAreaFields').style.display='block';
    document.getElementById('toggleNewArea').addEventListener('click', ()=>{
      const f = document.getElementById('newAreaFields');
      f.style.display = f.style.display==='none'?'block':'none';
    });
    document.getElementById('saveExpenseBtn').addEventListener('click', ()=>{
      let areaId = document.getElementById('expArea').value;
      const newName = document.getElementById('newAreaName').value.trim();
      if(newName){
        const newCat = document.getElementById('newAreaCat').value;
        const area = { id:uid(), name:newName, category:newCat };
        state.areas.push(area);
        areaId = area.id;
      }
      const amount = parseFloat(document.getElementById('expAmount').value);
      const date = document.getElementById('expDate').value || todayISO();
      const note = document.getElementById('expNote').value.trim();
      if(!areaId){ alert('Elige o crea un área.'); return; }
      if(!amount || amount<=0){ alert('Introduce una cantidad válida.'); return; }
      const area = getArea(areaId);
      state.expenses.push({ id:uid(), date, areaId, areaName:area.name, category:area.category, amount, note, createdAt:Date.now() });
      saveState();
      closeModal();
      uiState.selectedMonth = date.slice(0,7);
      renderCurrentPage();
      toast('Gasto guardado');
    });
  });
}

export function openIncomeModal(){
  const bodyHTML = `
    <div class="field"><label>Nómina neta al mes (€)</label><input type="number" id="incomeModalInput" value="${state.income||''}" min="0" step="10" autofocus></div>
    <button class="btn primary" id="saveIncomeBtn">Guardar</button>
  `;
  openModal('Ingreso mensual', bodyHTML, ()=>{
    document.getElementById('saveIncomeBtn').addEventListener('click', ()=>{
      state.income = parseFloat(document.getElementById('incomeModalInput').value)||0;
      saveState();
      closeModal();
      renderCurrentPage();
      toast('Ingreso actualizado');
    });
  });
}

export function openAddAreaModal(){
  const bodyHTML = `
    <div class="field"><label>Nombre</label><input type="text" id="areaModalName" placeholder="p.ej. Gimnasio" autofocus></div>
    <div class="field"><label>Categoría</label>
      <select id="areaModalCat">${state.categories.filter(c=>c.id!=='inversion').map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}</select>
    </div>
    <button class="btn primary" id="saveAreaBtn">Añadir área</button>
  `;
  openModal('Nueva área', bodyHTML, ()=>{
    document.getElementById('saveAreaBtn').addEventListener('click', ()=>{
      const name = document.getElementById('areaModalName').value.trim();
      if(!name){ alert('Escribe un nombre.'); return; }
      state.areas.push({ id:uid(), name, category:document.getElementById('areaModalCat').value });
      saveState();
      closeModal();
      renderAjustes();
      toast('Área añadida');
    });
  });
}

export function openAddFundModal(){
  const bodyHTML = `
    <div class="field"><label>Nombre del fondo</label><input type="text" id="fundName" placeholder="p.ej. MSCI World" autofocus></div>
    <button class="btn primary" id="saveFundBtn">Añadir fondo</button>
  `;
  openModal('Nuevo fondo', bodyHTML, ()=>{
    document.getElementById('saveFundBtn').addEventListener('click', ()=>{
      const name = document.getElementById('fundName').value.trim();
      if(!name){ alert('Escribe un nombre.'); return; }
      state.funds.push({ id:uid(), name });
      saveState();
      closeModal();
      renderInversion();
      toast('Fondo añadido');
    });
  });
}

export function openInvestMovementModal(){
  if(state.funds.length===0){
    openAddFundModal();
    return;
  }
  let mode = 'aportacion';
  const bodyHTML = `
    <div class="seg" id="movSeg">
      <button data-mode="aportacion" class="active">Aportación</button>
      <button data-mode="valor">Valor actual</button>
    </div>
    <div class="field"><label>Fondo</label>
      <select id="movFund">${state.funds.map(f=>`<option value="${f.id}">${escapeHTML(f.name)}</option>`).join('')}</select>
    </div>
    <div class="field-row">
      <div class="field"><label id="movAmountLabel">Cantidad aportada (€)</label><input type="number" id="movAmount" min="0" step="1" inputmode="decimal"></div>
      <div class="field"><label>Fecha</label><input type="date" id="movDate" value="${todayISO()}"></div>
    </div>
    <div class="hint-banner" id="movHint">${ICONS.info}<span>Registra cada aportación que hagas a tu fondo. Contará automáticamente dentro de tu presupuesto de <b>Inversión</b> del mes.</span></div>
    <button class="btn primary" id="saveMovBtn">Guardar</button>
  `;
  openModal('Movimiento de inversión', bodyHTML, ()=>{
    document.querySelectorAll('#movSeg button').forEach(b=>{
      b.addEventListener('click', ()=>{
        document.querySelectorAll('#movSeg button').forEach(x=>x.classList.remove('active'));
        b.classList.add('active');
        mode = b.dataset.mode;
        const label = document.getElementById('movAmountLabel');
        const hint = document.getElementById('movHint');
        if(mode==='aportacion'){
          label.textContent = 'Cantidad aportada (€)';
          hint.innerHTML = ICONS.info + `<span>Registra cada aportación que hagas a tu fondo. Contará automáticamente dentro de tu presupuesto de <b>Inversión</b> del mes.</span>`;
        } else {
          label.textContent = 'Valor actual del fondo (€)';
          hint.innerHTML = ICONS.info + `<span>Anota el valor total que tiene tu fondo hoy, para poder ver su evolución y rentabilidad.</span>`;
        }
      });
    });
    document.getElementById('saveMovBtn').addEventListener('click', ()=>{
      const fundId = document.getElementById('movFund').value;
      const amount = parseFloat(document.getElementById('movAmount').value);
      const date = document.getElementById('movDate').value || todayISO();
      if(!amount || amount<=0){ alert('Introduce una cantidad válida.'); return; }
      state.movements.push({ id:uid(), fundId, date, type:mode, amount });
      saveState();
      closeModal();
      uiState.selectedMonth = date.slice(0,7);
      renderCurrentPage();
      toast(mode==='aportacion' ? 'Aportación guardada' : 'Valor actualizado');
    });
  });
}
