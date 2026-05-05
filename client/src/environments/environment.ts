export const environment = {
  production: false,
  useMock: false,
  supabaseUrl: 'https://fdpdkynkrghwpyenplpo.supabase.co',
  // O Supabase exige que o formato seja válido (três partes separadas por ponto) senão a Edge Function nem é chamada.
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsImF1ZCI6ImFub24iLCJyb2xlIjoiYW5vbiIsImV4cCI6MjEyNDIzODAzN30.COLE_SUA_ANON_KEY_REAL_AQUI'
};
