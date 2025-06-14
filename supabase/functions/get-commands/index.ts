
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log(`🔍 GET-COMMANDS: Método: ${req.method}, URL: ${req.url}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('📋 GET-COMMANDS: Retornando CORS headers');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    console.log(`🔧 GET-COMMANDS: Supabase URL: ${supabaseUrl}`);
    console.log(`🔧 GET-COMMANDS: Service Key disponível: ${supabaseKey ? 'SIM' : 'NÃO'}`);
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const accountNumber = url.searchParams.get('accountNumber');

    console.log(`📱 GET-COMMANDS: Account Number recebido: ${accountNumber}`);

    if (!accountNumber) {
      console.log('❌ GET-COMMANDS: Account Number não fornecido');
      return new Response(
        JSON.stringify({ 
          error: 'accountNumber é obrigatório',
          commands: [] 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`🔍 GET-COMMANDS: Buscando conta para account_number: ${accountNumber}`);

    // Buscar account_id pelo account_number
    const { data: account, error: accountError } = await supabase
      .from('trading_accounts')
      .select('id')
      .eq('account_number', accountNumber)
      .single();

    if (accountError) {
      console.log(`❌ GET-COMMANDS: Erro ao buscar conta:`, accountError);
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao buscar conta',
          commands: [],
          debug: accountError
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!account) {
      console.log(`⚠️ GET-COMMANDS: Conta não encontrada: ${accountNumber}`);
      return new Response(
        JSON.stringify({ 
          message: 'Conta não encontrada, mas retornando array vazio',
          commands: [] 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`✅ GET-COMMANDS: Conta encontrada - ID: ${account.id}`);

    // Buscar comandos pendentes
    const { data: commands, error: commandsError } = await supabase
      .from('pending_commands')
      .select('*')
      .eq('account_id', account.id)
      .eq('status', 'PENDING')
      .order('created_at', { ascending: true });

    if (commandsError) {
      console.error('❌ GET-COMMANDS: Erro ao buscar comandos:', commandsError);
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao buscar comandos',
          commands: [],
          debug: commandsError
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`📋 GET-COMMANDS: Encontrados ${commands?.length || 0} comandos pendentes`);
    
    if (commands && commands.length > 0) {
      console.log('📦 GET-COMMANDS: Comandos encontrados:', commands);
    }

    const response = { 
      success: true,
      account_id: account.id,
      commands: commands || [] 
    };

    console.log(`✅ GET-COMMANDS: Retornando resposta:`, JSON.stringify(response));

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ GET-COMMANDS: Erro geral:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        message: error.message,
        commands: []
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
