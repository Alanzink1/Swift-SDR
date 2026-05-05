import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Database } from '../../../../server/src/types/supabase';

export type AiMessage = Database['public']['Tables']['ai_messages']['Row'];
export type Lead = Database['public']['Tables']['leads']['Row'];

@Injectable({
  providedIn: 'root'
})
export class LeadsService {
  private http = inject(HttpClient);

  private _isGeneratingMessage = signal<boolean>(false);
  private _generatedMessages = signal<AiMessage[]>([]);
  private _error = signal<string | null>(null);
  private _currentLeadId = signal<string | null>(null);

  // Master Leads State
  private _leads = signal<Lead[]>([
    {
      id: '10000000-0000-0000-0000-000000000001',
      workspace_id: 'ws-1',
      current_stage_id: 'stage-base',
      assigned_to: null,
      name: 'João Silva',
      email: 'joao@techcorp.com',
      phone: '11999999999',
      company: 'TechCorp',
      job_title: 'CTO',
      custom_values: null,
      created_at: new Date().toISOString()
    },
    {
      id: '20000000-0000-0000-0000-000000000002',
      workspace_id: 'ws-1',
      current_stage_id: 'stage-mapeado',
      assigned_to: null,
      name: 'Maria Souza',
      email: 'maria@innovate.io',
      phone: '', 
      company: 'Innovate',
      job_title: '', 
      custom_values: { segmento: 'SaaS' },
      created_at: new Date().toISOString()
    }
  ]);

  public readonly isGeneratingMessage = this._isGeneratingMessage.asReadonly();
  public readonly error = this._error.asReadonly();
  public readonly currentLeadId = this._currentLeadId.asReadonly();
  public readonly allGeneratedMessages = this._generatedMessages.asReadonly();
  public readonly leads = this._leads.asReadonly();

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

    if (environment.useMock) {
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

    // INJEÇÃO EXPLÍCITA DE HEADERS (Exigência do Arquiteto)
    // Buscamos o token da sessão ou usamos a anon_key como fallback
    const sessionToken = localStorage.getItem('sb-token');
    const authHeader = sessionToken ? `Bearer ${sessionToken}` : `Bearer ${environment.supabaseAnonKey}`;

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': authHeader,
      'apikey': environment.supabaseAnonKey
    };

    this.http.post<{ data: AiMessage }>(url, payload, { headers }).subscribe({
      next: (response) => {
        this._generatedMessages.update(messages => [...messages, response.data]);
        this._isGeneratingMessage.set(false);
      },
      error: (err) => {
        console.error('Error generating AI message:', err);
        this._error.set(err.error?.error || 'Falha ao gerar a mensagem com a IA. Verifique os logs da Edge Function.');
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

  public moveLeadToStage(leadId: string, newStageId: string) {
    this._leads.update(leads => 
      leads.map(lead => 
        lead.id === leadId ? { ...lead, current_stage_id: newStageId } : lead
      )
    );
    // Em produção, isso faria uma chamada PATCH para a API do Supabase.
    // this.http.patch(`${environment.supabaseUrl}/rest/v1/leads?id=eq.${leadId}`, { current_stage_id: newStageId }).subscribe();
  }
}
