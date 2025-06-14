
//+------------------------------------------------------------------+
//|                                           TradingDataSender.mq5 |
//|                                                                  |
//+------------------------------------------------------------------+
#property version   "2.09"

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

// NOVA FLAG INTELIGENTE PARA CONTROLAR LOGS REPETITIVOS
bool idleLogAlreadyShown = false; // Flag para evitar logs repetitivos quando idle
bool activeLogAlreadyShown = false; // Flag para evitar logs repetitivos quando ativo

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
   LogPrint(LOG_ESSENTIAL, "INIT", "Versão: 2.09 - Sistema Inteligente MQL5");
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
// NOVA FUNÇÃO INTELIGENTE: Verificar se há necessidade de processar (MQL5)
//+------------------------------------------------------------------+
bool HasOpenOrdersOrPendingOrders()
{
   int openPositions = PositionsTotal();
   int pendingOrders = OrdersTotal();
   
   return (openPositions > 0 || pendingOrders > 0);
}

//+------------------------------------------------------------------+
// FUNÇÃO INTELIGENTE CORRIGIDA: Envio de dados com verificação prévia
//+------------------------------------------------------------------+
void SendTradingDataIntelligent()
{
   int currentOrderCount = PositionsTotal() + OrdersTotal();
   bool hasOrders = HasOpenOrdersOrPendingOrders();
   
   // Detectar mudanças de estado
   bool stateChanged = (lastHadOrders != hasOrders) || (lastOrderCount != currentOrderCount);
   
   if(!hasOrders)
   {
      // SEM ORDENS - Modo econômico MAS SEMPRE ENVIA DADOS PARA SERVIDOR
      
      // Log apenas na primeira vez que entra em modo idle ou a cada 5 minutos
      if(stateChanged || !idleLogAlreadyShown || TimeCurrent() - lastIdleLog >= 300)
      {
         if(stateChanged || !idleLogAlreadyShown)
         {
            LogSubSeparator("MODO IDLE ATIVADO");
            LogPrint(LOG_ESSENTIAL, "IDLE", "Conta " + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) + " sem ordens abertas");
            LogPrint(LOG_ESSENTIAL, "IDLE", "Balance: $" + DoubleToString(AccountInfoDouble(ACCOUNT_BALANCE), 2) + " | Equity: $" + DoubleToString(AccountInfoDouble(ACCOUNT_EQUITY), 2));
            LogPrint(LOG_ALL, "IDLE", "Logs reduzidos ativados - dados continuam sendo enviados");
            idleLogAlreadyShown = true;
            activeLogAlreadyShown = false; // Reset flag do modo ativo
         }
         else
         {
            // Log periódico (a cada 5 minutos)
            LogPrint(LOG_ESSENTIAL, "IDLE", "Status idle - Balance: $" + DoubleToString(AccountInfoDouble(ACCOUNT_BALANCE), 2) + " | Equity: $" + DoubleToString(AccountInfoDouble(ACCOUNT_EQUITY), 2));
         }
         lastIdleLog = TimeCurrent();
      }
      
      // CORREÇÃO: SEMPRE enviar status para o servidor, mesmo sem ordens
      SendIdleStatusToSupabase();
   }
   else
   {
      // COM ORDENS - Modo ativo completo
      if(stateChanged || !activeLogAlreadyShown)
      {
         LogSubSeparator("MODO ATIVO REATIVADO");
         LogPrint(LOG_ESSENTIAL, "ACTIVE", "Detectadas " + IntegerToString(currentOrderCount) + " ordens - logs completos reativados");
         activeLogAlreadyShown = true;
         idleLogAlreadyShown = false; // Reset flag do modo idle
      }
      
      // Logs detalhados apenas se mudou de estado ou se está em nível ALL
      if(stateChanged || LoggingLevel >= LOG_ALL)
      {
         LogSubSeparator("COLETA DE DADOS COMPLETA");
         LogPrint(LOG_ALL, "DATA", "Iniciando coleta completa de dados");
      }
      
      string jsonData = BuildJsonData();
      
      // Debug - salvar em arquivo apenas quando necessário
      if(LoggingLevel >= LOG_ALL && (stateChanged || TimeCurrent() - lastSendTime >= 30))
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
// FUNÇÃO CORRIGIDA: Enviar status "idle" para o servidor (dados mínimos)
//+------------------------------------------------------------------+
void SendIdleStatusToSupabase()
{
   // Log apenas se não foi mostrado ainda ou se está em nível ALL
   if(!idleLogAlreadyShown || LoggingLevel >= LOG_ALL)
   {
      LogPrint(LOG_ALL, "IDLE", "Enviando status idle para servidor (mantendo conexão)...");
   }
   
   string jsonData = "{";
   jsonData += "\"account\":{";
   jsonData += "\"balance\":" + DoubleToString(AccountInfoDouble(ACCOUNT_BALANCE), 2) + ",";
   jsonData += "\"equity\":" + DoubleToString(AccountInfoDouble(ACCOUNT_EQUITY), 2) + ",";
   jsonData += "\"profit\":0.00,";
   jsonData += "\"accountNumber\":\"" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) + "\",";
   jsonData += "\"server\":\"" + AccountInfoString(ACCOUNT_SERVER) + "\",";
   jsonData += "\"leverage\":" + IntegerToString(AccountInfoInteger(ACCOUNT_LEVERAGE));
   jsonData += "},";
   jsonData += "\"margin\":{\"used\":0.00,\"free\":" + DoubleToString(AccountInfoDouble(ACCOUNT_FREEMARGIN), 2) + ",\"level\":0.00},";
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
   
   // Logs do envio apenas se necessário
   if(!isIdle || LoggingLevel >= LOG_ALL)
   {
      if(!isIdle) LogSubSeparator("ENVIO SUPABASE");
      LogPrint(isIdle ? LOG_ALL : LOG_ALL, "HTTP", "URL: " + ServerURL);
      LogPrint(isIdle ? LOG_ALL : LOG_ALL, "HTTP", "Tamanho dos dados: " + IntegerToString(StringLen(jsonData)) + " caracteres");
      LogPrint(isIdle ? LOG_ALL : LOG_ALL, "HTTP", "Fazendo requisição HTTP POST...");
   }
   
   string headers = "Content-Type: application/json\r\n";
   
   char post[];
   char result[];
   string resultHeaders;
   
   // Converter string para array de bytes
   StringToCharArray(jsonData, post, 0, WHOLE_ARRAY);
   ArrayResize(post, ArraySize(post) - 1); // Remove null terminator
   
   // Fazer requisição HTTP POST
   int timeout = 10000; // 10 segundos
   int res = WebRequest("POST", ServerURL, headers, timeout, post, result, resultHeaders);
   
   // Log do resultado apenas se necessário
   if(!isIdle || res != 200 || LoggingLevel >= LOG_ALL)
   {
      LogPrint(isIdle ? LOG_ALL : LOG_ESSENTIAL, "HTTP", "Código de resposta: " + IntegerToString(res));
   }
   
   if(res == 200)
   {
      if(!isIdle || LoggingLevel >= LOG_ALL)
      {
         LogPrint(isIdle ? LOG_ALL : LOG_ESSENTIAL, "SUCCESS", "Dados enviados para Supabase com sucesso!");
         if(LoggingLevel >= LOG_ALL)
         {
            string response = CharArrayToString(result);
            LogPrint(LOG_ALL, "RESPONSE", "Resposta do servidor: " + response);
         }
      }
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
   json += "\"balance\":" + DoubleToString(AccountInfoDouble(ACCOUNT_BALANCE), 2) + ",";
   json += "\"equity\":" + DoubleToString(AccountInfoDouble(ACCOUNT_EQUITY), 2) + ",";
   json += "\"profit\":" + DoubleToString(AccountInfoDouble(ACCOUNT_PROFIT), 2) + ",";
   json += "\"accountNumber\":\"" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) + "\",";
   json += "\"server\":\"" + AccountInfoString(ACCOUNT_SERVER) + "\",";
   json += "\"leverage\":" + IntegerToString(AccountInfoInteger(ACCOUNT_LEVERAGE));
   json += "},";
   
   LogPrint(LOG_ESSENTIAL, "ACCOUNT", "Conta: " + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) + " | Balance: $" + DoubleToString(AccountInfoDouble(ACCOUNT_BALANCE), 2));
   
   // Margin Info
   json += "\"margin\":{";
   json += "\"used\":" + DoubleToString(AccountInfoDouble(ACCOUNT_MARGIN), 2) + ",";
   json += "\"free\":" + DoubleToString(AccountInfoDouble(ACCOUNT_FREEMARGIN), 2) + ",";
   json += "\"level\":" + DoubleToString(AccountInfoDouble(ACCOUNT_MARGIN) == 0 ? 0 : AccountInfoDouble(ACCOUNT_EQUITY)/AccountInfoDouble(ACCOUNT_MARGIN)*100, 2);
   json += "},";
   
   LogPrint(LOG_ALL, "MARGIN", "Usada: $" + DoubleToString(AccountInfoDouble(ACCOUNT_MARGIN), 2) + " | Livre: $" + DoubleToString(AccountInfoDouble(ACCOUNT_FREEMARGIN), 2));
   
   // Open Positions (MQL5)
   json += "\"positions\":[";
   int posCount = 0;
   for(int i = 0; i < PositionsTotal(); i++)
   {
      if(PositionGetTicket(i) > 0)
      {
         if(posCount > 0) json += ",";
         json += "{";
         json += "\"ticket\":" + IntegerToString(PositionGetInteger(POSITION_IDENTIFIER)) + ",";
         json += "\"symbol\":\"" + PositionGetString(POSITION_SYMBOL) + "\",";
         json += "\"type\":\"" + (PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY ? "BUY" : "SELL") + "\",";
         json += "\"volume\":" + DoubleToString(PositionGetDouble(POSITION_VOLUME), 2) + ",";
         json += "\"openPrice\":" + DoubleToString(PositionGetDouble(POSITION_PRICE_OPEN), 5) + ",";
         json += "\"currentPrice\":" + DoubleToString(PositionGetDouble(POSITION_PRICE_CURRENT), 5) + ",";
         json += "\"profit\":" + DoubleToString(PositionGetDouble(POSITION_PROFIT), 2) + ",";
         json += "\"openTime\":\"" + TimeToString((datetime)PositionGetInteger(POSITION_TIME)) + "\"";
         json += "}";
         posCount++;
      }
   }
   json += "],";
   
   LogPrint(LOG_ESSENTIAL, "POSITIONS", "Posições abertas: " + IntegerToString(posCount));
   
   // Trade History (últimos 10) - MQL5
   json += "\"history\":[";
   int histCount = 0;
   
   // Selecionar histórico dos últimos 30 dias
   datetime from = TimeCurrent() - 30*24*3600;
   datetime to = TimeCurrent();
   
   if(HistorySelect(from, to))
   {
      int total = HistoryDealsTotal();
      for(int i = total-1; i >= 0 && histCount < 10; i--)
      {
         ulong ticket = HistoryDealGetTicket(i);
         if(ticket > 0)
         {
            if(HistoryDealGetInteger(ticket, DEAL_ENTRY) == DEAL_ENTRY_OUT) // Apenas saídas (fechamentos)
            {
               if(histCount > 0) json += ",";
               json += "{";
               json += "\"ticket\":" + IntegerToString(ticket) + ",";
               json += "\"symbol\":\"" + HistoryDealGetString(ticket, DEAL_SYMBOL) + "\",";
               json += "\"type\":\"" + (HistoryDealGetInteger(ticket, DEAL_TYPE) == DEAL_TYPE_BUY ? "BUY" : "SELL") + "\",";
               json += "\"volume\":" + DoubleToString(HistoryDealGetDouble(ticket, DEAL_VOLUME), 2) + ",";
               json += "\"openPrice\":" + DoubleToString(HistoryDealGetDouble(ticket, DEAL_PRICE), 5) + ",";
               json += "\"closePrice\":" + DoubleToString(HistoryDealGetDouble(ticket, DEAL_PRICE), 5) + ",";
               json += "\"profit\":" + DoubleToString(HistoryDealGetDouble(ticket, DEAL_PROFIT), 2) + ",";
               json += "\"openTime\":\"" + TimeToString((datetime)HistoryDealGetInteger(ticket, DEAL_TIME)) + "\",";
               json += "\"closeTime\":\"" + TimeToString((datetime)HistoryDealGetInteger(ticket, DEAL_TIME)) + "\"";
               json += "}";
               histCount++;
            }
         }
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
      // Log reduzido do timer
      bool hasOrders = HasOpenOrdersOrPendingOrders();
      
      // Log do timer apenas se mudou de estado ou se está em modo ativo com ordens
      if(!idleLogAlreadyShown || hasOrders || LoggingLevel >= LOG_ALL)
      {
         LogSeparator("EXECUÇÃO TIMER");
         LogPrint(LOG_ESSENTIAL, "TIMER", "Timer executado - " + TimeToString(TimeCurrent()));
      }
      
      SendTradingDataIntelligent();
      lastSendTime = TimeCurrent();
      
      // NOVA FUNCIONALIDADE INTELIGENTE: Verificar comandos com intervalos dinâmicos
      if(EnableCommandPolling)
      {
         int intervalToUse = hasOrders ? CommandCheckIntervalSeconds : IdleCommandCheckIntervalSeconds;
         
         if(TimeCurrent() - lastCommandCheck >= intervalToUse)
         {
            // Log apenas se necessário
            if(!idleLogAlreadyShown || hasOrders || LoggingLevel >= LOG_ALL)
            {
               LogPrint(hasOrders ? LOG_ALL : LOG_ALL, "POLLING", "Iniciando verificação de comandos...");
               LogPrint(LOG_ALL, "POLLING", "Modo: " + (hasOrders ? "ATIVO" : "IDLE") + " | Intervalo: " + IntegerToString(intervalToUse) + "s");
            }
            CheckPendingCommands();
            lastCommandCheck = TimeCurrent();
         }
         else
         {
            if(LoggingLevel >= LOG_ALL)
            {
               int remaining = intervalToUse - (int)(TimeCurrent() - lastCommandCheck);
               LogPrint(LOG_ALL, "POLLING", "Próxima verificação em: " + IntegerToString(remaining) + "s (" + (hasOrders ? "modo ativo" : "modo idle") + ")");
            }
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
   LogPrint(LOG_ESSENTIAL, "COMMANDS", "Verificando comandos para conta: " + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)));
   
   string url = "https://kgrlcsimdszbrkcwjpke.supabase.co/functions/v1/get-commands?accountNumber=" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN));
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
// FUNÇÃO MELHORADA: Executar comando CLOSE_ALL (MQL5)
//+------------------------------------------------------------------+
void ExecuteCloseAllCommand(string jsonResponse)
{
   LogSubSeparator("EXECUÇÃO CLOSE_ALL");
   LogPrint(LOG_CRITICAL, "EXECUTE", "Executando comando CLOSE_ALL");
   
   // Extrair ID do comando (parsing simples)
   string commandId = ExtractCommandId(jsonResponse);
   LogPrint(LOG_ESSENTIAL, "COMMAND", "ID do comando: " + commandId);
   
   int totalPositions = PositionsTotal();
   LogPrint(LOG_ESSENTIAL, "POSITIONS", "Total de posições antes do fechamento: " + IntegerToString(totalPositions));
   
   int closedCount = 0;
   int failedCount = 0;
   
   // Fechar todas as posições abertas (MQL5)
   for(int i = totalPositions - 1; i >= 0; i--)
   {
      LogPrint(LOG_ALL, "PROCESS", "Processando posição índice: " + IntegerToString(i));
      
      if(PositionGetTicket(i) > 0)
      {
         string symbol = PositionGetString(POSITION_SYMBOL);
         double volume = PositionGetDouble(POSITION_VOLUME);
         ulong ticket = PositionGetInteger(POSITION_IDENTIFIER);
         ENUM_POSITION_TYPE posType = (ENUM_POSITION_TYPE)PositionGetInteger(POSITION_TYPE);
         
         LogPrint(LOG_ALL, "POSITION", "Ticket: " + IntegerToString(ticket) + " | Tipo: " + (posType == POSITION_TYPE_BUY ? "BUY" : "SELL") + " | Symbol: " + symbol);
         
         MqlTradeRequest request = {};
         MqlTradeResult result = {};
         
         request.action = TRADE_ACTION_DEAL;
         request.symbol = symbol;
         request.volume = volume;
         request.type = posType == POSITION_TYPE_BUY ? ORDER_TYPE_SELL : ORDER_TYPE_BUY;
         request.position = ticket;
         request.deviation = 3;
         request.magic = 0;
         
         if(OrderSend(request, result))
         {
            closedCount++;
            LogPrint(LOG_ESSENTIAL, "SUCCESS", "Posição fechada: " + IntegerToString(ticket));
         }
         else
         {
            failedCount++;
            LogPrint(LOG_CRITICAL, "ERROR", "Falha ao fechar posição: " + IntegerToString(ticket));
            LogPrint(LOG_CRITICAL, "ERROR", "Código: " + IntegerToString(result.retcode) + " | " + result.comment);
         }
      }
      else
      {
         LogPrint(LOG_CRITICAL, "ERROR", "Erro ao selecionar posição no índice: " + IntegerToString(i));
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
// FUNÇÃO AUXILIAR: Descrição de erros (MQL5)
//+------------------------------------------------------------------+
string ErrorDescription(int error_code)
{
   switch(error_code)
   {
      case 10004: return "Requote";
      case 10006: return "Requisição rejeitada";
      case 10007: return "Requisição cancelada pelo trader";
      case 10008: return "Ordem colocada";
      case 10009: return "Requisição concluída";
      case 10010: return "Apenas parte da requisição foi executada";
      case 10011: return "Erro de processamento de requisição";
      case 10012: return "Requisição cancelada por timeout";
      case 10013: return "Requisição inválida";
      case 10014: return "Volume inválido na requisição";
      case 10015: return "Preço inválido na requisição";
      case 10016: return "Stops inválidos na requisição";
      case 10017: return "Negociação desabilitada";
      case 10018: return "Mercado fechado";
      case 10019: return "Não há dinheiro suficiente para completar a requisição";
      case 10020: return "Preços mudaram";
      case 10021: return "Não há cotações para processar a requisição";
      case 10022: return "Data de expiração inválida na requisição";
      case 10023: return "Estado da ordem mudou";
      case 10024: return "Muitas requisições";
      case 10025: return "Sem mudanças na requisição de negociação";
      case 10026: return "Autotrading desabilitado pelo servidor";
      case 10027: return "Autotrading desabilitado pelo cliente";
      case 10028: return "Requisição bloqueada para processamento";
      case 10029: return "Ordem ou posição congelada";
      case 10030: return "Tipo de preenchimento de ordem especificado inválido";
      default:   return "Erro desconhecido #" + IntegerToString(error_code);
   }
}
