
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

    const { accountNumber, commandType, commandData = {} } = await req.json();

    console.log(`📨 Recebendo comando: ${commandType} para conta: ${accountNumber}`);

    // Buscar account_id pelo account_number
    const { data: account, error: accountError } = await supabase
      .from('trading_accounts')
      .select('id')
      .eq('account_number', accountNumber)
      .single();

    if (accountError || !account) {
      console.error('❌ Conta não encontrada:', accountError);
      return new Response(
        JSON.stringify({ error: 'Conta não encontrada' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Inserir comando na tabela
    const { data: command, error: commandError } = await supabase
      .from('pending_commands')
      .insert({
        account_id: account.id,
        command_type: commandType,
        command_data: commandData
      })
      .select()
      .single();

    if (commandError) {
      console.error('❌ Erro ao inserir comando:', commandError);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar comando' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`✅ Comando criado com ID: ${command.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        commandId: command.id,
        message: `Comando ${commandType} enviado para conta ${accountNumber}`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Erro no send-command:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
