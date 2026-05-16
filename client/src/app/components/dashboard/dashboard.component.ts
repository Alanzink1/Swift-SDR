import { Component, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DialogModule, Dialog } from '@angular/cdk/dialog';
import { LeadsService, Lead } from '../../services/leads.service';
import { CampaignsService } from '../../services/campaigns.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, DialogModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  private leadsService = inject(LeadsService);
  private campaignsService = inject(CampaignsService);
  private dialog = inject(Dialog);

  public leadsCount = computed(() => this.leadsService.leads().length);
  public campaignsCount = computed(() => this.campaignsService.campaigns().length);
  
  public conversionRate = computed(() => {
    const total = this.leadsCount();
    if (total === 0) return 0;
    // Simulação: Leads na última etapa
    const lastStageId = this.leadsService.stages()[this.leadsService.stages().length - 1]?.id;
    const converted = this.leadsService.leads().filter(l => l.current_stage_id === lastStageId).length;
    return Math.round((converted / total) * 100);
  });

  public activeLeads = computed(() => {
    return this.leadsService.leads().slice(0, 5); // Top 5 recentes
  });

  public openLeadDetails(lead: Lead) {
    this.leadsService.setCurrentLeadId(lead.id);
    import('../lead-details/lead-details.component').then(m => {
      this.dialog.open(m.LeadDetailsComponent, {
        width: '800px',
        data: { lead }
      });
    });
  }

  ngOnInit() {
    this.leadsService.fetchLeads();
    this.leadsService.fetchStages();
    this.campaignsService.fetchCampaigns();
  }
}
