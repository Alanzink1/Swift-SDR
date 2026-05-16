import { Routes } from '@angular/router';
import { LayoutComponent } from './components/layout/layout.component';
import { LeadsKanbanComponent } from './components/leads-kanban/leads-kanban.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { CampaignsComponent } from './components/campaigns/campaigns.component';
import { SettingsComponent } from './components/settings/settings.component';
import { ProfileComponent } from './components/profile/profile.component';
import { WorkspaceSettingsComponent } from './components/workspace-settings/workspace-settings.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'leads', component: LeadsKanbanComponent },
      { path: 'campaigns', component: CampaignsComponent },
      { path: 'settings', component: SettingsComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'workspace', component: WorkspaceSettingsComponent },
    ]
  },
  { path: '**', redirectTo: '' }
];
