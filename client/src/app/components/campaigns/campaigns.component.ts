import { Component, inject, signal, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CampaignsService, Campaign } from '../../services/campaigns.service';
import { LeadsService } from '../../services/leads.service';

@Component({
  selector: 'app-campaigns',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './campaigns.component.html',
  styleUrls: ['./campaigns.component.scss']
})
export class CampaignsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private campaignsService = inject(CampaignsService);
  private leadsService = inject(LeadsService);

  public campaignForm: FormGroup;
  public isSaving = signal<boolean>(false);
  public successMessage = signal<string | null>(null);
  public errorMessage = signal<string | null>(null);

  public campaigns = this.campaignsService.campaigns;
  public isLoading = this.campaignsService.isLoading;
  public stages = this.leadsService.stages;

  constructor() {
    this.campaignForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      context: ['', [Validators.required, Validators.minLength(10)]],
      system_prompt: ['', [Validators.required]],
      trigger_stage_id: ['', [Validators.required]],
      is_active: [true]
    });

    // Sincroniza o valor default assim que as etapas carregam do banco
    effect(() => {
      const firstStage = this.stages()[0];
      if (firstStage && !this.campaignForm.get('trigger_stage_id')?.value) {
        this.campaignForm.patchValue({ trigger_stage_id: firstStage.id });
      }
    });
  }

  ngOnInit() {
    this.campaignsService.fetchCampaigns();
    if (this.stages().length === 0) {
      this.leadsService.fetchStages();
    }
  }

  public onSubmit() {
    if (this.campaignForm.invalid) return;

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const payload = this.campaignForm.value;
    
    this.campaignsService.createCampaign(payload).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.successMessage.set('Campanha criada com sucesso! 🚀');
        const firstStageId = this.stages()[0]?.id || '';
        this.campaignForm.reset({ is_active: true, trigger_stage_id: firstStageId });
        this.campaignsService.fetchCampaigns(); // Refresh list
        setTimeout(() => this.successMessage.set(null), 5000);
      },
      error: (err) => {
        console.error('Save error:', err);
        this.errorMessage.set('Erro ao salvar campanha no Supabase.');
        this.isSaving.set(false);
      }
    });
  }

  public getStageName(id: string): string {
    return this.stages().find(s => s.id === id)?.name || id;
  }

  public deleteCampaign(id: string) {
    if (confirm('Tem certeza que deseja excluir esta campanha?')) {
      this.campaignsService.deleteCampaign(id).subscribe({
        error: (err) => {
          console.error('Delete error:', err);
          this.errorMessage.set('Erro ao excluir campanha. Verifique as permissões de RLS.');
        }
      });
    }
  }
}
