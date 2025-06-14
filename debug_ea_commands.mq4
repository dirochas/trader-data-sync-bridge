//+------------------------------------------------------------------+
//|                                           TradingDataSender.mq4 |
//|                                                                  |
//+------------------------------------------------------------------+
#property version   "2.08"
#property strict

input string ServerURL = "https://kgrlcsimdszbrkcwjpke.supabase.co/functions/v1/trading-data";
input int SendIntervalSeconds = 3; // Intervalo de envio (segundos)
input bool UseTimer = true; // true = OnTimer (sem ticks), false = OnTick (com ticks)

// NOVAS VARIÁVEIS PARA POLLING DE COMANDOS
input bool EnableCommandPolling = true; // Habilitar polling de comandos
input int CommandCheckIntervalSeconds = 1; // Intervalo para verificar comandos (segundos)
input int IdleCommandCheckIntervalSeconds = 30; // Intervalo quando não há ordens (segundos)

// SISTEMA DE LOGS MELHORADO
enum LogLevel {
   LOG_NONE = 0,        // Sem logs
   LOG_ESSENTIAL = 1,   // Apenas logs essenciais
   LOG_CRITICAL = 2,    // Logs críticos + essenciais
   LOG_ALL = 3          // Todos os logs
};

input LogLevel LoggingLevel = LOG_ESSENTIAL; // Nível de logging

datetime lastSendTime = 0;
datetime lastCommandCheck = 0;
datetime lastIdleLog = 0;
bool lastHadOrders = false; // Para detectar mudanças de estado
int lastOrderCount = -1;    // Para detectar mudanças na quantidade de ordens

//+------------------------------------------------------------------+
// SISTEMA DE LOGGING MELHORADO
//+------------------------------------------------------------------+
void LogPrint(LogLevel level, string category, string message)
{
   if(LoggingLevel == LOG_NONE) return;
   if(level > LoggingLevel) return;
   
   string prefix = "";
   switch(level) {
      case LOG_ESSENTIAL: prefix = "📌 "; break;
      case LOG_CRITICAL:  prefix = "🚨 "; break;
      case LOG_ALL:       prefix = "💬 "; break;
   }
   
   Print(prefix + "[" + category + "] " + message);
}

void LogSeparator(string category)
{
   if(LoggingLevel == LOG_NONE) return;
   Print("═══════════════════════════════════════════════════════════");
   Print("                    " + category);
   Print("═══════════════════════════════════════════════════════════");
}

void LogSubSeparator(string subcategory)
{
   if(LoggingLevel == LOG_NONE) return;
   Print("─────────────── " + subcategory + " ───────────────");
}

//+------------------------------------------------------------------+
int OnInit()
{
   LogSeparator("EA INICIALIZAÇÃO");
   LogPrint(LOG_ESSENTIAL, "INIT", "EA TRADING DATA SENDER INICIADO");
   LogPrint(LOG_ESSENTIAL, "INIT", "Versão: 2.08 - Sistema Inteligente");
   LogPrint(LOG_ALL, "CONFIG", "URL do servidor: " + ServerURL);
   LogPrint(LOG_ALL, "CONFIG", "Intervalo de envio: " + IntegerToString(SendIntervalSeconds) + " segundos");
   LogPrint(LOG_ALL, "CONFIG", "Modo selecionado: " + (UseTimer ? "TIMER (sem ticks)" : "TICK (com ticks)"));
   LogPrint(LOG_ALL, "CONFIG", "Polling de comandos: " + (EnableCommandPolling ? "HABILITADO" : "DESABILITADO"));
   LogPrint(LOG_ALL, "CONFIG", "Intervalo ativo: " + IntegerToString(CommandCheckIntervalSeconds) + "s | Intervalo idle: " + IntegerToString(IdleCommandCheckIntervalSeconds) + "s");
   LogPrint(LOG_ALL, "CONFIG", "Nível de log: " + EnumToString(LoggingLevel));
   
   if(UseTimer)
   {
      EventSetTimer(SendIntervalSeconds);
      LogPrint(LOG_ESSENTIAL, "TIMER", "Timer configurado para " + IntegerToString(SendIntervalSeconds) + " segundos");
      LogPrint(LOG_ALL, "TIMER", "EA funcionará mesmo com mercado FECHADO");
   }
   else
   {
      LogPrint(LOG_ALL, "TIMER", "EA funcionará apenas com mercado ABERTO (ticks)");
   }
   
   // Enviar dados imediatamente na inicialização
   LogPrint(LOG_ESSENTIAL, "INIT", "Enviando dados iniciais...");
   SendTradingDataIntelligent();
   
   return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   LogSeparator("EA FINALIZAÇÃO");
   if(UseTimer)
   {
      EventKillTimer();
      LogPrint(LOG_ESSENTIAL, "TIMER", "Timer finalizado");
   }
   LogPrint(LOG_ESSENTIAL, "DEINIT", "EA FINALIZADO - Motivo: " + IntegerToString(reason));
}

//+------------------------------------------------------------------+
void OnTick()
{
   // Só funciona se UseTimer = false
   if(!UseTimer && TimeCurrent() - lastSendTime >= SendIntervalSeconds)
   {
      LogPrint(LOG_ALL, "TICK", "OnTick executado - enviando dados...");
      SendTradingDataIntelligent();
      lastSendTime = TimeCurrent();
   }
}

//+------------------------------------------------------------------+
// NOVA FUNÇÃO INTELIGENTE: Verificar se há necessidade de processar
//+------------------------------------------------------------------+
bool HasOpenOrdersOrPendingOrders()
{
   int openPositions = 0;
   int pendingOrders = 0;
   
   for(int i = 0; i < OrdersTotal(); i++)
   {
      if(OrderSelect(i, SELECT_BY_POS))
      {
         if(OrderType() <= 1) // BUY/SELL
            openPositions++;
         else
            pendingOrders++;
      }
   }
   
   return (openPositions > 0 || pendingOrders > 0);
}

//+------------------------------------------------------------------+
// NOVA FUNÇÃO INTELIGENTE: Envio de dados com verificação prévia
//+------------------------------------------------------------------+
void SendTradingDataIntelligent()
{
   int currentOrderCount = OrdersTotal();
   bool hasOrders = HasOpenOrdersOrPendingOrders();
   
   // Detectar mudanças de estado
   bool stateChanged = (lastHadOrders != hasOrders) || (lastOrderCount != currentOrderCount);
   
   if(!hasOrders)
   {
      // SEM ORDENS - Modo econômico
      if(stateChanged || TimeCurrent() - lastIdleLog >= 300) // Log a cada 5 minutos quando idle
      {
         LogSubSeparator("STATUS IDLE");
         LogPrint(LOG_ESSENTIAL, "IDLE", "Conta " + IntegerToString(AccountNumber()) + " sem ordens abertas");
         LogPrint(LOG_ESSENTIAL, "IDLE", "Balance: $" + DoubleToString(AccountBalance(), 2) + " | Equity: $" + DoubleToString(AccountEquity(), 2));
         LogPrint(LOG_ALL, "IDLE", "Modo econômico ativo - reduzindo verificações");
         
         // Enviar status "idle" para o servidor (dados mínimos)
         SendIdleStatusToSupabase();
         lastIdleLog = TimeCurrent();
      }
   }
   else
   {
      // COM ORDENS - Modo ativo completo
      if(stateChanged)
      {
         LogPrint(LOG_ESSENTIAL, "ACTIVE", "Detectadas " + IntegerToString(currentOrderCount) + " ordens - ativando modo completo");
      }
      
      LogSubSeparator("COLETA DE DADOS COMPLETA");
      LogPrint(LOG_ALL, "DATA", "Iniciando coleta completa de dados");
      
      string jsonData = BuildJsonData();
      
      // Debug - salvar em arquivo apenas quando necessário
      if(LoggingLevel >= LOG_ALL)
      {
         int file = FileOpen("trading_data.json", FILE_WRITE|FILE_TXT);
         if(file != INVALID_HANDLE)
         {
            FileWrite(file, jsonData);
            FileClose(file);
            LogPrint(LOG_ALL, "DEBUG", "Dados salvos em arquivo: trading_data.json");
         }
      }
      
      // Enviar via HTTP para Supabase
      SendToSupabase(jsonData);
   }
   
   // Atualizar estado anterior
   lastHadOrders = hasOrders;
   lastOrderCount = currentOrderCount;
}

//+------------------------------------------------------------------+
// NOVA FUNÇÃO: Enviar status "idle" para o servidor (dados mínimos)
//+------------------------------------------------------------------+
void SendIdleStatusToSupabase()
{
   LogPrint(LOG_ALL, "IDLE", "Enviando status idle para servidor...");
   
   string jsonData = "{";
   jsonData += "\"account\":{";
   jsonData += "\"balance\":" + DoubleToString(AccountBalance(), 2) + ",";
   jsonData += "\"equity\":" + DoubleToString(AccountEquity(), 2) + ",";
   jsonData += "\"profit\":0.00,";
   jsonData += "\"accountNumber\":\"" + IntegerToString(AccountNumber()) + "\",";
   jsonData += "\"server\":\"" + AccountServer() + "\",";
   jsonData += "\"leverage\":" + IntegerToString(AccountLeverage());
   jsonData += "},";
   jsonData += "\"margin\":{\"used\":0.00,\"free\":" + DoubleToString(AccountFreeMargin(), 2) + ",\"level\":0.00},";
   jsonData += "\"positions\":[],";
   jsonData += "\"history\":[],";
   jsonData += "\"status\":\"IDLE\"";
   jsonData += "}";
   
   SendToSupabase(jsonData);
}

//+------------------------------------------------------------------+
void SendToSupabase(string jsonData)
{
   bool isIdle = (StringFind(jsonData, "\"status\":\"IDLE\"") >= 0);
   
   if(!isIdle)
   {
      LogSubSeparator("ENVIO SUPABASE");
   }
   
   LogPrint(isIdle ? LOG_ALL : LOG_ALL, "HTTP", "URL: " + ServerURL);
   LogPrint(isIdle ? LOG_ALL : LOG_ALL, "HTTP", "Tamanho dos dados: " + IntegerToString(StringLen(jsonData)) + " caracteres");
   
   string headers = "Content-Type: application/json\r\n";
   
   char post[];
   char result[];
   string resultHeaders;
   
   // Converter string para array de bytes
   StringToCharArray(jsonData, post, 0, WHOLE_ARRAY);
   ArrayResize(post, ArraySize(post) - 1); // Remove null terminator
   
   LogPrint(isIdle ? LOG_ALL : LOG_ALL, "HTTP", "Fazendo requisição HTTP POST...");
   
   // Fazer requisição HTTP POST
   int timeout = 10000; // 10 segundos
   int res = WebRequest("POST", ServerURL, headers, timeout, post, result, resultHeaders);
   
   LogPrint(isIdle ? LOG_ALL : LOG_ESSENTIAL, "HTTP", "Código de resposta: " + IntegerToString(res));
   
   if(res == 200)
   {
      LogPrint(isIdle ? LOG_ALL : LOG_ESSENTIAL, "SUCCESS", "Dados enviados para Supabase com sucesso!");
      string response = CharArrayToString(result);
      LogPrint(LOG_ALL, "RESPONSE", "Resposta do servidor: " + response);
   }
   else if(res == -1)
   {
      LogPrint(LOG_CRITICAL, "ERROR", "URL não permitida no WebRequest!");
      LogPrint(LOG_CRITICAL, "SOLUTION", "Adicione esta URL nas configurações:");
      LogPrint(LOG_CRITICAL, "SOLUTION", "Ferramentas → Opções → Expert Advisors → WebRequest");
      LogPrint(LOG_CRITICAL, "SOLUTION", "URL: https://kgrlcsimdszbrkcwjpke.supabase.co");
   }
   else if(res == 0)
   {
      LogPrint(LOG_CRITICAL, "ERROR", "Timeout ou sem conexão com internet");
   }
   else
   {
      LogPrint(LOG_CRITICAL, "ERROR", "Erro HTTP: " + IntegerToString(res));
      LogPrint(LOG_ALL, "DEBUG", "Headers de resposta: " + resultHeaders);
      if(ArraySize(result) > 0)
      {
         string errorResponse = CharArrayToString(result);
         LogPrint(LOG_ALL, "DEBUG", "Resposta de erro: " + errorResponse);
      }
   }
}

//+------------------------------------------------------------------+
string BuildJsonData()
{
   LogPrint(LOG_ALL, "JSON", "Construindo dados JSON...");
   
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
   
   LogPrint(LOG_ESSENTIAL, "ACCOUNT", "Conta: " + IntegerToString(AccountNumber()) + " | Balance: $" + DoubleToString(AccountBalance(), 2));
   
   // Margin Info
   json += "\"margin\":{";
   json += "\"used\":" + DoubleToString(AccountMargin(), 2) + ",";
   json += "\"free\":" + DoubleToString(AccountFreeMargin(), 2) + ",";
   json += "\"level\":" + DoubleToString(AccountMargin() == 0 ? 0 : AccountEquity()/AccountMargin()*100, 2);
   json += "},";
   
   LogPrint(LOG_ALL, "MARGIN", "Usada: $" + DoubleToString(AccountMargin(), 2) + " | Livre: $" + DoubleToString(AccountFreeMargin(), 2));
   
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
   
   LogPrint(LOG_ESSENTIAL, "POSITIONS", "Posições abertas: " + IntegerToString(posCount));
   
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
   
   LogPrint(LOG_ALL, "HISTORY", "Histórico de trades: " + IntegerToString(histCount));
   LogPrint(LOG_ALL, "JSON", "JSON construído com sucesso");
   
   return json;
}

//+------------------------------------------------------------------+
void OnTimer()
{
   // Só funciona se UseTimer = true
   if(UseTimer)
   {
      LogSeparator("EXECUÇÃO TIMER");
      LogPrint(LOG_ESSENTIAL, "TIMER", "Timer executado - " + TimeToString(TimeCurrent()));
      SendTradingDataIntelligent();
      lastSendTime = TimeCurrent();
      
      // NOVA FUNCIONALIDADE INTELIGENTE: Verificar comandos com intervalos dinâmicos
      if(EnableCommandPolling)
      {
         bool hasOrders = HasOpenOrdersOrPendingOrders();
         int intervalToUse = hasOrders ? CommandCheckIntervalSeconds : IdleCommandCheckIntervalSeconds;
         
         if(TimeCurrent() - lastCommandCheck >= intervalToUse)
         {
            LogPrint(hasOrders ? LOG_ALL : LOG_ALL, "POLLING", "Iniciando verificação de comandos...");
            LogPrint(LOG_ALL, "POLLING", "Modo: " + (hasOrders ? "ATIVO" : "IDLE") + " | Intervalo: " + IntegerToString(intervalToUse) + "s");
            CheckPendingCommands();
            lastCommandCheck = TimeCurrent();
         }
         else
         {
            int remaining = intervalToUse - (TimeCurrent() - lastCommandCheck);
            LogPrint(LOG_ALL, "POLLING", "Próxima verificação em: " + IntegerToString(remaining) + "s (" + (hasOrders ? "modo ativo" : "modo idle") + ")");
         }
      }
   }
}

//+------------------------------------------------------------------+
// FUNÇÃO MELHORADA: Verificar comandos pendentes
//+------------------------------------------------------------------+
void CheckPendingCommands()
{
   LogSubSeparator("VERIFICAÇÃO DE COMANDOS");
   LogPrint(LOG_ESSENTIAL, "COMMANDS", "Verificando comandos para conta: " + IntegerToString(AccountNumber()));
   
   string url = "https://kgrlcsimdszbrkcwjpke.supabase.co/functions/v1/get-commands?accountNumber=" + IntegerToString(AccountNumber());
   LogPrint(LOG_ALL, "GET", "URL: " + url);
   
   string headers = "Content-Type: application/json\r\n";
   
   char result[];
   string resultHeaders;
   
   // CORREÇÃO: Usar array vazio para requisição GET
   char emptyPost[];
   
   LogPrint(LOG_ALL, "GET", "Fazendo requisição GET...");
   int res = WebRequest("GET", url, headers, 5000, emptyPost, result, resultHeaders);
   
   LogPrint(LOG_ESSENTIAL, "GET", "Código de resposta: " + IntegerToString(res));
   LogPrint(LOG_ALL, "GET", "Headers de resposta: " + resultHeaders);
   
   if(res == 200)
   {
      string response = CharArrayToString(result);
      LogPrint(LOG_ESSENTIAL, "SUCCESS", "Comandos recebidos com sucesso!");
      LogPrint(LOG_ALL, "RESPONSE", "Resposta completa: " + response);
      LogPrint(LOG_ALL, "RESPONSE", "Tamanho: " + IntegerToString(StringLen(response)) + " caracteres");
      
      // Verificar se existe o campo "commands" na resposta
      if(StringFind(response, "\"commands\"") >= 0)
      {
         LogPrint(LOG_ALL, "PARSE", "Campo 'commands' encontrado");
         
         // Verificar se existem comandos
         if(StringFind(response, "\"commands\":[]") >= 0)
         {
            LogPrint(LOG_ESSENTIAL, "COMMANDS", "Nenhum comando pendente");
         }
         else
         {
            LogPrint(LOG_CRITICAL, "COMMANDS", "Comandos encontrados! Processando...");
            
            // Verificar especificamente por CLOSE_ALL
            if(StringFind(response, "CLOSE_ALL") >= 0)
            {
               LogPrint(LOG_CRITICAL, "COMMAND", "COMANDO CLOSE_ALL ENCONTRADO!");
               ExecuteCloseAllCommand(response);
            }
            else
            {
               LogPrint(LOG_ALL, "COMMAND", "Outros comandos encontrados, mas não CLOSE_ALL");
            }
         }
      }
      else
      {
         LogPrint(LOG_CRITICAL, "ERROR", "Campo 'commands' não encontrado na resposta");
      }
   }
   else if(res == -1)
   {
      LogPrint(LOG_CRITICAL, "ERROR", "URL não permitida no WebRequest!");
      LogPrint(LOG_CRITICAL, "SOLUTION", "Adicione estas URLs nas configurações:");
      LogPrint(LOG_CRITICAL, "SOLUTION", "Ferramentas → Opções → Expert Advisors → WebRequest");
      LogPrint(LOG_CRITICAL, "SOLUTION", "URLs: https://kgrlcsimdszbrkcwjpke.supabase.co e *.supabase.co");
   }
   else if(res == 0)
   {
      LogPrint(LOG_CRITICAL, "ERROR", "Timeout ou sem conexão");
   }
   else
   {
      LogPrint(LOG_CRITICAL, "ERROR", "Erro HTTP: " + IntegerToString(res));
      if(ArraySize(result) > 0)
      {
         string errorResponse = CharArrayToString(result);
         LogPrint(LOG_ALL, "DEBUG", "Resposta de erro: " + errorResponse);
      }
   }
}

//+------------------------------------------------------------------+
// FUNÇÃO MELHORADA: Executar comando CLOSE_ALL
//+------------------------------------------------------------------+
void ExecuteCloseAllCommand(string jsonResponse)
{
   LogSubSeparator("EXECUÇÃO CLOSE_ALL");
   LogPrint(LOG_CRITICAL, "EXECUTE", "Executando comando CLOSE_ALL");
   
   // Extrair ID do comando (parsing simples)
   string commandId = ExtractCommandId(jsonResponse);
   LogPrint(LOG_ESSENTIAL, "COMMAND", "ID do comando: " + commandId);
   
   int totalOrders = OrdersTotal();
   LogPrint(LOG_ESSENTIAL, "ORDERS", "Total de ordens antes do fechamento: " + IntegerToString(totalOrders));
   
   int closedCount = 0;
   int failedCount = 0;
   
   // Fechar todas as posições abertas
   for(int i = totalOrders - 1; i >= 0; i--)
   {
      LogPrint(LOG_ALL, "PROCESS", "Processando ordem índice: " + IntegerToString(i));
      
      if(OrderSelect(i, SELECT_BY_POS))
      {
         LogPrint(LOG_ALL, "ORDER", "Ticket: " + IntegerToString(OrderTicket()) + " | Tipo: " + IntegerToString(OrderType()) + " | Symbol: " + OrderSymbol());
         
         if(OrderType() <= 1) // Only BUY/SELL
         {
            LogPrint(LOG_ALL, "CLOSE", "Tentando fechar posição...");
            bool closed = false;
            
            if(OrderType() == OP_BUY)
            {
               double bid = MarketInfo(OrderSymbol(), MODE_BID);
               LogPrint(LOG_ALL, "CLOSE", "Fechando BUY com BID: " + DoubleToString(bid, 5));
               closed = OrderClose(OrderTicket(), OrderLots(), bid, 3);
            }
            else if(OrderType() == OP_SELL)
            {
               double ask = MarketInfo(OrderSymbol(), MODE_ASK);
               LogPrint(LOG_ALL, "CLOSE", "Fechando SELL com ASK: " + DoubleToString(ask, 5));
               closed = OrderClose(OrderTicket(), OrderLots(), ask, 3);
            }
            
            if(closed)
            {
               closedCount++;
               LogPrint(LOG_ESSENTIAL, "SUCCESS", "Posição fechada: " + IntegerToString(OrderTicket()));
            }
            else
            {
               failedCount++;
               int error = GetLastError();
               LogPrint(LOG_CRITICAL, "ERROR", "Falha ao fechar posição: " + IntegerToString(OrderTicket()));
               LogPrint(LOG_CRITICAL, "ERROR", "Código: " + IntegerToString(error) + " | " + ErrorDescription(error));
            }
         }
         else
         {
            LogPrint(LOG_ALL, "SKIP", "Pulando ordem (não é BUY/SELL): tipo " + IntegerToString(OrderType()));
         }
      }
      else
      {
         LogPrint(LOG_CRITICAL, "ERROR", "Erro ao selecionar ordem no índice: " + IntegerToString(i));
      }
   }
   
   LogPrint(LOG_ESSENTIAL, "RESULT", "Posições fechadas: " + IntegerToString(closedCount) + " | Falharam: " + IntegerToString(failedCount));
   
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
      LogPrint(LOG_CRITICAL, "ERROR", "ID do comando não encontrado - status não será atualizado");
   }
}

//+------------------------------------------------------------------+
// FUNÇÃO MELHORADA: Extrair ID do comando
//+------------------------------------------------------------------+
string ExtractCommandId(string jsonResponse)
{
   LogPrint(LOG_ALL, "PARSE", "Extraindo ID do comando...");
   LogPrint(LOG_ALL, "PARSE", "JSON: " + jsonResponse);
   
   // Buscar por "id":"..." no JSON
   int idPos = StringFind(jsonResponse, "\"id\":\"");
   if(idPos >= 0)
   {
      LogPrint(LOG_ALL, "PARSE", "Padrão 'id' encontrado na posição: " + IntegerToString(idPos));
      idPos += 6; // Pular "id":"
      int endPos = StringFind(jsonResponse, "\"", idPos);
      if(endPos > idPos)
      {
         string commandId = StringSubstr(jsonResponse, idPos, endPos - idPos);
         LogPrint(LOG_ALL, "PARSE", "ID extraído: " + commandId);
         return commandId;
      }
      else
      {
         LogPrint(LOG_CRITICAL, "ERROR", "Não foi possível encontrar o fim do ID");
      }
   }
   else
   {
      LogPrint(LOG_CRITICAL, "ERROR", "Padrão 'id' não encontrado no JSON");
   }
   return "";
}

//+------------------------------------------------------------------+
// FUNÇÃO MELHORADA: Atualizar status do comando
//+------------------------------------------------------------------+
void UpdateCommandStatus(string commandId, string status, string errorMessage)
{
   LogSubSeparator("ATUALIZAÇÃO STATUS");
   LogPrint(LOG_ESSENTIAL, "UPDATE", "Command ID: " + commandId + " | Status: " + status);
   
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
   
   LogPrint(LOG_ALL, "POST", "Dados: " + jsonData);
   
   char post[];
   char result[];
   string resultHeaders;
   
   StringToCharArray(jsonData, post, 0, WHOLE_ARRAY);
   ArrayResize(post, ArraySize(post) - 1);
   
   int res = WebRequest("POST", url, headers, 5000, post, result, resultHeaders);
   
   LogPrint(LOG_ESSENTIAL, "POST", "Código de resposta: " + IntegerToString(res));
   
   if(res == 200)
   {
      string response = CharArrayToString(result);
      LogPrint(LOG_ESSENTIAL, "SUCCESS", "Status atualizado com sucesso!");
      LogPrint(LOG_ALL, "RESPONSE", "Resposta: " + response);
   }
   else
   {
      LogPrint(LOG_CRITICAL, "ERROR", "Erro ao atualizar status. Código: " + IntegerToString(res));
      if(ArraySize(result) > 0)
      {
         string errorResponse = CharArrayToString(result);
         LogPrint(LOG_ALL, "DEBUG", "Resposta de erro: " + errorResponse);
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
