import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Database } from '../../../../server/src/types/supabase';

type AiMessage = Database['public']['Tables']['ai_messages']['Row'];

@Injectable({
  providedIn: 'root'
})
export class LeadsService {
  private http = inject(HttpClient);

  private _isGeneratingMessage = signal<boolean>(false);
  private _generatedMessages = signal<AiMessage[]>([]);
  private _error = signal<string | null>(null);
  private _currentLeadId = signal<string | null>(null);

  public readonly isGeneratingMessage = this._isGeneratingMessage.asReadonly();
  public readonly error = this._error.asReadonly();
  public readonly currentLeadId = this._currentLeadId.asReadonly();

  public readonly messagesForCurrentLead = computed(() => {
    const leadId = this._currentLeadId();
    if (!leadId) return [];
    return this._generatedMessages().filter(msg => msg.lead_id === leadId);
  });

  public setCurrentLeadId(leadId: string | null) {
    this._currentLeadId.set(leadId);
  }

  public clearError() {
    this._error.set(null);
  }

  public generateAiMessage(leadId: string, campaignId: string) {
    this._isGeneratingMessage.set(true);
    this._error.set(null);

    if (this._currentLeadId() !== leadId) {
       this.setCurrentLeadId(leadId);
    }

    if (!environment.production) {
      const mockMessage: AiMessage = {
        id: crypto.randomUUID(),
        lead_id: leadId,
        campaign_id: campaignId,
        content: `(MOCK) Olá! Vi que você trabalha na empresa X. Temos uma excelente oportunidade para o seu momento de negócio. Vamos agendar uma breve conversa?`,
        is_sent: false,
        created_at: new Date().toISOString()
      };

      of({ data: mockMessage })
        .pipe(delay(1500))
        .subscribe({
          next: (response) => {
            this._generatedMessages.update(messages => [...messages, response.data]);
            this._isGeneratingMessage.set(false);
          },
          error: () => {
            this._error.set('Erro ao simular mock.');
            this._isGeneratingMessage.set(false);
          }
        });
      return;
    }

    const payload = { leadId, campaignId };
    const url = `${environment.supabaseUrl}/functions/v1/generate-message`;

    this.http.post<{ data: AiMessage }>(url, payload).subscribe({
      next: (response) => {
        this._generatedMessages.update(messages => [...messages, response.data]);
        this._isGeneratingMessage.set(false);
      },
      error: (err) => {
        console.error('Error generating AI message:', err);
        this._error.set(err.error?.error || 'Falha ao gerar a mensagem com a IA. Tente novamente.');
        this._isGeneratingMessage.set(false);
      }
    });
  }

  public loadMessagesForLead(messages: AiMessage[]) {
     this._generatedMessages.update(current => {
       const newMessages = messages.filter(m => !current.find(c => c.id === m.id));
       return [...current, ...newMessages];
     });
  }
}
