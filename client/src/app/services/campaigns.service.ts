import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Database } from '../../../../server/src/types/supabase';
import { Observable } from 'rxjs';

export type Campaign = Database['public']['Tables']['campaigns']['Row'];
export type CampaignInsert = Database['public']['Tables']['campaigns']['Insert'];

@Injectable({
  providedIn: 'root'
})
export class CampaignsService {
  private http = inject(HttpClient);
  
  private _campaigns = signal<Campaign[]>([]);
  private _isLoading = signal<boolean>(false);
  private _error = signal<string | null>(null);

  public readonly campaigns = this._campaigns.asReadonly();
  public readonly isLoading = this._isLoading.asReadonly();
  public readonly error = this._error.asReadonly();

  private getSupabaseHeaders(): HttpHeaders {
    const key = environment.supabaseAnonKey;
    if (!key || key.includes('COLE_SUA_ANON_KEY')) {
      throw new Error('Chave Supabase não configurada!');
    }
    
    console.log(`[Campaigns API] Header Check: ${key.substring(0, 5)}...`);
    
    const sessionToken = localStorage.getItem('sb-token');
    const authHeader = sessionToken ? `Bearer ${sessionToken}` : `Bearer ${key}`;

    return new HttpHeaders({
      'apikey': key,
      'Authorization': authHeader,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    });
  }

  public fetchCampaigns() {
    this._isLoading.set(true);
    const url = `${environment.supabaseUrl}/rest/v1/campaigns?select=*`;
    
    try {
      const headers = this.getSupabaseHeaders();
      this.http.get<Campaign[]>(url, { headers }).subscribe({
        next: (data) => {
          this._campaigns.set(data || []);
          this._isLoading.set(false);
        },
        error: (err) => {
          console.error('Error fetching campaigns:', err);
          this._error.set('Falha ao carregar campanhas.');
          this._isLoading.set(false);
        }
      });
    } catch (e: any) {
      this._error.set(e.message);
      this._isLoading.set(false);
    }
  }

  public createCampaign(campaign: CampaignInsert): Observable<Campaign[]> {
    const url = `${environment.supabaseUrl}/rest/v1/campaigns`;
    const headers = this.getSupabaseHeaders();
    
    return this.http.post<Campaign[]>(url, campaign, { headers });
  }

  public clearError() {
    this._error.set(null);
  }
}
