
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log("=== TRADING DATA ENDPOINT CHAMADO ===");
  console.log("Method:", req.method);
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    console.log("Supabase URL:", supabaseUrl);
    console.log("Service Key disponível:", !!supabaseServiceKey);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const requestBody = await req.text();
    console.log("Request body recebido:", requestBody);
    
    const data = JSON.parse(requestBody);
    
    // Extrair informações principais
    const accountNumber = data.account?.accountNumber;
    const userEmail = data.userEmail || 'usuario@exemplo.com'; // Email do EA
    const vpsId = data.vpsId || null;
    
    console.log("Dados parseados:", {
      account: accountNumber,
      margin: data.margin ? Object.keys(data.margin).length : 0,
      positions: data.positions ? data.positions.length : 0,
      history: data.history ? data.history.length : 0,
      vpsId: vpsId,
      userEmail: userEmail
    });

    if (!accountNumber) {
      return new Response(
        JSON.stringify({ error: 'Account number é obrigatório' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // === SALVANDO CONTA ===
    console.log("=== SALVANDO CONTA ===");
    
    const accountData = {
      account: accountNumber,
      name: `Account ${accountNumber}`,
      server: data.account.server || 'Unknown',
      broker: data.account.server ? data.account.server.split('-')[0] : 'Unknown',
      balance: parseFloat(data.account.balance) || 0,
      equity: parseFloat(data.account.equity) || 0,
      profit: parseFloat(data.account.profit) || 0,
      leverage: parseInt(data.account.leverage) || 1,
      vps: vpsId,
      user_email: userEmail, // Salvando o email do usuário do EA
      updated_at: new Date().toISOString()
    };
    
    const { data: savedAccount, error: accountError } = await supabase
      .from('accounts')
      .upsert(accountData, { 
        onConflict: 'account',
        ignoreDuplicates: false 
      })
      .select()
      .single();
    
    if (accountError) {
      console.error("Erro ao salvar conta:", accountError);
      throw accountError;
    }
    
    if (vpsId) {
      console.log("Conta salva:", savedAccount.id, "VPS:", vpsId, "Email:", userEmail);
    } else {
      console.log("Conta salva:", savedAccount.id, "Email:", userEmail, "Sem VPS ID");
    }

    // === ATUALIZANDO MARGEM ===
    console.log("=== ATUALIZANDO MARGEM ===");
    if (data.margin) {
      const marginData = {
        account_id: savedAccount.id,
        used: parseFloat(data.margin.used) || 0,
        free: parseFloat(data.margin.free) || 0,
        level: parseFloat(data.margin.level) || 0,
        updated_at: new Date().toISOString()
      };
      
      const { error: marginError } = await supabase
        .from('margin')
        .upsert(marginData, { 
          onConflict: 'account_id',
          ignoreDuplicates: false 
        });
      
      if (marginError) {
        console.error("Erro ao salvar margem:", marginError);
        throw marginError;
      }
      
      console.log("Margem salva com sucesso");
    }

    // === LIMPANDO POSIÇÕES ANTIGAS ===
    console.log("=== LIMPANDO POSIÇÕES ANTIGAS ===");
    const { error: deletePositionsError } = await supabase
      .from('positions')
      .delete()
      .eq('account_id', savedAccount.id);
    
    if (deletePositionsError) {
      console.error("Erro ao limpar posições:", deletePositionsError);
      throw deletePositionsError;
    }
    
    console.log("Posições antigas removidas");

    // === SALVANDO POSIÇÕES ===
    if (data.positions && data.positions.length > 0) {
      console.log("=== SALVANDO", data.positions.length, "POSIÇÕES ===");
      
      const positionsToInsert = data.positions.map((pos: any) => ({
        account_id: savedAccount.id,
        ticket: parseInt(pos.ticket),
        symbol: pos.symbol,
        type: pos.type,
        volume: parseFloat(pos.volume),
        price: parseFloat(pos.openPrice),
        current: parseFloat(pos.currentPrice),
        profit: parseFloat(pos.profit),
        time: new Date(pos.openTime).toISOString(),
      }));
      
      const { error: positionsError } = await supabase
        .from('positions')
        .insert(positionsToInsert);
      
      if (positionsError) {
        console.error("Erro ao salvar posições:", positionsError);
        throw positionsError;
      }
      
      console.log("Posições salvas com sucesso");
    } else {
      console.log("Nenhuma posição aberta para salvar");
    }

    // === SALVANDO HISTÓRICO ===
    if (data.history && data.history.length > 0) {
      console.log("=== SALVANDO HISTÓRICO ===");
      
      for (const trade of data.history) {
        try {
          const tradeData = {
            account_id: savedAccount.id,
            ticket: parseInt(trade.ticket),
            symbol: trade.symbol,
            type: trade.type,
            volume: parseFloat(trade.volume),
            price: parseFloat(trade.openPrice),
            close: parseFloat(trade.closePrice),
            profit: parseFloat(trade.profit),
            time: new Date(trade.openTime).toISOString(),
            close_time: new Date(trade.closeTime).toISOString(),
          };
          
          const { error: tradeError } = await supabase
            .from('history')
            .upsert(tradeData, { 
              onConflict: 'ticket,account_id',
              ignoreDuplicates: false 
            });
          
          if (tradeError) {
            console.error("Erro ao salvar trade:", trade.ticket, tradeError);
          } else {
            console.log("Trade salvo:", trade.ticket);
          }
        } catch (error) {
          console.error("Erro ao processar trade:", trade.ticket, error);
        }
      }
      
      console.log("Histórico processado");
    } else {
      console.log("Nenhum histórico para salvar");
    }

    console.log("=== SUCESSO TOTAL ===");
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Dados processados com sucesso',
        accountId: savedAccount.id,
        userEmail: userEmail
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error("=== ERRO TOTAL ===", error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor', 
        details: error.message 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
