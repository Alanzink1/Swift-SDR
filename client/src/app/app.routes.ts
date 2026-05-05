import { Routes } from '@angular/router';
import { LeadsKanbanComponent } from './components/leads-kanban/leads-kanban.component';

export const routes: Routes = [
  { path: '', component: LeadsKanbanComponent },
  { path: '**', redirectTo: '' }
];
