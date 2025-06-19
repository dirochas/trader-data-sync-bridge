
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Trading Data Endpoint - Version: STABLE v1.4 - 2024-06-19 ✅
    // ✅ ETAPA 5: Correção para não sobrescrever nomes editados
    // ✅ Funcionalidades testadas e confirmadas:
    // - Recebe dados de trading via POST
    // - Salva contas, margem, posições e histórico
    // - Suporte a VPS ID e USER EMAIL
    // - Processamento automático de VPS único vs display
    // - Integração com tabela vps_servers centralizada
    // - CORREÇÃO: Não sobrescrever display_name editado manualmente
    // - Logs detalhados para debug
    console.log('=== TRADING DATA ENDPOINT CHAMADO ===')
    console.log('Method:', req.method)

    // Initialize Supabase client with SERVICE ROLE KEY (bypass RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    console.log('Supabase URL:', supabaseUrl)
    console.log('Service Key disponível:', !!supabaseServiceKey)
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })

    // Parse request body
    const requestBody = await req.text()
    console.log('Request body recebido:', requestBody)
    
    const { account, margin, positions, history, vpsId, userEmail } = JSON.parse(requestBody)
    
    console.log('Dados parseados:', { 
      account: account?.accountNumber, 
      margin: margin?.used, 
      positions: positions?.length,
      history: history?.length,
      vpsId: vpsId,
      userEmail: userEmail
    })

    // Função para processar VPS ID - separar único vs display
    const processVpsId = (rawVpsId: string) => {
      if (!rawVpsId || rawVpsId === 'N/A') {
        return { vpsUniqueId: null, vpsDisplayName: null };
      }

      console.log('🔧 Processando VPS ID:', rawVpsId);
      
      // O VPS ID único é sempre preservado como veio
      const vpsUniqueId = rawVpsId;
      
      // Criar versão encurtada para display
      let vpsDisplayName = rawVpsId;
      
      // Se começa com VPS_ e tem mais de 8 caracteres, encurtar
      if (rawVpsId.startsWith('VPS_') && rawVpsId.length > 8) {
        // Pegar os últimos 4 caracteres após VPS_
        const suffix = rawVpsId.slice(-4);
        vpsDisplayName = `VPS_${suffix}`;
        console.log(`📝 VPS encurtado: ${rawVpsId} -> ${vpsDisplayName}`);
      }
      
      return { vpsUniqueId, vpsDisplayName };
    };

    // Processar VPS se fornecido e garantir que existe na tabela vps_servers
    let vpsUniqueId = null;
    if (vpsId) {
      const { vpsUniqueId: processedVpsId, vpsDisplayName } = processVpsId(vpsId);
      
      if (processedVpsId) {
        vpsUniqueId = processedVpsId;
        
        // 🚀 CORREÇÃO: Verificar se VPS já existe antes de fazer upsert
        const { data: existingVps } = await supabase
          .from('vps_servers')
          .select('display_name')
          .eq('vps_unique_id', processedVpsId)
          .single();

        if (existingVps) {
          // VPS já existe - NÃO sobrescrever o display_name
          console.log('✅ VPS já existe - mantendo nome atual:', existingVps.display_name);
        } else {
          // VPS novo - criar com nome gerado automaticamente
          const { error: vpsError } = await supabase
            .from('vps_servers')
            .insert({
              vps_unique_id: processedVpsId,
              display_name: vpsDisplayName,
            });

          if (vpsError) {
            console.error('Erro ao criar novo VPS:', vpsError);
          } else {
            console.log('✅ VPS novo criado:', { 
              único: processedVpsId, 
              display: vpsDisplayName 
            });
          }
        }
      }
    }

    // Upsert trading account (sem campo vps, apenas vps_unique_id)
    console.log('=== SALVANDO CONTA ===')
    const accountUpsertData: any = {
      account: account.accountNumber,
      server: account.server,
      balance: account.balance,
      equity: account.equity,
      profit: account.profit,
      leverage: account.leverage,
      updated_at: new Date().toISOString()
    }

    // Adicionar VPS unique ID se fornecido
    if (vpsUniqueId) {
      accountUpsertData.vps_unique_id = vpsUniqueId;
    }

    // Adicionar USER EMAIL se fornecido
    if (userEmail) {
      accountUpsertData.user_email = userEmail
      console.log('USER EMAIL recebido e será salvo:', userEmail)
    }

    const { data: accountData, error: accountError } = await supabase
      .from('accounts')
      .upsert(accountUpsertData, {
        onConflict: 'account'
      })
      .select()
      .single()

    if (accountError) {
      console.error('Erro ao salvar conta:', accountError)
      throw new Error(`Erro conta: ${accountError.message}`)
    }

    console.log('Conta salva:', accountData?.id, 
      vpsUniqueId ? `VPS: ${vpsUniqueId}` : 'Sem VPS ID', 
      userEmail ? `USER: ${userEmail}` : 'Sem User Email')
    const accountId = accountData.id

    // Delete old margin info and insert new one (usando novos nomes)
    console.log('=== ATUALIZANDO MARGEM ===')
    
    // First delete existing margin info for this account
    const { error: deleteMarginError } = await supabase
      .from('margin')
      .delete()
      .eq('account_id', accountId)

    if (deleteMarginError) {
      console.log('Info: Nenhuma margem anterior para deletar ou erro:', deleteMarginError.message)
    }

    // Insert new margin info (usando novos nomes)
    const { error: marginError } = await supabase
      .from('margin')
      .insert({
        account_id: accountId,
        used: margin.used,
        free: margin.free,
        level: margin.level,
        updated_at: new Date().toISOString()
      })

    if (marginError) {
      console.error('Erro ao salvar margem:', marginError)
      throw new Error(`Erro margem: ${marginError.message}`)
    }

    console.log('Margem salva com sucesso')

    // Clear old positions and insert new ones (usando novos nomes)
    console.log('=== LIMPANDO POSIÇÕES ANTIGAS ===')
    const { error: deleteError } = await supabase
      .from('positions')
      .delete()
      .eq('account_id', accountId)

    if (deleteError) {
      console.error('Erro ao limpar posições:', deleteError)
    } else {
      console.log('Posições antigas removidas')
    }

    // Insert current positions (usando novos nomes)
    if (positions && positions.length > 0) {
      console.log('=== SALVANDO', positions.length, 'POSIÇÕES ===')
      const positionsData = positions.map((pos: any) => ({
        account_id: accountId,
        ticket: pos.ticket,
        symbol: pos.symbol,
        type: pos.type,
        volume: pos.volume,
        price: pos.openPrice,
        current: pos.currentPrice,
        profit: pos.profit,
        time: new Date(pos.openTime).toISOString(),
        updated_at: new Date().toISOString()
      }))

      const { error: positionsError } = await supabase
        .from('positions')
        .insert(positionsData)

      if (positionsError) {
        console.error('Erro ao salvar posições:', positionsError)
        throw new Error(`Erro posições: ${positionsError.message}`)
      }

      console.log('Posições salvas:', positions.length)
    } else {
      console.log('Nenhuma posição aberta para salvar')
    }

    // Insert trade history (avoid duplicates) (usando novos nomes)
    if (history && history.length > 0) {
      console.log('=== SALVANDO', history.length, 'HISTÓRICO ===')
      for (const trade of history) {
        try {
          const { error: historyError } = await supabase
            .from('history')
            .upsert({
              account_id: accountId,
              ticket: trade.ticket,
              symbol: trade.symbol,
              type: trade.type,
              volume: trade.volume,
              price: trade.openPrice,
              close: trade.closePrice,
              profit: trade.profit,
              time: new Date(trade.openTime).toISOString(),
              close_time: new Date(trade.closeTime).toISOString()
            }, {
              onConflict: 'account_id,ticket'
            })

          if (historyError) {
            console.error('Erro ao salvar trade:', trade.ticket, historyError)
          } else {
            console.log('Trade salvo:', trade.ticket)
          }
        } catch (error) {
          console.error('Erro ao processar trade:', trade.ticket, error)
        }
      }
      console.log('Histórico processado')
    } else {
      console.log('Nenhum histórico para salvar')
    }

    console.log('=== SUCESSO TOTAL ===')
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Dados atualizados com sucesso',
        account_id: accountId,
        vps_unique_id: vpsUniqueId || null,
        user_email: userEmail || null,
        positions_count: positions?.length || 0,
        history_count: history?.length || 0,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('=== ERRO NA EDGE FUNCTION ===')
    console.error('Erro completo:', error)
    console.error('Stack trace:', error.stack)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Verifique os logs da Edge Function',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
