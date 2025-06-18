
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
    
    const { account, margin, positions, history } = JSON.parse(requestBody)
    
    console.log('Dados parseados:', { 
      account: account?.accountNumber, 
      margin: margin?.used, 
      positions: positions?.length,
      history: history?.length 
    })

    // Upsert trading account (usando novos nomes)
    console.log('=== SALVANDO CONTA ===')
    const { data: accountData, error: accountError } = await supabase
      .from('accounts')
      .upsert({
        account: account.accountNumber,
        server: account.server,
        balance: account.balance,
        equity: account.equity,
        profit: account.profit,
        leverage: account.leverage,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'account'
      })
      .select()
      .single()

    if (accountError) {
      console.error('Erro ao salvar conta:', accountError)
      throw new Error(`Erro conta: ${accountError.message}`)
    }

    console.log('Conta salva:', accountData?.id)
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
