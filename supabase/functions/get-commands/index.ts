
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

    const url = new URL(req.url);
    const accountNumber = url.searchParams.get('accountNumber');

    if (!accountNumber) {
      return new Response(
        JSON.stringify({ error: 'accountNumber é obrigatório' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`🔍 Buscando comandos para conta: ${accountNumber}`);

    // Buscar account_id pelo account_number
    const { data: account, error: accountError } = await supabase
      .from('trading_accounts')
      .select('id')
      .eq('account_number', accountNumber)
      .single();

    if (accountError || !account) {
      console.log(`⚠️ Conta não encontrada: ${accountNumber}`);
      return new Response(
        JSON.stringify({ commands: [] }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Buscar comandos pendentes
    const { data: commands, error: commandsError } = await supabase
      .from('pending_commands')
      .select('*')
      .eq('account_id', account.id)
      .eq('status', 'PENDING')
      .order('created_at', { ascending: true });

    if (commandsError) {
      console.error('❌ Erro ao buscar comandos:', commandsError);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar comandos' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`📋 Encontrados ${commands?.length || 0} comandos pendentes`);

    return new Response(
      JSON.stringify({ commands: commands || [] }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Erro no get-commands:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
