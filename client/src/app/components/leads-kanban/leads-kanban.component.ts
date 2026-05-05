import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { LeadsService, Lead, AiMessage } from '../../services/leads.service';

@Component({
  selector: 'app-leads-kanban',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './leads-kanban.component.html',
  styleUrls: ['./leads-kanban.component.scss']
})
export class LeadsKanbanComponent {
  private leadsService = inject(LeadsService);

  public isGeneratingMessage = this.leadsService.isGeneratingMessage;
  public currentLeadId = this.leadsService.currentLeadId;
  public messagesForCurrentLead = this.leadsService.messagesForCurrentLead;
  
  public showToast = signal<string | null>(null);

  // Derived Computed Signals for Ultra-Performance (listening to the service master signal)
  public leadsBase = computed(() => this.leadsService.leads().filter(l => l.current_stage_id === 'stage-base'));
  public leadsMapeado = computed(() => this.leadsService.leads().filter(l => l.current_stage_id === 'stage-mapeado'));
  public leadsContato = computed(() => this.leadsService.leads().filter(l => l.current_stage_id === 'stage-contato'));

  constructor() {
    effect(() => {
      const err = this.leadsService.error();
      if (err) {
        this.exibirToast(err);
        this.leadsService.clearError(); 
      }
    }, { allowSignalWrites: true });
  }

  public exibirToast(msg: string) {
    this.showToast.set(msg);
    setTimeout(() => this.showToast.set(null), 5000);
  }

  public gerarMensagem(leadId: string) {
    const campaignId = '30000000-0000-0000-0000-000000000003';
    this.leadsService.generateAiMessage(leadId, campaignId);
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
