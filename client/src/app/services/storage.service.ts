import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private http = inject(HttpClient);

  private getSupabaseHeaders(contentType: string = 'image/png') {
    return new HttpHeaders({
      'apikey': environment.supabaseAnonKey,
      'Authorization': `Bearer ${environment.supabaseAnonKey}`,
      'Content-Type': contentType,
      'x-upsert': 'true'
    });
  }

  /**
   * Faz upload de uma imagem para o bucket 'logos'
   * @param file Arquivo selecionado
   * @param path Caminho no bucket (ex: 'workspace-1/logo.png')
   */
  public uploadLogo(file: File, path: string): Observable<any> {
    const url = `${environment.supabaseUrl}/storage/v1/object/logos/${path}`;
    const headers = this.getSupabaseHeaders(file.type);
    
    return this.http.post(url, file, { headers });
  }

  /**
   * Retorna a URL pública de um objeto
   */
  public getPublicUrl(path: string): string {
    return `${environment.supabaseUrl}/storage/v1/object/public/logos/${path}`;
  }
}
