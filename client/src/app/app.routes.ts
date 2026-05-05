import { Routes } from '@angular/router';
import { LayoutComponent } from './components/layout/layout.component';
import { LeadsKanbanComponent } from './components/leads-kanban/leads-kanban.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { CampaignsComponent } from './components/campaigns/campaigns.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'leads', component: LeadsKanbanComponent },
      { path: 'campaigns', component: CampaignsComponent },
    ]
  },
  { path: '**', redirectTo: '' }
];
