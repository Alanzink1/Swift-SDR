import { createClient } from "@supabase/supabase-js"
import { GoogleGenerativeAI } from "@google/generative-ai"
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
  console.info(`[${trackingId}] Request started for generate-message`);

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.warn(`[${trackingId}] Missing Authorization header`);
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const { leadId, campaignId } = body

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!leadId || !uuidRegex.test(leadId) || !campaignId || !uuidRegex.test(campaignId)) {
      console.warn(`[${trackingId}] Invalid payload schema: leadId=${leadId}, campaignId=${campaignId}`);
      return new Response(JSON.stringify({ error: 'Invalid leadId or campaignId. Must be valid UUIDs.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.info(`[${trackingId}] Processing leadId: ${leadId}, campaignId: ${campaignId}`);

    const supabaseClient = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    console.info(`[${trackingId}] Fetching lead and campaign data concurrently`);
    const [leadRes, campaignRes] = await Promise.all([
      supabaseClient.from('leads').select('*').eq('id', leadId).single(),
      supabaseClient.from('campaigns').select('*').eq('id', campaignId).single()
    ])

    if (leadRes.error || !leadRes.data) {
      console.error(`[${trackingId}] Failed to fetch lead:`, leadRes.error);
      return new Response(JSON.stringify({ error: 'Lead not found or access denied.' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (campaignRes.error || !campaignRes.data) {
      console.error(`[${trackingId}] Failed to fetch campaign:`, campaignRes.error);
      return new Response(JSON.stringify({ error: 'Campaign not found or access denied.' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const lead = leadRes.data;
    const campaign = campaignRes.data;

    const ai = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
    
    let generatedMessage = '';
    const modelsToTry = ['gemini-1.5-flash-latest', 'gemini-pro'];

    for (const modelName of modelsToTry) {
      try {
        console.info(`[${trackingId}] Attempting generation with model: ${modelName}`);
        const model = ai.getGenerativeModel({ model: modelName });
        
        const prompt = `
System Instruction / Persona:
${campaign.system_prompt || 'Você é um consultor de vendas sênior.'}

Campaign Context / Offer:
${campaign.context || 'Contexto da campanha não fornecido.'}

Lead Details:
Nome: ${lead.name || 'Desconhecido'}
Empresa: ${lead.company || 'Desconhecida'}
Cargo: ${lead.job_title || 'Desconhecido'}
Campos Customizados: ${JSON.stringify(lead.custom_values || {})}

Objective: 
Generate a highly personalized sales message to this lead, following the system instructions and campaign context precisely. Ensure the tone is appropriate for the given persona. The output should be just the final message body.
        `;

        const result = await model.generateContent(prompt);
        generatedMessage = result.response.text();
        
        if (generatedMessage) {
          console.info(`[${trackingId}] Success with model: ${modelName}`);
          break;
        }
      } catch (err) {
        console.warn(`[${trackingId}] Model ${modelName} failed:`, err.message);
        continue;
      }
    }

    if (!generatedMessage) {
       console.error(`[${trackingId}] All Gemini models failed to return response`);
       throw new Error("Failed to generate content from all attempted Gemini models");
    }

    console.info(`[${trackingId}] Persisting generated message`);
    const { data: aiMessage, error: insertError } = await supabaseClient
      .from('ai_messages')
      .insert({
        lead_id: leadId,
        campaign_id: campaignId,
        content: generatedMessage,
        is_sent: false
      })
      .select()
      .single()

    if (insertError) {
      console.error(`[${trackingId}] Failed to save message:`, insertError);
      return new Response(JSON.stringify({ error: 'Failed to save generated message.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    console.info(`[${trackingId}] Success`);
    return new Response(
      JSON.stringify({ data: aiMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )

  } catch (error) {
    console.error(`[${trackingId}] Unexpected error:`, error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
