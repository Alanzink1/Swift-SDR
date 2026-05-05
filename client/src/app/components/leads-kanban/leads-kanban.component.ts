import { Component, computed, effect, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { DialogModule, Dialog } from '@angular/cdk/dialog';
import { LeadsService, Lead, AiMessage } from '../../services/leads.service';
import { LeadFormComponent } from '../lead-form/lead-form.component';

@Component({
  selector: 'app-leads-kanban',
  standalone: true,
  imports: [CommonModule, DragDropModule, DialogModule],
  templateUrl: './leads-kanban.component.html',
  styleUrls: ['./leads-kanban.component.scss']
})
export class LeadsKanbanComponent implements OnInit {
  public leadsService = inject(LeadsService);
  private dialog = inject(Dialog);

  public isInitialLoading = this.leadsService.isInitialLoading;
  public isGeneratingMessage = this.leadsService.isGeneratingMessage;
  public currentLeadId = this.leadsService.currentLeadId;
  public messagesForCurrentLead = this.leadsService.messagesForCurrentLead;
  
  public showToast = signal<string | null>(null);

  // Derived Computed Signals for Ultra-Performance (listening to the service master signal)
  public leadsBase = computed(() => {
    const stageId = this.leadsService.stages()[0]?.id;
    return this.leadsService.leads().filter(l => l.current_stage_id === stageId);
  });
  
  public leadsMapeado = computed(() => {
    const stageId = this.leadsService.stages()[1]?.id;
    return this.leadsService.leads().filter(l => l.current_stage_id === stageId);
  });
  
  public leadsContato = computed(() => {
    const stageId = this.leadsService.stages()[2]?.id;
    return this.leadsService.leads().filter(l => l.current_stage_id === stageId);
  });

  public totalLeads = computed(() => this.leadsService.leads().length);

  constructor() {
    effect(() => {
      const err = this.leadsService.error();
      if (err) {
        this.exibirToast(err);
        this.leadsService.clearError(); 
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    this.leadsService.fetchStages();
    this.leadsService.fetchActiveCampaign();
    this.leadsService.fetchLeads();
  }

  public exibirToast(msg: string) {
    this.showToast.set(msg);
    setTimeout(() => this.showToast.set(null), 5000);
  }

  public openLeadForm() {
    this.dialog.open(LeadFormComponent, {
      width: '600px',
      disableClose: true
    });
  }

  public gerarMensagem(leadId: string) {
    this.leadsService.generateAiMessage(leadId);
  }

  public enviarMensagem(leadId: string) {
    // Requisito: Ação de Envio move automaticamente para 'Tentando Contato'
    this.leadsService.moveLeadToStage(leadId, 'stage-contato');
  }

  public getMessageForLead(leadId: string): AiMessage | undefined {
    const messages = this.leadsService.allGeneratedMessages();
    return messages.find((m: AiMessage) => m.lead_id === leadId);
  }

  // --- DRAG AND DROP ENGINE ---

  // Predicate: Bloqueia drag n drop se o lead não tem campos obrigatórios preenchidos
  public canDrop = (dragData: any): boolean => {
    const lead = dragData.data as Lead;
    if (!lead.phone || !lead.job_title) {
      this.exibirToast(`Faltam informações obrigatórias para ${lead.name} (Telefone ou Cargo).`);
      return false;
    }
    return true;
  }

  public drop(event: CdkDragDrop<Lead[]>, newStageId: string) {
    if (event.previousContainer === event.container) {
      // Reordenação na mesma coluna (não implementado o sort index por enquanto)
      return;
    }
    
    // Mover entre colunas
    const lead = event.item.data as Lead;
    this.leadsService.moveLeadToStage(lead.id, newStageId);
  }
}
