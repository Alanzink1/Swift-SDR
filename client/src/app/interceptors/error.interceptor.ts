import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Ocorreu um erro inesperado.';

      if (error.status === 401) {
        errorMessage = 'Sessão expirada ou não autorizada. Verifique suas chaves de API.';
      } else if (error.status === 403 || (error.error && error.error.code === '42501')) {
        errorMessage = 'Erro de permissão (RLS): Você não tem permissão para acessar este recurso.';
      } else if (error.status === 404) {
        errorMessage = 'Recurso não encontrado.';
      } else if (error.error && typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error.error && error.error.message) {
        errorMessage = error.error.message;
      }

      console.error(`[Error Interceptor] ${error.status}: ${errorMessage}`, error);
      
      // Aqui poderíamos injetar um serviço de Toast/Snackbar para mostrar ao usuário
      return throwError(() => new Error(errorMessage));
    })
  );
};
