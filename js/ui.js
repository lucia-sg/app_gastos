import { ICONS } from './icons.js';
import { todayYM } from './format.js';
import { renderInicio } from './pages/inicio.js';
import { renderGastos } from './pages/gastos.js';
import { renderInversion } from './pages/inversion.js';
import { renderAjustes } from './pages/ajustes.js';

export const uiState = {
  currentPage: 'inicio',
  selectedMonth: todayYM(),
  expenseFilter: 'all',
};

export const TABS = [
  { id:'inicio',    label:'Inicio',    icon:'home' },
  { id:'gastos',    label:'Gastos',    icon:'receipt' },
  { id:'inversion', label:'Inversión', icon:'trend' },
  { id:'ajustes',   label:'Ajustes',   icon:'sliders' },
];

export function buildNav(){
  const tabbar = document.getElementById('tabbar');
  tabbar.innerHTML = TABS.map(t=>
    `<button data-tab="${t.id}" class="${t.id===uiState.currentPage?'active':''}">${ICONS[t.icon]}<span>${t.label}</span></button>`
  ).join('');
  tabbar.querySelectorAll('button').forEach(b=>b.addEventListener('click', ()=>switchPage(b.dataset.tab)));

  const sidebarNav = document.getElementById('sidebarNav');
  sidebarNav.innerHTML = TABS.map(t=>
    `<button data-tab="${t.id}" class="${t.id===uiState.currentPage?'active':''}">${ICONS[t.icon]}<span>${t.label}</span></button>`
  ).join('');
  sidebarNav.querySelectorAll('button').forEach(b=>b.addEventListener('click', ()=>switchPage(b.dataset.tab)));
}

export function switchPage(id){
  uiState.currentPage = id;
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById('page-'+id).classList.add('active');
  buildNav();
  renderCurrentPage();
  window.scrollTo({top:0});
}

export function renderCurrentPage(){
  if(uiState.currentPage==='inicio') renderInicio();
  if(uiState.currentPage==='gastos') renderGastos();
  if(uiState.currentPage==='inversion') renderInversion();
  if(uiState.currentPage==='ajustes') renderAjustes();
}

export function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._h);
  toast._h = setTimeout(()=>t.classList.remove('show'), 2200);
}
