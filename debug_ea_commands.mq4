//+------------------------------------------------------------------+
//|                                           TradingDataSender.mq4 |
//|                                                                  |
//+------------------------------------------------------------------+
#property strict

input string ServerURL = "https://kgrlcsimdszbrkcwjpke.supabase.co/functions/v1/trading-data";
input int SendIntervalSeconds = 5; // Intervalo de envio (segundos)
input bool UseTimer = true; // true = OnTimer (sem ticks), false = OnTick (com ticks)

// NOVAS VARIÁVEIS PARA POLLING DE COMANDOS
input bool EnableCommandPolling = true; // Habilitar polling de comandos
input int CommandCheckIntervalSeconds = 10; // Intervalo para verificar comandos (segundos)

datetime lastSendTime = 0;
datetime lastCommandCheck = 0;

//+------------------------------------------------------------------+
int OnInit()
{
   Print("=== EA TRADING DATA SENDER INICIADO ===");
   Print("URL do servidor: ", ServerURL);
   Print("Intervalo de envio: ", SendIntervalSeconds, " segundos");
   Print("Modo selecionado: ", UseTimer ? "TIMER (sem ticks)" : "TICK (com ticks)");
   Print("Polling de comandos: ", EnableCommandPolling ? "HABILITADO" : "DESABILITADO");
   
   if(UseTimer)
   {
      EventSetTimer(SendIntervalSeconds);
      Print("✅ Timer configurado para ", SendIntervalSeconds, " segundos");
      Print("📡 EA funcionará mesmo com mercado FECHADO");
   }
   else
   {
      Print("📊 EA funcionará apenas com mercado ABERTO (ticks)");
   }
   
   // Enviar dados imediatamente na inicialização
   Print("Enviando dados iniciais...");
   SendTradingData();
   
   return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   if(UseTimer)
   {
      EventKillTimer();
      Print("Timer finalizado");
   }
   Print("=== EA FINALIZADO ===");
}

//+------------------------------------------------------------------+
void OnTick()
{
   // Só funciona se UseTimer = false
   if(!UseTimer && TimeCurrent() - lastSendTime >= SendIntervalSeconds)
   {
      Print("OnTick executado - enviando dados...");
      SendTradingData();
      lastSendTime = TimeCurrent();
   }
}

//+------------------------------------------------------------------+
void SendTradingData()
{
   Print("--- Iniciando coleta de dados ---");
   string jsonData = BuildJsonData();
   
   // Debug - salvar em arquivo
   int file = FileOpen("trading_data.json", FILE_WRITE|FILE_TXT);
   if(file != INVALID_HANDLE)
   {
      FileWrite(file, jsonData);
      FileClose(file);
      Print("💾 Dados salvos em arquivo: trading_data.json");
   }
   else
   {
      Print("❌ Erro ao salvar arquivo de debug");
   }
   
   // Enviar via HTTP para Supabase
   SendToSupabase(jsonData);
}

//+------------------------------------------------------------------+
void SendToSupabase(string jsonData)
{
   Print("=== INICIANDO ENVIO PARA SUPABASE ===");
   Print("🌐 URL: ", ServerURL);
   Print("📦 Tamanho dos dados: ", StringLen(jsonData), " caracteres");
   
   string headers = "Content-Type: application/json\r\n";
   
   char post[];
   char result[];
   string resultHeaders;
   
   // Converter string para array de bytes
   StringToCharArray(jsonData, post, 0, WHOLE_ARRAY);
   ArrayResize(post, ArraySize(post) - 1); // Remove null terminator
   
   Print("🚀 Fazendo requisição HTTP POST...");
   
   // Fazer requisição HTTP POST
   int timeout = 10000; // 10 segundos (aumentei o timeout)
   int res = WebRequest("POST", ServerURL, headers, timeout, post, result, resultHeaders);
   
   Print("📡 Código de resposta HTTP: ", res);
   
   if(res == 200)
   {
      Print("✅ SUCESSO! Dados enviados para Supabase!");
      string response = CharArrayToString(result);
      Print("📋 Resposta do servidor: ", response);
   }
   else if(res == -1)
   {
      Print("❌ ERRO: URL não permitida no WebRequest!");
      Print("🔧 SOLUÇÃO: Adicione esta URL nas configurações:");
      Print("   Ferramentas → Opções → Expert Advisors → WebRequest");
      Print("   URL: https://kgrlcsimdszbrkcwjpke.supabase.co");
   }
   else if(res == 0)
   {
      Print("❌ ERRO: Timeout ou sem conexão com internet");
      Print("🔧 Verifique sua conexão com a internet");
   }
   else
   {
      Print("❌ Erro HTTP: ", res);
      Print("📋 Headers de resposta: ", resultHeaders);
      if(ArraySize(result) > 0)
      {
         string errorResponse = CharArrayToString(result);
         Print("📋 Resposta de erro: ", errorResponse);
      }
   }
   
   Print("=== FIM DO ENVIO ===");
}

//+------------------------------------------------------------------+
string BuildJsonData()
{
   Print("🔄 Construindo dados JSON...");
   
   string json = "{";
   
   // Account Info
   json += "\"account\":{";
   json += "\"balance\":" + DoubleToString(AccountBalance(), 2) + ",";
   json += "\"equity\":" + DoubleToString(AccountEquity(), 2) + ",";
   json += "\"profit\":" + DoubleToString(AccountProfit(), 2) + ",";
   json += "\"accountNumber\":\"" + IntegerToString(AccountNumber()) + "\",";
   json += "\"server\":\"" + AccountServer() + "\",";
   json += "\"leverage\":" + IntegerToString(AccountLeverage());
   json += "},";
   
   Print("💰 Conta: ", AccountNumber(), " | Balance: $", DoubleToString(AccountBalance(), 2));
   
   // Margin Info
   json += "\"margin\":{";
   json += "\"used\":" + DoubleToString(AccountMargin(), 2) + ",";
   json += "\"free\":" + DoubleToString(AccountFreeMargin(), 2) + ",";
   json += "\"level\":" + DoubleToString(AccountMargin() == 0 ? 0 : AccountEquity()/AccountMargin()*100, 2);
   json += "},";
   
   Print("📊 Margem: Usada $", DoubleToString(AccountMargin(), 2), " | Livre $", DoubleToString(AccountFreeMargin(), 2));
   
   // Open Positions
   json += "\"positions\":[";
   int posCount = 0;
   for(int i = 0; i < OrdersTotal(); i++)
   {
      if(OrderSelect(i, SELECT_BY_POS) && OrderType() <= 1) // Only BUY/SELL
      {
         if(posCount > 0) json += ",";
         json += "{";
         json += "\"ticket\":" + IntegerToString(OrderTicket()) + ",";
         json += "\"symbol\":\"" + OrderSymbol() + "\",";
         json += "\"type\":\"" + (OrderType() == OP_BUY ? "BUY" : "SELL") + "\",";
         json += "\"volume\":" + DoubleToString(OrderLots(), 2) + ",";
         json += "\"openPrice\":" + DoubleToString(OrderOpenPrice(), 5) + ",";
         json += "\"currentPrice\":" + DoubleToString(OrderType() == OP_BUY ? MarketInfo(OrderSymbol(), MODE_BID) : MarketInfo(OrderSymbol(), MODE_ASK), 5) + ",";
         json += "\"profit\":" + DoubleToString(OrderProfit(), 2) + ",";
         json += "\"openTime\":\"" + TimeToString(OrderOpenTime()) + "\"";
         json += "}";
         posCount++;
      }
   }
   json += "],";
   
   Print("📈 Posições abertas: ", posCount);
   
   // Trade History (últimos 10)
   json += "\"history\":[";
   int histCount = 0;
   for(int i = OrdersHistoryTotal()-1; i >= 0 && histCount < 10; i--)
   {
      if(OrderSelect(i, SELECT_BY_POS, MODE_HISTORY) && OrderType() <= 1)
      {
         if(histCount > 0) json += ",";
         json += "{";
         json += "\"ticket\":" + IntegerToString(OrderTicket()) + ",";
         json += "\"symbol\":\"" + OrderSymbol() + "\",";
         json += "\"type\":\"" + (OrderType() == OP_BUY ? "BUY" : "SELL") + "\",";
         json += "\"volume\":" + DoubleToString(OrderLots(), 2) + ",";
         json += "\"openPrice\":" + DoubleToString(OrderOpenPrice(), 5) + ",";
         json += "\"closePrice\":" + DoubleToString(OrderClosePrice(), 5) + ",";
         json += "\"profit\":" + DoubleToString(OrderProfit(), 2) + ",";
         json += "\"openTime\":\"" + TimeToString(OrderOpenTime()) + "\",";
         json += "\"closeTime\":\"" + TimeToString(OrderCloseTime()) + "\"";
         json += "}";
         histCount++;
      }
   }
   json += "]";
   
   json += "}";
   
   Print("📜 Histórico de trades: ", histCount);
   Print("✅ JSON construído com sucesso");
   
   return json;
}

//+------------------------------------------------------------------+
void OnTimer()
{
   // Só funciona se UseTimer = true
   if(UseTimer)
   {
      Print("=== TIMER EXECUTADO ===");
      Print("Horário atual: ", TimeToString(TimeCurrent()));
      SendTradingData();
      lastSendTime = TimeCurrent();
      
      // NOVA FUNCIONALIDADE: Verificar comandos pendentes
      if(EnableCommandPolling && TimeCurrent() - lastCommandCheck >= CommandCheckIntervalSeconds)
      {
         Print("🔍 Iniciando verificação de comandos...");
         Print("⏰ Última verificação: ", TimeToString(lastCommandCheck));
         Print("⏰ Agora: ", TimeToString(TimeCurrent()));
         Print("⏰ Diferença: ", TimeCurrent() - lastCommandCheck, " segundos");
         CheckPendingCommands();
         lastCommandCheck = TimeCurrent();
      }
      else
      {
         Print("⏳ Aguardando próxima verificação de comandos em: ", CommandCheckIntervalSeconds - (TimeCurrent() - lastCommandCheck), " segundos");
      }
   }
}

//+------------------------------------------------------------------+
// FUNÇÃO MELHORADA: Verificar comandos pendentes
//+------------------------------------------------------------------+
void CheckPendingCommands()
{
   Print("🔍 === INICIANDO VERIFICAÇÃO DE COMANDOS ===");
   Print("📱 Conta: ", AccountNumber());
   
   string url = "https://kgrlcsimdszbrkcwjpke.supabase.co/functions/v1/get-commands?accountNumber=" + IntegerToString(AccountNumber());
   Print("🌐 URL da requisição: ", url);
   
   string headers = "Content-Type: application/json\r\n";
   
   char result[];
   string resultHeaders;
   
   // CORREÇÃO: Usar array vazio para requisição GET
   char emptyPost[];
   
   Print("🚀 Fazendo requisição GET...");
   int res = WebRequest("GET", url, headers, 5000, emptyPost, result, resultHeaders);
   
   Print("📡 Código de resposta HTTP: ", res);
   Print("📋 Headers de resposta: ", resultHeaders);
   
   if(res == 200)
   {
      string response = CharArrayToString(result);
      Print("✅ SUCESSO na requisição!");
      Print("📋 Resposta completa: ", response);
      Print("📏 Tamanho da resposta: ", StringLen(response), " caracteres");
      
      // Verificar se existe o campo "commands" na resposta
      if(StringFind(response, "\"commands\"") >= 0)
      {
         Print("📦 Campo 'commands' encontrado na resposta");
         
         // Verificar se existem comandos
         if(StringFind(response, "\"commands\":[]") >= 0)
         {
            Print("📭 Nenhum comando pendente encontrado");
         }
         else
         {
            Print("📬 Comandos encontrados! Processando...");
            
            // Verificar especificamente por CLOSE_ALL
            if(StringFind(response, "CLOSE_ALL") >= 0)
            {
               Print("⚡ COMANDO CLOSE_ALL ENCONTRADO!");
               ExecuteCloseAllCommand(response);
            }
            else
            {
               Print("ℹ️ Outros comandos encontrados, mas não CLOSE_ALL");
            }
         }
      }
      else
      {
         Print("⚠️ Campo 'commands' não encontrado na resposta");
         Print("🔍 Verificando formato da resposta...");
      }
   }
   else if(res == -1)
   {
      Print("❌ ERRO: URL não permitida no WebRequest!");
      Print("🔧 SOLUÇÃO: Adicione estas URLs nas configurações do MetaTrader:");
      Print("   Ferramentas → Opções → Expert Advisors → WebRequest");
      Print("   URL 1: https://kgrlcsimdszbrkcwjpke.supabase.co");
      Print("   URL 2: *.supabase.co");
   }
   else if(res == 0)
   {
      Print("❌ ERRO: Timeout ou sem conexão");
   }
   else
   {
      Print("❌ Erro HTTP: ", res);
      if(ArraySize(result) > 0)
      {
         string errorResponse = CharArrayToString(result);
         Print("📋 Resposta de erro: ", errorResponse);
      }
   }
   
   Print("🔍 === FIM DA VERIFICAÇÃO DE COMANDOS ===");
}

//+------------------------------------------------------------------+
// FUNÇÃO MELHORADA: Executar comando CLOSE_ALL
//+------------------------------------------------------------------+
void ExecuteCloseAllCommand(string jsonResponse)
{
   Print("🚀 === EXECUTANDO CLOSE_ALL ===");
   
   // Extrair ID do comando (parsing simples)
   string commandId = ExtractCommandId(jsonResponse);
   Print("🆔 ID do comando extraído: ", commandId);
   
   int totalOrders = OrdersTotal();
   Print("📊 Total de ordens antes do fechamento: ", totalOrders);
   
   int closedCount = 0;
   int failedCount = 0;
   
   // Fechar todas as posições abertas
   for(int i = totalOrders - 1; i >= 0; i--)
   {
      Print("🔄 Processando ordem índice: ", i);
      
      if(OrderSelect(i, SELECT_BY_POS))
      {
         Print("📋 Order selecionada:");
         Print("   Ticket: ", OrderTicket());
         Print("   Tipo: ", OrderType());
         Print("   Symbol: ", OrderSymbol());
         Print("   Volume: ", OrderLots());
         
         if(OrderType() <= 1) // Only BUY/SELL
         {
            Print("💼 Tentando fechar posição...");
            bool closed = false;
            
            if(OrderType() == OP_BUY)
            {
               double bid = MarketInfo(OrderSymbol(), MODE_BID);
               Print("   Fechando BUY com BID: ", bid);
               closed = OrderClose(OrderTicket(), OrderLots(), bid, 3);
            }
            else if(OrderType() == OP_SELL)
            {
               double ask = MarketInfo(OrderSymbol(), MODE_ASK);
               Print("   Fechando SELL com ASK: ", ask);
               closed = OrderClose(OrderTicket(), OrderLots(), ask, 3);
            }
            
            if(closed)
            {
               closedCount++;
               Print("✅ Posição fechada com sucesso: ", OrderTicket());
            }
            else
            {
               failedCount++;
               int error = GetLastError();
               Print("❌ ERRO ao fechar posição: ", OrderTicket());
               Print("   Código do erro: ", error);
               Print("   Descrição: ", ErrorDescription(error));
            }
         }
         else
         {
            Print("⏭️ Pulando ordem (não é BUY/SELL): tipo ", OrderType());
         }
      }
      else
      {
         Print("❌ Erro ao selecionar ordem no índice: ", i);
      }
   }
   
   Print("📊 === RESULTADO FINAL CLOSE_ALL ===");
   Print("✅ Posições fechadas: ", closedCount);
   Print("❌ Posições falharam: ", failedCount);
   Print("📊 Total processado: ", closedCount + failedCount);
   
   // Atualizar status do comando
   if(commandId != "")
   {
      if(failedCount == 0)
      {
         UpdateCommandStatus(commandId, "EXECUTED", "");
      }
      else
      {
         UpdateCommandStatus(commandId, "FAILED", "Algumas posições falharam ao fechar");
      }
   }
   else
   {
      Print("⚠️ ID do comando não encontrado - status não será atualizado");
   }
}

//+------------------------------------------------------------------+
// FUNÇÃO MELHORADA: Extrair ID do comando
//+------------------------------------------------------------------+
string ExtractCommandId(string jsonResponse)
{
   Print("🔍 Extraindo ID do comando...");
   Print("📋 JSON para análise: ", jsonResponse);
   
   // Buscar por "id":"..." no JSON
   int idPos = StringFind(jsonResponse, "\"id\":\"");
   if(idPos >= 0)
   {
      Print("✅ Padrão 'id' encontrado na posição: ", idPos);
      idPos += 6; // Pular "id":"
      int endPos = StringFind(jsonResponse, "\"", idPos);
      if(endPos > idPos)
      {
         string commandId = StringSubstr(jsonResponse, idPos, endPos - idPos);
         Print("🆔 ID extraído: ", commandId);
         return commandId;
      }
      else
      {
         Print("❌ Não foi possível encontrar o fim do ID");
      }
   }
   else
   {
      Print("❌ Padrão 'id' não encontrado no JSON");
   }
   return "";
}

//+------------------------------------------------------------------+
// FUNÇÃO MELHORADA: Atualizar status do comando
//+------------------------------------------------------------------+
void UpdateCommandStatus(string commandId, string status, string errorMessage)
{
   Print("📤 === ATUALIZANDO STATUS DO COMANDO ===");
   Print("🆔 Command ID: ", commandId);
   Print("📊 Status: ", status);
   Print("❌ Error Message: ", errorMessage);
   
   string url = "https://kgrlcsimdszbrkcwjpke.supabase.co/functions/v1/update-command-status";
   string headers = "Content-Type: application/json\r\n";
   
   string jsonData = "{";
   jsonData += "\"commandId\":\"" + commandId + "\",";
   jsonData += "\"status\":\"" + status + "\"";
   if(errorMessage != "")
   {
      jsonData += ",\"errorMessage\":\"" + errorMessage + "\"";
   }
   jsonData += "}";
   
   Print("📦 Dados a enviar: ", jsonData);
   
   char post[];
   char result[];
   string resultHeaders;
   
   StringToCharArray(jsonData, post, 0, WHOLE_ARRAY);
   ArrayResize(post, ArraySize(post) - 1);
   
   int res = WebRequest("POST", url, headers, 5000, post, result, resultHeaders);
   
   Print("📡 Código de resposta: ", res);
   
   if(res == 200)
   {
      string response = CharArrayToString(result);
      Print("✅ Status atualizado com sucesso!");
      Print("📋 Resposta: ", response);
   }
   else
   {
      Print("❌ Erro ao atualizar status. Código: ", res);
      if(ArraySize(result) > 0)
      {
         string errorResponse = CharArrayToString(result);
         Print("📋 Resposta de erro: ", errorResponse);
      }
   }
}

//+------------------------------------------------------------------+
// FUNÇÃO AUXILIAR: Descrição de erros
//+------------------------------------------------------------------+
string ErrorDescription(int error_code)
{
   switch(error_code)
   {
      case 0:    return "Sem erro";
      case 1:    return "Sem erro, mas resultado desconhecido";
      case 2:    return "Erro comum";
      case 3:    return "Parâmetros inválidos";
      case 4:    return "Servidor de negociação ocupado";
      case 5:    return "Versão antiga do terminal cliente";
      case 6:    return "Sem conexão com o servidor de negociação";
      case 7:    return "Não há direitos suficientes";
      case 8:    return "Frequência muito alta de solicitações";
      case 9:    return "Operação malformada";
      case 64:   return "Conta desabilitada";
      case 65:   return "Número de conta inválido";
      case 128:  return "Tempo limite de negociação expirado";
      case 129:  return "Preço inválido";
      case 130:  return "Stops inválidos";
      case 131:  return "Volume inválido";
      case 132:  return "Mercado fechado";
      case 133:  return "Negociação desabilitada";
      case 134:  return "Dinheiro insuficiente";
      case 135:  return "Preço mudou";
      case 136:  return "Broker ocupado";
      case 137:  return "Broker ocupado";
      case 138:  return "Nova cotação";
      case 139:  return "Ordem bloqueada";
      case 140:  return "Permitido apenas compra";
      case 141:  return "Muitas solicitações";
      case 145:  return "Modificação negada porque ordem muito próxima ao mercado";
      case 146:  return "Sistema de negociação ocupado";
      case 147:  return "Uso de data de expiração de ordem negado pelo broker";
      case 148:  return "Número de ordens abertas e pendentes chegou ao limite";
      default:   return "Erro desconhecido #" + IntegerToString(error_code);
   }
}
