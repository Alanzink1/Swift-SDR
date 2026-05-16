import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Sempre inclui Content-Type e a apikey (anon_key) para o Supabase
  let headers = req.headers
    .set('Content-Type', 'application/json')
    .set('apikey', environment.supabaseAnonKey);

  // Lê a sessão ativa do usuário (sb-token) do localStorage
  // Se não houver usuário logado (ex: teste), a própria Edge Function pode aceitar a chamada anônima 
  // se o RLS ou código interno permitir, ou utilizamos a anon_key como fallback de Autorização para a chamada.
  const token = localStorage.getItem('sb-token') || environment.supabaseAnonKey; 
  
  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }

  const clonedRequest = req.clone({ headers });

  return next(clonedRequest);
};
