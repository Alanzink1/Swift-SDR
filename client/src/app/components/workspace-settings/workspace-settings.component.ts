import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-workspace-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-container">
      <header class="page-header">
        <div class="header-content">
          <h1>🏢 Configurações da Organização</h1>
          <p>Gerencie a identidade visual e os campos de dados da sua empresa.</p>
        </div>
        <button class="btn-save-main" (click)="saveAll()" [class.success]="showSuccess()">
          @if (showSuccess()) { 
            <span>✅ Salvo com Sucesso!</span> 
          } @else { 
            <span>💾 Salvar Alterações</span> 
          }
        </button>
      </header>

      <div class="settings-grid">
        <!-- Lado Esquerdo: Identidade -->
        <div class="settings-column">
          <section class="glass-card identity-section">
            <h3>IDENTIDADE VISUAL</h3>
            <div class="logo-upload">
              <div class="current-logo" [style.backgroundImage]="'url(' + logoUrl() + ')'" *ngIf="logoUrl()"></div>
              <div class="logo-placeholder" *ngIf="!logoUrl()">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h7"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L12 15"/></svg>
              </div>
              <div class="upload-info">
                <h4>Logo da Empresa</h4>
                <p>Recomendado: 512x512px (PNG ou JPG)</p>
                <input type="file" (change)="onLogoSelected($event)" accept="image/*" id="logoInput" hidden>
                <label for="logoInput" class="btn-xs-primary">Alterar Logo</label>
              </div>
            </div>

            <div class="input-group">
              <label>Nome da Organização</label>
              <input [(ngModel)]="workspaceName" placeholder="Ex: Swift-SDR Startup">
            </div>

            <div class="input-group">
              <label>O que sua empresa faz? (Descrição Curta)</label>
              <textarea [(ngModel)]="workspaceDescription" placeholder="Ex: Soluções de software inovadoras para otimizar processos..."></textarea>
            </div>
          </section>

          <section class="glass-card">
            <h3>Assinatura e Plano</h3>
            <div class="plan-badge enterprise">Plano Enterprise</div>
            <p class="plan-detail">Sua conta possui acesso ilimitado a todos os recursos de IA.</p>
          </section>
        </div>

        <!-- Lado Direito: Campos Customizados -->
        <div class="settings-column">
          <section class="glass-card fields-section">
            <div class="section-header">
              <h3>Campos Customizados</h3>
              <button class="btn-xs-primary" (click)="addNewField()">+ Novo Campo</button>
            </div>
            <p class="description">Defina quais dados extras seus leads devem ter nesta organização.</p>
            
            <div class="fields-list">
              @for (field of customFields(); track field.id) {
                <div class="field-item">
                  <div class="field-info">
                    <input [(ngModel)]="field.name" class="inline-edit-input" (blur)="saveFields()">
                    <select [(ngModel)]="field.type" (change)="saveFields()">
                      <option value="text">Texto</option>
                      <option value="number">Número</option>
                      <option value="select">Seleção</option>
                    </select>
                  </div>
                  <button class="btn-remove" (click)="removeField(field.id)">×</button>
                </div>
              } @empty {
                <div class="empty-fields">Nenhum campo customizado criado ainda.</div>
              }
            </div>
          </section>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-container { padding: 2.5rem; max-width: 1200px; margin: 0 auto; color: #fff; }
    .page-header { 
      margin-bottom: 2.5rem; display: flex; justify-content: space-between; align-items: center;
      h1 { font-size: 2rem; font-weight: 800; margin: 0; } 
      p { color: var(--zinc-500); margin: 0.5rem 0 0 0; } 
    }

    .btn-save-main {
      background: linear-gradient(135deg, var(--indigo-600), var(--indigo-500));
      color: #fff; border: none; padding: 0.75rem 1.5rem; border-radius: 10px;
      font-weight: 700; cursor: pointer; transition: all 0.3s;
      box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);
      
      &:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4); }
      &.success { background: #10b981; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3); }
    }

    .settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
    .settings-column { display: flex; flex-direction: column; gap: 2rem; }
    
    section { padding: 2rem; h3 { font-size: 1rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--zinc-400); margin-bottom: 1.5rem; } }
    
    .logo-upload-area { 
      display: flex; align-items: center; gap: 1.5rem; margin-bottom: 2rem; cursor: pointer;
      .logo-preview {
        width: 80px; height: 80px; border-radius: 12px; background: var(--indigo-600);
        display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 800;
        position: relative; overflow: hidden; background-size: cover; background-position: center;
        .overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; font-size: 0.7rem; opacity: 0; transition: 0.2s; }
        &:hover .overlay { opacity: 1; }
      }
      h4 { margin: 0; font-size: 1rem; }
      p { margin: 0.25rem 0 0 0; font-size: 0.75rem; color: var(--zinc-500); }
    }

    .logo-upload {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      padding: 1rem;
      background: rgba(255,255,255,0.02);
      border: 1px solid var(--zinc-800);
      border-radius: 12px;
      margin-bottom: 1.5rem;

      .current-logo {
        width: 64px;
        height: 64px;
        border-radius: 10px;
        background-size: cover;
        background-position: center;
        border: 1px solid var(--zinc-700);
        flex-shrink: 0;
      }

      .logo-placeholder {
        width: 64px;
        height: 64px;
        border-radius: 10px;
        background: var(--zinc-900);
        border: 2px dashed var(--zinc-700);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--zinc-600);
        flex-shrink: 0;
      }

      .upload-info {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;

        h4 { margin: 0; font-size: 0.95rem; font-weight: 600; color: #fff; }
        p { margin: 0; font-size: 0.75rem; color: var(--zinc-500); }
      }
    }

    .input-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1.25rem;

      label {
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--zinc-500);
      }

      input, textarea {
        background: var(--zinc-900, #18181b);
        border: 1px solid var(--zinc-800, #27272a);
        border-radius: 10px;
        color: #fff;
        padding: 0.75rem 1rem;
        font-size: 0.9rem;
        width: 100%;
        outline: none;
        font-family: inherit;
        transition: border-color 0.2s, box-shadow 0.2s;
        box-sizing: border-box;

        &:focus {
          border-color: var(--indigo-500, #6366f1);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
        }

        &::placeholder { color: var(--zinc-600); }
      }

      textarea {
        min-height: 90px;
        resize: vertical;
        line-height: 1.5;
      }
    }

    .edit-input {
      background: var(--zinc-900); border: 1px solid var(--zinc-800); border-radius: 8px;
      color: #fff; padding: 0.75rem 1rem; width: 100%; outline: none;
      &:focus { border-color: var(--indigo-500); }
    }

    .plan-badge { 
      display: inline-block; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 700; font-size: 0.8rem;
      &.enterprise { background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff; }
    }
    .plan-detail { margin-top: 1rem; color: var(--zinc-500); font-size: 0.85rem; }

    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .btn-xs-primary { background: var(--indigo-600); border: none; color: #fff; padding: 0.4rem 0.8rem; border-radius: 6px; font-size: 0.75rem; cursor: pointer; }
    .description { font-size: 0.85rem; color: var(--zinc-500); margin-bottom: 1.5rem; }
    
    .fields-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .field-item { 
      padding: 0.75rem 1rem; background: rgba(255,255,255,0.03); border: 1px solid var(--zinc-800); border-radius: 10px;
      display: flex; justify-content: space-between; align-items: center;
      .field-info { display: flex; gap: 1rem; flex: 1; }
      .inline-edit-input { background: transparent; border: none; color: #fff; font-weight: 600; width: 60%; outline: none; }
      select { background: var(--zinc-900); border: 1px solid var(--zinc-800); color: var(--zinc-400); border-radius: 4px; font-size: 0.7rem; padding: 0.2rem; }
      .btn-remove { background: transparent; border: none; color: var(--zinc-600); cursor: pointer; font-size: 1.2rem; &:hover { color: #ef4444; } }
    }
    .empty-fields { text-align: center; padding: 2rem; color: var(--zinc-600); font-style: italic; font-size: 0.85rem; }
  `]
})
export class WorkspaceSettingsComponent {
  private storageService = inject(StorageService);
  
  public logoUrl = signal<string | null>(localStorage.getItem('workspace_logo'));
  public workspaceName = localStorage.getItem('workspace_name') || 'Swift-SDR Startup';
  public workspaceDescription = localStorage.getItem('workspace_description') || '';
  public customFields = signal<any[]>(JSON.parse(localStorage.getItem('workspace_custom_fields') || '[]'));
  public showSuccess = signal<boolean>(false);

  public saveAll() {
    localStorage.setItem('workspace_name', this.workspaceName);
    localStorage.setItem('workspace_description', this.workspaceDescription);
    localStorage.setItem('workspace_custom_fields', JSON.stringify(this.customFields()));
    
    // Feedback visual
    this.showSuccess.set(true);
    setTimeout(() => this.showSuccess.set(false), 3000);
  }

  public addNewField() {
    const newField = { id: Date.now().toString(), name: 'Novo Campo', type: 'text' };
    this.customFields.update(f => [...f, newField]);
    this.saveFields();
  }

  public removeField(id: string) {
    this.customFields.update(f => f.filter(field => field.id !== id));
    this.saveFields();
  }

  public saveFields() {
    localStorage.setItem('workspace_custom_fields', JSON.stringify(this.customFields()));
  }

  public onLogoSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const fileName = `workspace-logo-${Date.now()}.${file.name.split('.').pop()}`;
    this.storageService.uploadLogo(file, fileName).subscribe({
      next: () => {
        const publicUrl = this.storageService.getPublicUrl(fileName);
        this.logoUrl.set(publicUrl);
        localStorage.setItem('workspace_logo', publicUrl);
      }
    });
  }

  public saveWorkspaceName() {
    localStorage.setItem('workspace_name', this.workspaceName);
  }
}
