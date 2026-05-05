import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Database } from '../../../../server/src/types/supabase';

export type AiMessage = Database['public']['Tables']['ai_messages']['Row'];
export type Lead = Database['public']['Tables']['leads']['Row'];
export type LeadInsert = Database['public']['Tables']['leads']['Insert'];
export type Campaign = Database['public']['Tables']['campaigns']['Row'];
export type Stage = { id: string; name: string };

@Injectable({
  providedIn: 'root'
})
export class LeadsService {
  private http = inject(HttpClient);

  private _isInitialLoading = signal<boolean>(true);
  private _isGeneratingMessage = signal<boolean>(false);
  private _generatedMessages = signal<AiMessage[]>([]);
  private _error = signal<string | null>(null);
  private _currentLeadId = signal<string | null>(null);
  private _activeCampaignId = signal<string | null>(null);

  // Master Leads State - Vazio no início
  private _leads = signal<Lead[]>([]);
  private _stages = signal<Stage[]>([]); // Será populado pelo banco

  public readonly isInitialLoading = this._isInitialLoading.asReadonly();
  public readonly isGeneratingMessage = this._isGeneratingMessage.asReadonly();
  public readonly error = this._error.asReadonly();
  public readonly currentLeadId = this._currentLeadId.asReadonly();
  public readonly allGeneratedMessages = this._generatedMessages.asReadonly();
  public readonly leads = this._leads.asReadonly();
  public readonly activeCampaignId = this._activeCampaignId.asReadonly();
  public readonly stages = this._stages.asReadonly();

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

  private getSupabaseHeaders(): HttpHeaders {
    const key = environment.supabaseAnonKey;
    
    // Sanity Check
    if (!key || key.includes('COLE_SUA_ANON_KEY')) {
      throw new Error('Chave Supabase não configurada corretamente no environment.ts!');
    }

    // Log de Request (Segurança/Debug)
    console.log(`[Supabase Auth] Iniciando request com chave: ${key.substring(0, 5)}...`);

    const sessionToken = localStorage.getItem('sb-token');
    const authHeader = sessionToken ? `Bearer ${sessionToken}` : `Bearer ${key}`;

    return new HttpHeaders({
      'apikey': key,
      'Authorization': authHeader,
      'Content-Type': 'application/json'
    });
  }

  // Busca lista real de Leads via Supabase REST API
  public fetchLeads() {
    this._isInitialLoading.set(true);
    const url = `${environment.supabaseUrl}/rest/v1/leads?select=*`;
    
    try {
      const headers = this.getSupabaseHeaders();
      this.http.get<Lead[]>(url, { headers }).subscribe({
        next: (data) => {
          this._leads.set(data || []);
          this._isInitialLoading.set(false);
        },
        error: (err) => {
          console.error('Error fetching leads:', err);
          this._error.set('Falha ao carregar leads. Verifique suas permissões (RLS).');
          this._isInitialLoading.set(false);
        }
      });
    } catch (e: any) {
      this._error.set(e.message);
      this._isInitialLoading.set(false);
    }
  }

  // Busca as etapas do funil para garantir UUIDs reais
  public fetchStages() {
    const url = `${environment.supabaseUrl}/rest/v1/funnel_stages?select=id,name&order=position.asc`;
    const fallbackStages: Stage[] = [
      { id: '00000000-0000-0000-0000-000000000001', name: 'Lead Base' },
      { id: '00000000-0000-0000-0000-000000000002', name: 'Mapeado' },
      { id: '00000000-0000-0000-0000-000000000003', name: 'Tentando Contato' }
    ];

    try {
      const headers = this.getSupabaseHeaders();
      this.http.get<any[]>(url, { headers }).subscribe({
        next: (data) => {
          if (data && data.length > 0) {
            this._stages.set(data.map(s => ({ id: s.id, name: s.name })));
          } else {
            console.warn('[LeadsService] Banco retornou 0 etapas. Usando fallback.');
            this._stages.set(fallbackStages);
          }
        },
        error: (err) => {
          console.error('Error fetching stages:', err);
          this._stages.set(fallbackStages);
        }
      });
    } catch (e: any) {
      console.error(e.message);
      this._stages.set(fallbackStages);
    }
  }

  // Busca a primeira Campanha ativa para dinamizar a IA
  public fetchActiveCampaign() {
    const url = `${environment.supabaseUrl}/rest/v1/campaigns?select=*&limit=1`;
    
    try {
      const headers = this.getSupabaseHeaders();
      this.http.get<Campaign[]>(url, { headers }).subscribe({
        next: (data) => {
          if (data && data.length > 0) {
            this._activeCampaignId.set(data[0].id);
          } else {
            this._error.set('Nenhuma campanha ativa encontrada. Crie uma no banco para gerar mensagens.');
          }
        },
        error: (err) => {
          console.error('Error fetching campaigns:', err);
          this._error.set('Falha ao carregar campanhas.');
        }
      });
    } catch (e: any) {
      this._error.set(e.message);
    }
  }

  public generateAiMessage(leadId: string) {
    const campaignId = this._activeCampaignId();
    if (!campaignId) {
      this._error.set('Operação bloqueada: Campanha não encontrada.');
      return;
    }

    this._isGeneratingMessage.set(true);
    this._error.set(null);

    if (this._currentLeadId() !== leadId) {
       this.setCurrentLeadId(leadId);
    }

    const payload = { leadId, campaignId };
    const url = `${environment.supabaseUrl}/functions/v1/generate-message`;

    try {
      const headers = this.getSupabaseHeaders();

      this.http.post<{ data: AiMessage }>(url, payload, { headers }).subscribe({
      next: (response) => {
        this._generatedMessages.update(messages => [...messages, response.data]);
        this._isGeneratingMessage.set(false);
      },
      error: (err) => {
        console.error('Error generating AI message:', err);
        this._error.set(err.error?.error || 'Falha ao gerar a mensagem com a IA.');
        this._isGeneratingMessage.set(false);
      }
    });
    } catch (error) {
      console.error('Error in generateMessage:', error);
      this._error.set('Erro ao gerar a mensagem com a IA.');
      this._isGeneratingMessage.set(false);
    }
  }

  public loadMessagesForLead(messages: AiMessage[]) {
     this._generatedMessages.update(current => {
       const newMessages = messages.filter(m => !current.find(c => c.id === m.id));
       return [...current, ...newMessages];
     });
  }

  public createLead(lead: LeadInsert) {
    const url = `${environment.supabaseUrl}/rest/v1/leads`;
    const headers = this.getSupabaseHeaders();
    
    // Configura headers para retornar o objeto inserido (Senior Pattern)
    const postHeaders = headers.set('Prefer', 'return=representation');

    return this.http.post<Lead[]>(url, lead, { headers: postHeaders });
  }

  public addLeadToSignal(lead: Lead) {
    this._leads.update(current => [lead, ...current]);
  }

  public moveLeadToStage(leadId: string, newStageId: string) {
    this._leads.update(leads => 
      leads.map(lead => 
        lead.id === leadId ? { ...lead, current_stage_id: newStageId } : lead
      )
    );
    
    // Atualização persistente no banco (PATCH)
    try {
      const headers = this.getSupabaseHeaders();

      this.http.patch(`${environment.supabaseUrl}/rest/v1/leads?id=eq.${leadId}`, 
        { current_stage_id: newStageId }, 
        { headers }
      ).subscribe({
        error: (err) => {
          console.error('Error moving lead in DB:', err);
          this._error.set('Falha ao atualizar etapa do Lead no banco.');
        }
      });
    } catch (e: any) {
      this._error.set(e.message);
    }
  }
}
