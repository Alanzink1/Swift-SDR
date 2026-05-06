import { Component, computed, effect, inject, signal, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem, CdkDragStart } from '@angular/cdk/drag-drop';
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
  
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;
  
  public showToast = signal<string | null>(null);
  public isDraggingBoard = signal<boolean>(false);
  public isDraggingCard = signal<boolean>(false);

  private startX = 0;
  private scrollLeft = 0;
  private isMouseDown = false;

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

  public getLeadsByStage(stageId: string): Lead[] {
    return this.leadsService.leads().filter(l => l.current_stage_id === stageId);
  }

  public exibirToast(msg: string) {
    this.showToast.set(msg);
    setTimeout(() => this.showToast.set(null), 5000);
  }

  public openFunnelManager() {
    import('../funnel-management/funnel-management.component').then(m => {
      this.dialog.open(m.FunnelManagementComponent, {
        width: '500px'
      });
    });
  }

  public openLeadForm() {
    this.dialog.open(LeadFormComponent, {
      width: '600px',
      disableClose: true
    });
  }

  public openLeadDetails(lead: Lead) {
    this.leadsService.setCurrentLeadId(lead.id);
    // Aqui abriremos o LeadDetailsComponent (será criado a seguir)
    import('../lead-details/lead-details.component').then(m => {
      this.dialog.open(m.LeadDetailsComponent, {
        width: '800px',
        data: { lead }
      });
    });
  }

  public onDragStart(event: CdkDragStart) {
    this.isDraggingCard.set(true);
  }

  public onDragEnd() {
    this.isDraggingCard.set(false);
  }

  // --- Lógica de Drag-to-Scroll Horizontal ---
  public startDragging(e: MouseEvent) {
    if (this.isDraggingCard()) return;
    
    // Só inicia se o clique for no container ou nas colunas (não em cards/botões)
    const target = e.target as HTMLElement;
    if (target.closest('.lead-card') || target.closest('button') || target.closest('a')) return;

    this.isMouseDown = true;
    this.isDraggingBoard.set(true);
    this.startX = e.pageX - this.scrollContainer.nativeElement.offsetLeft;
    this.scrollLeft = this.scrollContainer.nativeElement.scrollLeft;
  }

  public stopDragging() {
    this.isMouseDown = false;
    this.isDraggingBoard.set(false);
  }

  public moveEvent(e: MouseEvent) {
    if (!this.isMouseDown || this.isDraggingCard()) return;
    e.preventDefault();
    const x = e.pageX - this.scrollContainer.nativeElement.offsetLeft;
    const scroll = (x - this.startX) * 1.5; // Multiplicador de velocidade
    this.scrollContainer.nativeElement.scrollLeft = this.scrollLeft - scroll;
  }

  public drop(event: CdkDragDrop<Lead[]>, newStageId: string) {
    this.onDragEnd();
    if (event.previousContainer === event.container) {
      return;
    }
    
    const lead = event.item.data as Lead;
    this.leadsService.moveLeadToStage(lead.id, newStageId);
  }
}
