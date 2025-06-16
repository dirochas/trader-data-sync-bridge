
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { commandId, status, errorMessage = null } = await req.json();

    console.log(`🔄 Atualizando comando ${commandId} para status: ${status}`);

    const updateData: any = {
      status,
      executed: new Date().toISOString()
    };

    if (errorMessage) {
      updateData.error = errorMessage;
    }

    // Atualizar status do comando (usando novos nomes)
    const { data: command, error: updateError } = await supabase
      .from('commands')
      .update(updateData)
      .eq('id', commandId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erro ao atualizar comando:', updateError);
      return new Response(
        JSON.stringify({ error: 'Erro ao atualizar comando' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`✅ Comando ${commandId} atualizado para ${status}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        command,
        message: `Comando atualizado para ${status}`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Erro no update-command-status:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
