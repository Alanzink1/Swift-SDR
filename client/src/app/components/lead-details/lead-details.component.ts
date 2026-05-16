import { Component, Inject, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { LeadsService, Lead, AiMessage } from '../../services/leads.service';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-lead-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lead-details.component.html',
  styleUrls: ['./lead-details.component.scss']
})
export class LeadDetailsComponent {
  public leadsService = inject(LeadsService);
  private dialogRef = inject(DialogRef);

  public isGenerating = this.leadsService.isGeneratingMessage;
  public messages = this.leadsService.messagesForCurrentLead;
  public error = this.leadsService.error;
  public isEditingData = signal<boolean>(false);
  public editedMessage = signal<string>('');
  public workspaceLogo = signal<string | null>(localStorage.getItem('workspace_logo'));
  public workspaceName = signal<string>(localStorage.getItem('workspace_name') || 'Swift-SDR');

  public latestMessage = computed(() => {
    const msgs = this.messages();
    return msgs.length > 0 ? msgs[msgs.length - 1] : null;
  });

  constructor(@Inject(DIALOG_DATA) public data: { lead: Lead }) {
    this.leadsService.setCurrentLeadId(data.lead.id);
    this.leadsService.fetchMessagesForLead(data.lead.id);
  }

  public getStageName(id: string): string {
    return this.leadsService.stages().find(s => s.id === id)?.name || id;
  }

  public close() {
    this.dialogRef.close();
  }

  public toggleEdit() {
    this.isEditingData.update(v => !v);
  }

  public saveLeadChanges() {
    this.leadsService.updateLead(this.data.lead.id, {
      email: this.data.lead.email,
      phone: this.data.lead.phone
    }).subscribe(() => {
      this.isEditingData.set(false);
    });
  }

  public onMessageChange(value: string) {
    this.editedMessage.set(value);
  }

  public gerarMensagem() {
    this.leadsService.generateAiMessage(this.data.lead.id);
  }

  public enviarWhatsApp() {
    const lead = this.data.lead;
    const message = this.editedMessage() || this.latestMessage()?.content;
    
    if (!message) return;

    // 1. Abre o WhatsApp com o texto exato do textarea
    const phone = lead.phone?.replace(/\D/g, '');
    const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');

    // 2. Update otimista: move o lead no Signal → Kanban pula IMEDIATAMENTE
    this.leadsService.moveLeadToContactByName(lead.id);

    // 3. Fecha o modal
    this.dialogRef.close();
  }

  public copiarEEnviar() {
    const finalMsg = this.editedMessage() || this.latestMessage()?.content;
    if (finalMsg) {
      navigator.clipboard.writeText(finalMsg).then(() => {
        this.leadsService.moveLeadToContactByName(this.data.lead.id);
        this.dialogRef.close();
      });
    }
  }

  public formatarData(data: string) {
    return new Date(data).toLocaleString('pt-BR');
  }
}
