import { buildNav, renderCurrentPage, uiState } from './ui.js';
import { openInvestMovementModal, openAddAreaModal, openAddExpenseModal } from './modals.js';

document.getElementById('fabBtn').addEventListener('click', ()=>{
  if(uiState.currentPage==='inversion') openInvestMovementModal();
  else if(uiState.currentPage==='ajustes') openAddAreaModal();
  else openAddExpenseModal();
});

buildNav();
renderCurrentPage();
