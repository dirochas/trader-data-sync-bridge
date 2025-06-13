
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
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { account, margin, positions, history } = await req.json()
    
    console.log('Dados recebidos do MT4/MT5:', { account, margin, positions, history })

    // Upsert trading account
    const { data: accountData, error: accountError } = await supabase
      .from('trading_accounts')
      .upsert({
        account_number: account.accountNumber,
        server: account.server,
        balance: account.balance,
        equity: account.equity,
        profit: account.profit,
        leverage: account.leverage,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'account_number'
      })
      .select()
      .single()

    if (accountError) {
      console.error('Erro ao salvar conta:', accountError)
      throw accountError
    }

    const accountId = accountData.id

    // Update margin info
    await supabase
      .from('margin_info')
      .upsert({
        account_id: accountId,
        used_margin: margin.used,
        free_margin: margin.free,
        margin_level: margin.level,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'account_id'
      })

    // Clear old positions and insert new ones
    await supabase
      .from('open_positions')
      .delete()
      .eq('account_id', accountId)

    // Insert current positions
    if (positions && positions.length > 0) {
      const positionsData = positions.map((pos: any) => ({
        account_id: accountId,
        ticket: pos.ticket,
        symbol: pos.symbol,
        type: pos.type,
        volume: pos.volume,
        open_price: pos.openPrice,
        current_price: pos.currentPrice,
        profit: pos.profit,
        open_time: new Date(pos.openTime).toISOString(),
        updated_at: new Date().toISOString()
      }))

      await supabase
        .from('open_positions')
        .insert(positionsData)
    }

    // Insert trade history (avoid duplicates)
    if (history && history.length > 0) {
      for (const trade of history) {
        await supabase
          .from('trade_history')
          .upsert({
            account_id: accountId,
            ticket: trade.ticket,
            symbol: trade.symbol,
            type: trade.type,
            volume: trade.volume,
            open_price: trade.openPrice,
            close_price: trade.closePrice,
            profit: trade.profit,
            open_time: new Date(trade.openTime).toISOString(),
            close_time: new Date(trade.closeTime).toISOString()
          }, {
            onConflict: 'account_id,ticket'
          })
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Dados atualizados com sucesso' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro na Edge Function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
