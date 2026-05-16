import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogRef } from '@angular/cdk/dialog';
import { LeadsService, FunnelStage } from '../../services/leads.service';

@Component({
  selector: 'app-funnel-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-container">
      <header class="modal-header">
        <h2>⚙️ Gerenciar Funil</h2>
        <button class="btn-close" (click)="close()">&times;</button>
      </header>

      <div class="modal-content">
        <p class="description">Adicione, renomeie ou reordene as etapas do seu processo comercial.</p>
        
        <div class="stage-list">
          @for (stage of stages(); track stage.id) {
            <div class="stage-item glass-card">
              <input [(ngModel)]="stage.name" (blur)="update(stage)" class="stage-input">
              <div class="actions">
                <span class="order">#{{ stage.position }}</span>
                <button class="btn-icon delete" (click)="delete(stage.id)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
              </div>
            </div>
          }

          <div class="add-stage">
            <input [(ngModel)]="newName" placeholder="Nome da nova etapa..." class="stage-input">
            <button class="btn-primary" (click)="add()">Adicionar</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-container { background: var(--zinc-950); border-radius: 16px; color: #fff; width: 500px; border: 1px solid var(--zinc-900); overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
    .modal-header { padding: 1.5rem 2rem; border-bottom: 1px solid var(--zinc-900); display: flex; justify-content: space-between; align-items: center; }
    .btn-close { background: transparent; border: none; color: var(--zinc-500); font-size: 1.5rem; cursor: pointer; padding: 0.5rem; line-height: 1; &:hover { color: #fff; } }
    .modal-content { padding: 2rem; }
    .description { color: var(--zinc-500); font-size: 0.875rem; margin-bottom: 2rem; line-height: 1.5; }
    .stage-list { display: flex; flex-direction: column; gap: 0.75rem; max-height: 400px; overflow-y: auto; padding-right: 0.5rem; }
    .stage-item { 
      padding: 1rem; display: flex; align-items: center; justify-content: space-between; 
      background: var(--zinc-900); border: 1px solid var(--zinc-800); border-radius: 12px;
      transition: border-color 0.2s;
      &:hover { border-color: var(--zinc-700); }
    }
    .stage-input { 
      background: transparent; border: none; color: #fff; font-size: 0.95rem; font-weight: 600; outline: none; flex-grow: 1;
      &::placeholder { color: var(--zinc-600); }
      &:focus { color: var(--indigo-400); }
    }
    .actions { display: flex; align-items: center; gap: 1rem; }
    .order { font-size: 0.75rem; color: var(--zinc-600); font-family: monospace; font-weight: 700; }
    .btn-icon.delete { 
      background: transparent; border: none; padding: 0.5rem; border-radius: 6px;
      color: var(--zinc-600); cursor: pointer; transition: all 0.2s; 
      &:hover { color: #ef4444; background: rgba(239, 68, 68, 0.1); } 
    }
    .add-stage { 
      margin-top: 2rem; display: flex; gap: 0.75rem; 
      .stage-input { 
        background: var(--zinc-900); padding: 0.75rem 1.25rem; border-radius: 10px; border: 1px solid var(--zinc-800);
        &:focus { border-color: var(--indigo-500); }
      } 
    }
    
    /* Custom Scrollbar */
    .stage-list::-webkit-scrollbar { width: 4px; }
    .stage-list::-webkit-scrollbar-thumb { background: var(--zinc-800); border-radius: 10px; }
  `]
})
export class FunnelManagementComponent {
  private leadsService = inject(LeadsService);
  private dialogRef = inject(DialogRef);
  
  public stages = this.leadsService.stages;
  public newName = '';

  public close() { this.dialogRef.close(); }

  public add() {
    if (!this.newName) return;
    const newOrder = this.stages().length + 1;
    this.leadsService.createStage({ name: this.newName, position: newOrder }).subscribe(() => {
      this.leadsService.fetchStages();
      this.newName = '';
    });
  }

  public update(stage: FunnelStage) {
    this.leadsService.updateStage(stage.id, { name: stage.name }).subscribe();
  }

  public delete(id: string) {
    const hasLeads = this.leadsService.leads().some(l => l.current_stage_id === id);
    if (hasLeads) {
      alert('Não é possível deletar uma etapa que possui leads ativos. Mova os leads primeiro!');
      return;
    }
    if (confirm('Tem certeza que deseja remover esta etapa?')) {
      this.leadsService.deleteStage(id).subscribe({
        next: () => this.leadsService.fetchStages(),
        error: (err) => {
          console.error('Erro ao deletar:', err);
          const errorMsg = err.error?.message || '';
          if (errorMsg.includes('violates foreign key constraint')) {
            alert('Não foi possível excluir: Existem CAMPANHAS vinculadas a esta etapa. Remova ou altere as campanhas primeiro.');
          } else {
            alert('Erro ao excluir: ' + (errorMsg || 'Verifique se você rodou o SQL de DELETE no Supabase.'));
          }
        }
      });
    }
  }
}
