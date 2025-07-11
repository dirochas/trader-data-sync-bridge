
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
    // Trading Data Endpoint - Version: OPTIMIZED v2.0 - 2025-01-11 ⚡
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
    
    const data = JSON.parse(requestBody)
    const { account, margin, positions, history, vpsId, userEmail, status } = data
    
    // Validação básica como na v2.15
    if (!account?.accountNumber || !userEmail) {
      console.error('❌ Dados obrigatórios faltando:', { account, userEmail })
      return new Response(
        JSON.stringify({ error: 'account.accountNumber e userEmail são obrigatórios' }),
        { status: 400, headers: corsHeaders }
      )
    }
    
    console.log('Dados parseados:', { 
      account: account.accountNumber, 
      margin: margin?.used, 
      positions: positions?.length,
      history: history?.length,
      vpsId: vpsId,
      userEmail: userEmail,
      status: status
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

    // ✅ DELTA UPDATE: Verificar se dados da conta mudaram
    console.log('=== VERIFICANDO MUDANÇAS NA CONTA ===')
    
    // Buscar dados atuais da conta
    const { data: currentAccount } = await supabase
      .from('accounts')
      .select('balance, equity, profit, leverage, updated_at')
      .eq('account', account.accountNumber)
      .single();

    // Preparar dados para comparação
    const newAccountData = {
      balance: Number(account.balance),
      equity: Number(account.equity), 
      profit: Number(account.profit),
      leverage: Number(account.leverage)
    };

    // Verificar se houve mudanças significativas (diferença > 0.01)
    let accountChanged = !currentAccount;
    if (currentAccount) {
      accountChanged = 
        Math.abs(Number(currentAccount.balance) - newAccountData.balance) > 0.01 ||
        Math.abs(Number(currentAccount.equity) - newAccountData.equity) > 0.01 ||
        Math.abs(Number(currentAccount.profit) - newAccountData.profit) > 0.01 ||
        Number(currentAccount.leverage) !== newAccountData.leverage;
    }

    console.log('Dados mudaram:', accountChanged ? 'SIM' : 'NÃO');
    
    if (!accountChanged) {
      console.log('⚡ OTIMIZAÇÃO: Dados da conta inalterados, pulando update');
    }

    // Só fazer upsert se mudou
    const accountUpsertData: any = {
      account: account.accountNumber,
      server: account.server,
      balance: newAccountData.balance,
      equity: newAccountData.equity,
      profit: newAccountData.profit,
      leverage: newAccountData.leverage,
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

    // Só fazer upsert da conta se mudou
    let accountData;
    if (accountChanged) {
      const { data: updatedAccount, error: accountError } = await supabase
        .from('accounts')
        .upsert(accountUpsertData, {
          onConflict: 'account'
        })
        .select()
        .single();
      
      if (accountError) {
        console.error('Erro ao salvar conta:', accountError)
        throw new Error(`Erro conta: ${accountError.message}`)
      }
      accountData = updatedAccount;
    } else {
      // Buscar ID da conta existente
      const { data: existingAccountData, error: accountError } = await supabase
        .from('accounts')
        .select('id')
        .eq('account', account.accountNumber)
        .single();
        
      if (accountError) {
        console.error('Erro ao buscar conta existente:', accountError)
        throw new Error(`Erro buscar conta: ${accountError.message}`)
      }
      accountData = existingAccountData;
    }


    console.log('Conta salva:', accountData?.id, 
      vpsUniqueId ? `VPS: ${vpsUniqueId}` : 'Sem VPS ID', 
      userEmail ? `USER: ${userEmail}` : 'Sem User Email')
    const accountId = accountData.id

    // ✅ DELTA UPDATE: Verificar se margem mudou
    console.log('=== VERIFICANDO MUDANÇAS NA MARGEM ===')
    
    const { data: currentMargin } = await supabase
      .from('margin')
      .select('used, free, level')
      .eq('account_id', accountId)
      .single();

    const newMarginData = {
      used: Number(margin.used),
      free: Number(margin.free),
      level: Number(margin.level)
    };

    let marginChanged = !currentMargin;
    if (currentMargin) {
      marginChanged =
        Math.abs(Number(currentMargin.used) - newMarginData.used) > 0.01 ||
        Math.abs(Number(currentMargin.free) - newMarginData.free) > 0.01 ||
        Math.abs(Number(currentMargin.level) - newMarginData.level) > 0.1;
    }

    console.log('Margem mudou:', marginChanged ? 'SIM' : 'NÃO');

    if (marginChanged) {
      // Delete existing margin info
      await supabase
        .from('margin')
        .delete()
        .eq('account_id', accountId);

      // Insert new margin info
      const { error: marginError } = await supabase
        .from('margin')
        .insert({
          account_id: accountId,
          used: newMarginData.used,
          free: newMarginData.free,
          level: newMarginData.level,
          updated_at: new Date().toISOString()
        });

      if (marginError) {
        console.error('Erro ao salvar margem:', marginError)
        throw new Error(`Erro margem: ${marginError.message}`)
      }
      console.log('✅ Margem atualizada');
    } else {
      console.log('⚡ OTIMIZAÇÃO: Margem inalterada, pulando update');
    }

    // ✅ PROCESSAMENTO INTELIGENTE DE POSIÇÕES (UPSERT/UPDATE style)
    console.log('=== PROCESSANDO POSIÇÕES (Método UPSERT) ===')
    let operationsCount = 0;

    // Processar posições apenas se status não for IDLE ou se há posições
    if (status !== 'IDLE' && positions && Array.isArray(positions)) {
      console.log(`📝 Processando ${positions.length} posições...`);
      
      // Buscar posições existentes
      const { data: existingPositions } = await supabase
        .from('positions')
        .select('ticket')
        .eq('account_id', accountId);
      
      const existingTickets = new Set(existingPositions?.map(p => p.ticket) || []);
      const currentTickets = new Set(positions.map(p => p.ticket));
      
      // Remover posições que não existem mais
      const ticketsToRemove = [...existingTickets].filter(ticket => !currentTickets.has(ticket));
      if (ticketsToRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('positions')
          .delete()
          .eq('account_id', accountId)
          .in('ticket', ticketsToRemove);
        
        if (deleteError) {
          console.error('❌ Erro ao remover posições:', deleteError);
        } else {
          console.log(`🗑️ Removidas ${ticketsToRemove.length} posições fechadas`);
        }
      }
      
      // Upsert posições atuais
      for (const pos of positions) {
        if (!pos.ticket || !pos.symbol) {
          console.warn('⚠️ Posição inválida ignorada:', pos);
          continue;
        }
        
        try {
          const positionData = {
            account_id: accountId,
            ticket: parseInt(pos.ticket),
            symbol: String(pos.symbol),
            type: String(pos.type || 'UNKNOWN'),
            volume: parseFloat(pos.volume) || 0,
            price: parseFloat(pos.openPrice || pos.price) || 0,
            current: parseFloat(pos.currentPrice || pos.current) || 0,
            profit: parseFloat(pos.profit) || 0,
            time: pos.openTime || pos.time || new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const { error: upsertError } = await supabase
            .from('positions')
            .upsert(positionData, { 
              onConflict: 'account_id,ticket',
              ignoreDuplicates: false 
            });

          if (upsertError) {
            console.error(`❌ Erro ao fazer upsert posição ${pos.ticket}:`, upsertError);
          } else {
            operationsCount++;
          }
        } catch (error) {
          console.error(`❌ Erro ao processar posição ${pos.ticket}:`, error);
        }
      }
    } else if (status === 'IDLE') {
      // Modo IDLE - limpar todas as posições
      const { error: clearError } = await supabase
        .from('positions')
        .delete()
        .eq('account_id', accountId);
        
      if (clearError) {
        console.error('❌ Erro ao limpar posições no modo IDLE:', clearError);
      } else {
        console.log('🧹 Posições limpas no modo IDLE');
      }
    }

    // Log do resultado
    const finalPositionsCount = positions?.length || 0;
    console.log('✅ PROCESSAMENTO DE POSIÇÕES CONCLUÍDO:');
    console.log(`   - Posições processadas: ${finalPositionsCount}`);
    console.log(`   - Operações realizadas: ${operationsCount}`);
    console.log(`   - Status: ${status || 'ATIVO'}`);

    // Processar histórico apenas se não for modo IDLE (v2.15 style)
    if (status !== 'IDLE' && history && history.length > 0) {
      console.log('=== SALVANDO', history.length, 'HISTÓRICO ===')
      for (const trade of history) {
        if (!trade.ticket || !trade.symbol) {
          console.warn('⚠️ Trade inválido ignorado:', trade);
          continue;
        }
        
        try {
          const { error: historyError } = await supabase
            .from('history')
            .upsert({
              account_id: accountId,
              ticket: parseInt(trade.ticket),
              symbol: String(trade.symbol),
              type: String(trade.type || 'UNKNOWN'),
              volume: parseFloat(trade.volume) || 0,
              price: parseFloat(trade.openPrice || trade.price) || 0,
              close: parseFloat(trade.closePrice || trade.close) || 0,
              profit: parseFloat(trade.profit) || 0,
              time: trade.openTime || trade.time || new Date().toISOString(),
              close_time: trade.closeTime || trade.close_time || new Date().toISOString()
            }, {
              onConflict: 'account_id,ticket'
            })

          if (historyError) {
            console.error('❌ Erro ao salvar trade:', trade.ticket, historyError)
          } else {
            console.log('✅ Trade salvo:', trade.ticket)
          }
        } catch (error) {
          console.error('❌ Erro ao processar trade:', trade.ticket, error)
        }
      }
      console.log('✅ Histórico processado')
    } else {
      console.log('⚡ Histórico ignorado (modo IDLE ou sem dados)')
    }

    console.log('=== SUCESSO TOTAL ===')
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Dados processados com sucesso',
        account_id: accountId,
        vps_unique_id: vpsUniqueId || null,
        user_email: userEmail || null,
        positions_count: positions?.length || 0,
        history_count: history?.length || 0,
        optimizations: {
          account_updated: accountChanged,
          margin_updated: marginChanged,
          positions_updated: operationsCount > 0,
          savings_applied: !accountChanged || !marginChanged || operationsCount === 0
        },
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
