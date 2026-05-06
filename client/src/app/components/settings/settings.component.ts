import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="settings-container">
      <header>
        <h1>Configurações</h1>
        <p>Gerencie sua conta e as integrações do Swift-SDR.</p>
      </header>
      
      <div class="settings-grid">
        <section class="glass-card">
          <h3>Integração Supabase</h3>
          <div class="setting-item">
            <label>API Key</label>
            <input type="password" value="••••••••••••••••" disabled />
          </div>
          <div class="setting-item">
            <label>Projeto Ref</label>
            <input type="text" value="fdpdkynkrghwpyenplpo" disabled />
          </div>
        </section>

        <section class="glass-card">
          <h3>Geração de IA</h3>
          <div class="setting-item">
            <label>Modelo Padrão</label>
            <select>
              <option>Gemini 1.5 Flash</option>
              <option>Gemini 1.5 Pro</option>
            </select>
          </div>
          <div class="setting-item">
            <label>Idioma de Saída</label>
            <select>
              <option>Português (BR)</option>
              <option>Inglês (US)</option>
            </select>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .settings-container { padding: 2.5rem; max-width: 1000px; margin: 0 auto; color: #fff; }
    header { margin-bottom: 2.5rem; }
    h1 { font-size: 2rem; font-weight: 700; margin-bottom: 0.5rem; }
    p { color: var(--zinc-500); }
    .settings-grid { display: grid; gap: 2rem; }
    section { padding: 2rem; h3 { margin-bottom: 1.5rem; font-size: 1.1rem; } }
    .setting-item { 
      display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.25rem;
      label { font-size: 0.8rem; color: var(--zinc-500); font-weight: 600; text-transform: uppercase; }
      input, select { 
        background: var(--zinc-900); border: 1px solid var(--zinc-800); 
        padding: 0.75rem; border-radius: 8px; color: #fff; outline: none;
        &:disabled { opacity: 0.5; cursor: not-allowed; }
      }
    }
  `]
})
export class SettingsComponent {}
