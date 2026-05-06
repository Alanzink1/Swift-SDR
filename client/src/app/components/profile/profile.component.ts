import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="profile-container">
      <div class="profile-header glass-card">
        <div class="avatar-wrapper" (click)="avatarInput.click()">
          <div class="avatar-large" [style.background-image]="userAvatarUrl() ? 'url(' + userAvatarUrl() + ')' : ''" [class.has-image]="userAvatarUrl()">
            @if (!userAvatarUrl()) { {{ userData().name.charAt(0) }} }
            <div class="overlay">
              <span>Mudar Foto</span>
            </div>
          </div>
          <input #avatarInput type="file" (change)="onFileSelected($event, 'user')" accept="image/*" style="display: none;">
        </div>
        
        <div class="user-info">
          @if (isEditing()) {
            <input [(ngModel)]="userData().name" class="edit-input name-input">
            <input [(ngModel)]="userData().role" class="edit-input role-input">
          } @else {
            <h1>{{ userData().name }}</h1>
            <p>{{ userData().role }}</p>
          }
          <div class="header-actions">
            <span class="badge">Plano Pro</span>
            <button class="btn-edit" (click)="toggleEdit()">
              {{ isEditing() ? '✅ Salvar' : '✏️ Editar Perfil' }}
            </button>
          </div>
        </div>
      </div>

      <div class="profile-content">
        <section class="glass-card">
          <h3>Suas Informações</h3>
          <div class="data-row">
            <span class="label">E-mail</span>
            @if (isEditing()) {
              <input [(ngModel)]="userData().email" class="edit-input">
            } @else {
              <span class="value">{{ userData().email }}</span>
            }
          </div>
          <div class="data-row">
            <span class="label">Cargo</span>
            @if (isEditing()) {
              <input [(ngModel)]="userData().job_title" class="edit-input">
            } @else {
              <span class="value">{{ userData().job_title }}</span>
            }
          </div>
          <div class="data-row">
            <span class="label">Telefone</span>
            @if (isEditing()) {
              <input [(ngModel)]="userData().phone" class="edit-input" placeholder="+55 11 9 9999-9999">
            } @else {
              <span class="value">{{ userData().phone || 'Não informado' }}</span>
            }
          </div>
          <div class="data-row">
            <span class="label">LinkedIn</span>
            @if (isEditing()) {
              <input [(ngModel)]="userData().linkedin" class="edit-input" placeholder="linkedin.com/in/seu-perfil">
            } @else {
              <span class="value">{{ userData().linkedin || 'Não informado' }}</span>
            }
          </div>
        </section>

        <section class="glass-card">
          <h3>Sua Performance</h3>
          <div class="stats-mini">
            <div class="mini-card">
              <span class="num">150</span>
              <span class="tag">Mensagens Geradas</span>
            </div>
            <div class="mini-card">
              <span class="num">42</span>
              <span class="tag">Leads Convertidos</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .profile-container { padding: 2.5rem; max-width: 900px; margin: 0 auto; color: #fff; }
    .profile-header { padding: 3rem; display: flex; align-items: center; gap: 2rem; margin-bottom: 2rem; }
    
    .avatar-wrapper { cursor: pointer; position: relative; }
    .avatar-large { 
      width: 120px; height: 120px; border-radius: 32px; 
      background: linear-gradient(135deg, var(--indigo-600), var(--indigo-400));
      background-size: cover; background-position: center;
      display: flex; align-items: center; justify-content: center;
      font-size: 3.5rem; font-weight: 800; overflow: hidden;
      border: 2px solid rgba(255,255,255,0.1);
      transition: all 0.3s ease;

      &.has-image { font-size: 0; }
      
      .overlay {
        position: absolute; inset: 0; background: rgba(0,0,0,0.5);
        display: flex; align-items: center; justify-content: center;
        opacity: 0; transition: opacity 0.2s;
      }
      
      &:hover .overlay { opacity: 1; }
    }

    .user-info {
      h1 { font-size: 1.75rem; margin: 0; }
      p { color: var(--zinc-400); margin: 0.25rem 0 0.75rem 0; }
      .header-actions { display: flex; align-items: center; gap: 1rem; margin-top: 1rem; }
      .badge { background: var(--indigo-600); padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700; }
      .btn-edit { 
        background: transparent; border: 1px solid var(--zinc-700); color: var(--zinc-300); 
        padding: 0.25rem 0.75rem; border-radius: 8px; font-size: 0.75rem; cursor: pointer;
        transition: all 0.2s;
        &:hover { background: var(--zinc-800); color: #fff; }
      }
    }

    .edit-input {
      background: var(--zinc-900); border: 1px solid var(--zinc-800); border-radius: 8px;
      color: #fff; padding: 0.5rem 0.75rem; width: 100%; outline: none; margin-bottom: 0.5rem;
      &:focus { border-color: var(--indigo-500); }
      &.name-input { font-size: 1.75rem; font-weight: 700; height: auto; }
      &.role-input { font-size: 1rem; color: var(--zinc-400); }
    }
    .profile-content { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    section { padding: 2rem; border-radius: 20px; h3 { margin-bottom: 1.5rem; font-size: 1rem; color: var(--zinc-400); text-transform: uppercase; letter-spacing: 0.05em; } }
    .data-row { 
      margin-bottom: 1.5rem;
      .label { display: block; font-size: 0.75rem; color: var(--zinc-500); text-transform: uppercase; margin-bottom: 0.25rem; }
      .value { font-size: 1rem; color: #fff; font-weight: 500; }
    }
    .stats-mini { display: grid; grid-template-columns: 1fr; gap: 1rem; }
    .mini-card { 
      background: rgba(255,255,255,0.03); padding: 1.25rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);
      .num { display: block; font-size: 2rem; font-weight: 800; color: var(--indigo-400); }
      .tag { font-size: 0.8rem; color: var(--zinc-500); font-weight: 500; }
    }
  `]
})
export class ProfileComponent {
  private storageService = inject(StorageService);
  
  public userAvatarUrl = signal<string | null>(localStorage.getItem('user_avatar'));
  public isUploading = signal<boolean>(false);
  public isEditing = signal<boolean>(false);

  public userData = signal({
    name: 'Alan Rodrigues',
    role: 'SDR Sênior • Administrador',
    email: 'alan@swiftsdr.com.br',
    job_title: 'Senior Architect / SDR',
    phone: '',
    linkedin: ''
  });

  public toggleEdit() {
    if (this.isEditing()) {
      localStorage.setItem('user_profile', JSON.stringify(this.userData()));
    }
    this.isEditing.set(!this.isEditing());
  }

  public onFileSelected(event: any, type: 'user') {
    const file = event.target.files[0];
    if (!file) return;

    this.isUploading.set(true);
    const fileName = `user-avatar-${Date.now()}.${file.name.split('.').pop()}`;
    
    this.storageService.uploadLogo(file, fileName).subscribe({
      next: () => {
        const publicUrl = this.storageService.getPublicUrl(fileName);
        this.userAvatarUrl.set(publicUrl);
        localStorage.setItem('user_avatar', publicUrl);
        this.isUploading.set(false);
      },
      error: (err) => {
        console.error('Upload error:', err);
        alert('Erro ao fazer upload. Verifique as permissões de RLS.');
        this.isUploading.set(false);
      }
    });
  }
}
