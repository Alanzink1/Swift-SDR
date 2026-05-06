import { createClient } from "@supabase/supabase-js"
import { Database } from "../../../src/types/supabase.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const trackingId = crypto.randomUUID();
  console.info(`[${trackingId}] Request started`);

  try {
    const body = await req.json()
    const { leadId, campaignId: providedCampaignId, context } = body

    const sender   = context?.senderName           || 'Consultor';
    const role     = context?.senderRole            || 'SDR';
    const org      = context?.organizationName      || 'Nossa Empresa';
    const desc     = context?.organizationDescription || 'soluções inovadoras';
    const phone    = context?.senderPhone           || '';
    const linkedin = context?.senderLinkedIn        || '';

    const supabaseClient = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // 1. Busca o Lead
    const { data: lead, error: leadErr } = await supabaseClient
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single()

    if (leadErr || !lead) throw new Error('Lead não encontrado.');

    // 2. Resolve campaignId (payload → lead → etapa)
    let campaignId = providedCampaignId || lead.campaign_id;

    if (!campaignId) {
      const { data: stageCampaign } = await supabaseClient
        .from('campaigns')
        .select('id')
        .eq('trigger_stage_id', lead.current_stage_id)
        .limit(1)
        .maybeSingle()
      campaignId = stageCampaign?.id;
    }

    if (!campaignId) throw new Error('Associe este lead a uma campanha para habilitar a IA.');

    // 3. Busca Campanha
    const { data: campaign, error: campErr } = await supabaseClient
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()

    if (campErr || !campaign) throw new Error('Configuração da campanha não encontrada.');

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) throw new Error("GEMINI_API_KEY não configurada.");

    // 4. Auto-descoberta de modelo
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const listData = await listRes.json();
    const availableModels = listData.models?.map((m: any) => m.name) || [];
    const modelToUse = availableModels.find((m: string) => m.toLowerCase().includes("gemini-1.5-flash")) || availableModels[0];

    if (!modelToUse) throw new Error("Nenhum modelo Gemini disponível.");

    const leadName    = lead.name      || 'profissional';
    const leadCompany = lead.company   || 'sua organização';
    const leadJob     = lead.job_title || 'especialista';

    // 5. Monta assinatura real
    const signatureParts = [`${sender}`, `${role} | ${org}`];
    if (phone)    signatureParts.push(phone);
    if (linkedin) signatureParts.push(linkedin);
    const signature = signatureParts.join('\n');

    // 6. Prompt de Elite — Hook-Value-CTA
    const systemInstruction = `Você é um SDR de Elite B2B. Sua única função é escrever o corpo de um e-mail de prospecção.
REGRAS ABSOLUTAS:
- NUNCA use colchetes [ ] ou placeholders. Use apenas os dados reais fornecidos.
- NUNCA use: "estagiário", "treinamento", "desafio inusitado", "prezado", "espero que esteja bem", "Opção 1", "---".
- O e-mail deve ter exatamente 3 blocos curtos após a saudação + assinatura ao final.
- Máximo 120 palavras no corpo (excluindo assinatura).
- Não adicione explicações, notas ou qualquer texto fora do e-mail.`;

    const userPrompt = `Escreva um e-mail de prospecção B2B de alto impacto.

DADOS DO LEAD: ${leadName}, ${leadJob} na ${leadCompany}.
REMETENTE: ${sender}, ${role} na ${org} — ${desc}.

ESTRUTURA OBRIGATÓRIA (use exatamente este formato):
Olá, ${leadName}

[HOOK: Uma pergunta direta sobre uma dor de gestão real do cargo "${leadJob}" na ${leadCompany}. Ex: "${leadName}, como a ${leadCompany} garante a saúde mental do time em picos de entrega?"]

[VALUE: O produto como ferramenta de cultura e descompressão tátil da ${org}. Inclua um resultado numérico. Ex: "Implementamos um protocolo de alívio tátil que reduziu a percepção de fadiga em 20% no nosso P&D."]

[CTA: Uma pergunta direta de baixo atrito. Ex: "Faz sentido te enviar um exemplar para teste na sua equipe?"]

Atenciosamente,

${signature}`;

    // 7. Chama Gemini
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${modelToUse}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: { maxOutputTokens: 350, temperature: 0.75 }
      })
    });

    const result = await response.json();
    if (result.error) throw new Error(`IA Error: ${result.error.message}`);

    const generatedMessage = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!generatedMessage) throw new Error("A IA retornou uma resposta vazia.");

    // 8. Persiste
    const { data: aiMessage, error: insertError } = await supabaseClient
      .from('ai_messages')
      .insert({ lead_id: leadId, campaign_id: campaignId, content: generatedMessage, is_sent: false })
      .select().single()

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ data: aiMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })

  } catch (error) {
    console.error(`[${trackingId}] Erro:`, error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }
})
