export function money(n){
  n = Number(n)||0;
  return n.toLocaleString('es-ES', { style:'currency', currency:'EUR', maximumFractionDigits: (Math.abs(n)<1000? 2:0) });
}
export function moneyFull(n){
  n = Number(n)||0;
  return n.toLocaleString('es-ES', { style:'currency', currency:'EUR', maximumFractionDigits:2 });
}
export function pctFmt(n){ return (Math.round(n*10)/10) + '%'; }

export const MONTH_NAMES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

export function ymLabel(ym){
  const [y,m] = ym.split('-').map(Number);
  return MONTH_NAMES[m-1] + ' ' + y;
}
export function todayYM(){
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
}
export function todayISO(){
  const d = new Date();
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
export function shiftYM(ym, delta){
  let [y,m] = ym.split('-').map(Number);
  m += delta;
  while(m>12){ m-=12; y++; }
  while(m<1){ m+=12; y--; }
  return y+'-'+String(m).padStart(2,'0');
}
export function dateLabel(iso){
  const d = new Date(iso+'T00:00:00');
  return d.getDate() + ' de ' + MONTH_NAMES[d.getMonth()];
}
export function dateLabelShort(iso){
  const d = new Date(iso+'T00:00:00');
  return d.getDate() + ' ' + MONTH_NAMES[d.getMonth()].slice(0,3);
}
export function escapeHTML(str){
  const div = document.createElement('div');
  div.textContent = str==null? '': String(str);
  return div.innerHTML;
}

// Los <input type="number"> siempre usan el punto como separador decimal
// (depende del idioma del navegador, no de la web). Estos helpers permiten
// usar <input type="text" inputmode="decimal"> aceptando también la coma.
export function parseInputValue(str){
  if(str == null) return NaN;
  return parseFloat(String(str).trim().replace(',', '.'));
}
export function toInputValue(n){
  if(n === null || n === undefined || n === '') return '';
  return String(n).replace('.', ',');
}
