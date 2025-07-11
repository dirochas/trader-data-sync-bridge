//+------------------------------------------------------------------+
//|                                           TradingDataSender.mq4 |
//|                                                    Versão 2.16  |
//+------------------------------------------------------------------+
#property copyright "MrBot © 2025"
#property version   "2.16"
#property strict

#include "VpsIdentifier_MQL4.mqh"  // BIBLIOTECA VPS

input string ServerURL_MT2 = "https://kgrlcsimdszbrkcwjpke.supabase.co";// Adicione esta URL em configurações → WebRequest
string ServerURL = "https://kgrlcsimdszbrkcwjpke.supabase.co/functions/v1/trading-data";

// NOVA VARIÁVEL PARA IDENTIFICAÇÃO DO USUÁRIO
input string UserEmail = "usuario@exemplo.com"; // Email do usuário para vinculação da conta

input bool UseTimer = true; // true = OnTimer (sem ticks), false = OnTick (com ticks)

// VERSÃO 2.16 - SISTEMA DE ENVIO INTELIGENTE
input int SendIntervalWithOrders = 5; // Intervalo quando há ordens abertas (segundos)
input int SendIntervalNoOrders = 300; // Intervalo quando não há ordens (segundos) - 5 minutos
input int HeartbeatInterval = 600; // Intervalo de heartbeat independente (segundos) - 10 minutos

// NOVAS VARIÁVEIS PARA POLLING DE COMANDOS
input bool EnableCommandPolling = true; // Habilitar polling de comandos
input int CommandCheckIntervalSeconds = 1; // Intervalo para verificar comandos (segundos)
input int IdleCommandCheckIntervalSeconds = 30; // Intervalo quando não há ordens (segundos)

// SISTEMA DE LOGS MELHORADO - VERSÃO 2.16
enum LogLevel {
   LOG_NONE = 0,           // Sem logs
   LOG_ERRORS_ONLY = 1,    // Apenas erros críticos e comandos remotos
   LOG_ESSENTIAL = 2,      // Logs essenciais
   LOG_CRITICAL = 3,       // Logs críticos + essenciais
   LOG_ALL = 4             // Todos os logs
};

input LogLevel LoggingLevel = LOG_ERRORS_ONLY; // Nível de logging

// VARIÁVEL NOVA PARA VPS
bool EnableVpsIdentification = true; // Habilitar identificação de VPS

datetime lastSendTime = 0;
datetime lastCommandCheck = 0;
datetime lastIdleLog = 0;
datetime lastConnectionLog = 0;
datetime lastHeartbeat = 0;
bool lastHadOrders = false; // Para detectar mudanças de estado
int lastOrderCount = -1;    // Para detectar mudanças na quantidade de ordens

// SISTEMA INTELIGENTE ANTI-SPAM
bool idleLogAlreadyShown = false;
bool activeLogAlreadyShown = false;
bool connectionEstablished = false;
int consecutiveSuccessfulSends = 0;
int consecutiveFailures = 0;

// VARIÁVEL GLOBAL PARA VPS ID
string g_VpsId = "";

//+------------------------------------------------------------------+
// SISTEMA DE LOGGING INTELIGENTE - VERSÃO 2.14
//+------------------------------------------------------------------+
void LogPrint(LogLevel level, string category, string message)
{
   if(LoggingLevel == LOG_NONE) return;
   if(level > LoggingLevel) return;
   
   string prefix = "";
   switch(level) {
      case LOG_ERRORS_ONLY: prefix = "🚨 "; break;
      case LOG_ESSENTIAL:   prefix = "📌 "; break;
      case LOG_CRITICAL:    prefix = "🚨 "; break;
      case LOG_ALL:         prefix = "💬 "; break;
   }
   
   Print(prefix + "[" + category + "] " + message);
}

void LogSeparator(string category)
{
   if(LoggingLevel <= LOG_ERRORS_ONLY) return;
   Print("═══════════════════════════════════════════════════════════");
   Print("                    " + category);
   Print("═══════════════════════════════════════════════════════════");
}

void LogSubSeparator(string subcategory)
{
   if(LoggingLevel <= LOG_ERRORS_ONLY) return;
   Print("─────────────── " + subcategory + " ───────────────");
}

// FUNÇÕES INTELIGENTES PARA LOGS ESPECÍFICOS
void LogConnectionSmart(bool success, int responseCode, string operation)
{
   if(success && responseCode == 200)
   {
      consecutiveSuccessfulSends++;
      consecutiveFailures = 0;
      
      if(!connectionEstablished)
      {
         LogPrint(LOG_ERRORS_ONLY, "INIT", "Conexão status: Envio e recebimento OK");
         LogPrint(LOG_ERRORS_ONLY, "SYSTEM", "✅ A partir de agora apenas erros críticos e comandos remotos serão exibidos");
         connectionEstablished = true;
         lastConnectionLog = TimeCurrent();
      }
      else if(LoggingLevel >= LOG_ALL)
      {
         LogPrint(LOG_ALL, "HTTP", "Código de resposta: " + IntegerToString(responseCode));
      }
   }
   else
   {
      consecutiveFailures++;
      consecutiveSuccessfulSends = 0;
      LogPrint(LOG_ERRORS_ONLY, "ERROR", "❌ " + operation + " FALHOU - Código: " + IntegerToString(responseCode));
      
      if(consecutiveFailures >= 3)
      {
         LogPrint(LOG_ERRORS_ONLY, "ERROR", "❌ " + IntegerToString(consecutiveFailures) + " falhas consecutivas - verificar conexão");
      }
   }
   
   // Heartbeat a cada 10 minutos se tudo OK
   if(connectionEstablished && TimeCurrent() - lastHeartbeat >= 600 && consecutiveSuccessfulSends >= 200)
   {
      LogPrint(LOG_ERRORS_ONLY, "HEARTBEAT", "💓 Sistema ativo - " + IntegerToString(consecutiveSuccessfulSends) + " envios consecutivos OK");
      lastHeartbeat = TimeCurrent();
   }
}

void LogRemoteCloseCommand(string commandId, int totalOrders)
{
   LogPrint(LOG_ERRORS_ONLY, "COMMAND", "🎯 Fechamento remoto detectado");
   LogPrint(LOG_ERRORS_ONLY, "COMMAND", "Fechando " + IntegerToString(totalOrders) + " ordens");
   if(commandId != "")
      LogPrint(LOG_ERRORS_ONLY, "COMMAND", "ID do comando: " + commandId);
}

void LogRemoteCloseResult(int closed, int failed, int total)
{
   if(failed == 0)
   {
      LogPrint(LOG_ERRORS_ONLY, "SUCCESS", "✅ Fechamento concluído com " + IntegerToString(closed) + "/" + IntegerToString(total) + " ordens - TODAS FECHADAS!");
   }
   else if(closed > 0)
   {
      LogPrint(LOG_ERRORS_ONLY, "PARTIAL", "⚠️ Fechamento parcialmente concluído com " + IntegerToString(closed) + "/" + IntegerToString(total) + " ordens");
   }
   else
   {
      LogPrint(LOG_ERRORS_ONLY, "ERROR", "❌ Fechamento falhou - 0/" + IntegerToString(total) + " ordens fechadas");
   }
}

//+------------------------------------------------------------------+
int OnInit()
{
   LogSeparator("EA INICIALIZAÇÃO");
   LogPrint(LOG_ERRORS_ONLY, "INIT", "EA TRADING DATA SENDER INICIADO");
    LogPrint(LOG_ERRORS_ONLY, "INIT", "Versão: 2.16 - Sistema Inteligente MQL4 + VPS ID + Envio Dinâmico");
    LogPrint(LOG_ALL, "CONFIG", "URL do servidor: " + ServerURL);
    LogPrint(LOG_ALL, "CONFIG", "Email do usuário: " + UserEmail);
    LogPrint(LOG_ALL, "CONFIG", "Intervalo com ordens: " + IntegerToString(SendIntervalWithOrders) + "s");
    LogPrint(LOG_ALL, "CONFIG", "Intervalo sem ordens: " + IntegerToString(SendIntervalNoOrders) + "s");
    LogPrint(LOG_ALL, "CONFIG", "Heartbeat: " + IntegerToString(HeartbeatInterval) + "s");
    LogPrint(LOG_ALL, "CONFIG", "Modo selecionado: " + (UseTimer ? "TIMER (sem ticks)" : "TICK (com ticks)"));
    LogPrint(LOG_ALL, "CONFIG", "Polling de comandos: " + (EnableCommandPolling ? "HABILITADO" : "DESABILITADO"));
    LogPrint(LOG_ALL, "CONFIG", "Intervalo ativo: " + IntegerToString(CommandCheckIntervalSeconds) + "s | Intervalo idle: " + IntegerToString(IdleCommandCheckIntervalSeconds) + "s");
    LogPrint(LOG_ALL, "CONFIG", "Nível de log: " + EnumToString(LoggingLevel));
   
   // INICIALIZAR VPS ID
   if(EnableVpsIdentification)
   {
      LogSubSeparator("IDENTIFICAÇÃO VPS");
      g_VpsId = GetVpsUniqueId(); // Obter e salvar VPS ID globalmente
      LogPrint(LOG_ERRORS_ONLY, "VPS", "VPS ID ativo: " + g_VpsId);
   }
   
    if(UseTimer)
    {
       // SISTEMA DINÂMICO 2.16: Iniciar com intervalo para contas sem ordens
       bool hasOrders = HasOpenOrdersOrPendingOrders();
       int initialInterval = hasOrders ? SendIntervalWithOrders : SendIntervalNoOrders;
       EventSetTimer(initialInterval);
       LogPrint(LOG_ERRORS_ONLY, "TIMER", "Timer dinâmico configurado - Inicial: " + IntegerToString(initialInterval) + "s");
       LogPrint(LOG_ALL, "TIMER", "EA funcionará mesmo com mercado FECHADO");
    }
   else
   {
      LogPrint(LOG_ALL, "TIMER", "EA funcionará apenas com mercado ABERTO (ticks)");
   }
   
   // Enviar dados imediatamente na inicialização
   LogPrint(LOG_ALL, "INIT", "Enviando dados iniciais...");
   SendTradingDataIntelligent();
   
   return(INIT_SUCCEEDED);
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
   // SISTEMA DINÂMICO 2.16: OnTick com intervalos baseados em ordens
   if(!UseTimer)
   {
      bool hasOrders = HasOpenOrdersOrPendingOrders();
      int currentInterval = hasOrders ? SendIntervalWithOrders : SendIntervalNoOrders;
      
      if(TimeCurrent() - lastSendTime >= currentInterval)
      {
         LogPrint(LOG_ALL, "TICK", "OnTick executado - enviando dados...");
         SendTradingDataIntelligent();
         lastSendTime = TimeCurrent();
      }
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
// FUNÇÃO INTELIGENTE CORRIGIDA: Envio de dados com verificação prévia
//+------------------------------------------------------------------+
void SendTradingDataIntelligent()
{
   int currentOrderCount = OrdersTotal();
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
            LogPrint(LOG_ESSENTIAL, "IDLE", "Conta " + IntegerToString(AccountNumber()) + " sem ordens abertas");
            LogPrint(LOG_ESSENTIAL, "IDLE", "Balance: $" + DoubleToString(AccountBalance(), 2) + " | Equity: $" + DoubleToString(AccountEquity(), 2));
            LogPrint(LOG_ALL, "IDLE", "Logs reduzidos ativados - dados continuam sendo enviados");
            idleLogAlreadyShown = true;
            activeLogAlreadyShown = false; // Reset flag do modo ativo
         }
         else
         {
            // Log periódico (a cada 5 minutos)
            LogPrint(LOG_ESSENTIAL, "IDLE", "Status idle - Balance: $" + DoubleToString(AccountBalance(), 2) + " | Equity: $" + DoubleToString(AccountEquity(), 2));
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
   jsonData += "\"userEmail\":\"" + UserEmail + "\",";
   jsonData += "\"status\":\"IDLE\"";
   
   // ADICIONAR VPS ID SE DISPONÍVEL
   if(EnableVpsIdentification && g_VpsId != "")
   {
      jsonData += ",\"vpsId\":\"" + g_VpsId + "\"";
   }
   
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
   
   // LOG INTELIGENTE DE CONEXÃO
   LogConnectionSmart(res == 200, res, "Envio para Supabase");
   
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
      LogPrint(LOG_ERRORS_ONLY, "ERROR", "URL não permitida no WebRequest!");
      LogPrint(LOG_ERRORS_ONLY, "SOLUTION", "Adicione esta URL nas configurações:");
      LogPrint(LOG_ERRORS_ONLY, "SOLUTION", "Ferramentas → Opções → Expert Advisors → WebRequest");
      LogPrint(LOG_ERRORS_ONLY, "SOLUTION", "URL: https://kgrlcsimdszbrkcwjpke.supabase.co");
   }
   else if(res == 0)
   {
      LogPrint(LOG_ERRORS_ONLY, "ERROR", "Timeout ou sem conexão");
   }
   else
   {
      LogPrint(LOG_ERRORS_ONLY, "ERROR", "Erro HTTP: " + IntegerToString(res));
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
   
   // LOG INTELIGENTE DA CONTA
   if(!connectionEstablished || LoggingLevel >= LOG_ESSENTIAL)
   {
      LogPrint(LOG_ESSENTIAL, "ACCOUNT", "Conta: " + IntegerToString(AccountNumber()) + " | Balance: $" + DoubleToString(AccountBalance(), 2));
   }
   
   // Margin Info
   json += "\"margin\":{";
   json += "\"used\":" + DoubleToString(AccountMargin(), 2) + ",";
   json += "\"free\":" + DoubleToString(AccountFreeMargin(), 2) + ",";
   json += "\"level\":" + DoubleToString(AccountMargin() == 0 ? 0 : (AccountEquity()/AccountMargin()*100), 2);
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
         json += "\"openTime\":\"" + TimeToStr(OrderOpenTime()) + "\"";
         json += "}";
         posCount++;
      }
   }
   json += "],";
   
   // LOG INTELIGENTE DAS POSIÇÕES
   if(!connectionEstablished || LoggingLevel >= LOG_ESSENTIAL)
   {
      LogPrint(LOG_ESSENTIAL, "POSITIONS", "Posições abertas: " + IntegerToString(posCount));
   }
   
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
         json += "\"openTime\":\"" + TimeToStr(OrderOpenTime()) + "\",";
         json += "\"closeTime\":\"" + TimeToStr(OrderCloseTime()) + "\"";
         json += "}";
         histCount++;
      }
   }
   json += "],";
   
   // ADICIONAR EMAIL DO USUÁRIO
   json += "\"userEmail\":\"" + UserEmail + "\"";
   
   // ADICIONAR VPS ID SE DISPONÍVEL
   if(EnableVpsIdentification && g_VpsId != "")
   {
      json += ",\"vpsId\":\"" + g_VpsId + "\"";
   }
   
   json += "}";
   
   LogPrint(LOG_ALL, "HISTORY", "Histórico de trades: " + IntegerToString(histCount));
   LogPrint(LOG_ALL, "JSON", "JSON construído com sucesso");
   
   return json;
}

//+------------------------------------------------------------------+
void OnTimer()
{
   // SISTEMA DINÂMICO 2.16: Timer com reconfiguração automática
   if(UseTimer)
   {
      bool hasOrders = HasOpenOrdersOrPendingOrders();
      bool stateChanged = (lastHadOrders != hasOrders);
      
      // SISTEMA DE HEARTBEAT INDEPENDENTE - Versão 2.16
      if(TimeCurrent() - lastHeartbeat >= HeartbeatInterval)
      {
         LogPrint(LOG_ERRORS_ONLY, "HEARTBEAT", "💓 Heartbeat - Mantendo conexão ativa");
         SendTradingDataIntelligent();
         lastHeartbeat = TimeCurrent();
         lastSendTime = TimeCurrent();
      }
      
      // RECONFIGURAÇÃO DINÂMICA DO TIMER
      if(stateChanged)
      {
         EventKillTimer();
         int newInterval = hasOrders ? SendIntervalWithOrders : SendIntervalNoOrders;
         EventSetTimer(newInterval);
         
         LogPrint(LOG_ERRORS_ONLY, "TIMER", "🔄 Timer reconfigurado: " + 
                  (hasOrders ? "MODO ATIVO" : "MODO IDLE") + 
                  " - " + IntegerToString(newInterval) + "s");
         
         // Enviar dados imediatamente na mudança de estado
         SendTradingDataIntelligent();
         lastSendTime = TimeCurrent();
      }
      else
      {
         // Log reduzido do timer
         if(!idleLogAlreadyShown || hasOrders || LoggingLevel >= LOG_ALL)
         {
            LogSeparator("EXECUÇÃO TIMER");
            LogPrint(LOG_ESSENTIAL, "TIMER", "Timer executado - " + TimeToStr(TimeCurrent()));
         }
         
         SendTradingDataIntelligent();
         lastSendTime = TimeCurrent();
      }
      
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
               int remaining = intervalToUse - (TimeCurrent() - lastCommandCheck);
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
   
   // LOG INTELIGENTE DE CONEXÃO
   LogConnectionSmart(res == 200, res, "Verificação de comandos");
   
   if(res == 200)
   {
      string response = CharArrayToString(result);
      LogPrint(LOG_ALL, "RESPONSE", "Resposta completa: " + response);
      
      // Verificar se existe o campo "commands" na resposta
      if(StringFind(response, "\"commands\"") >= 0)
      {
         LogPrint(LOG_ALL, "PARSE", "Campo 'commands' encontrado");
         
         // Verificar se existem comandos
         if(StringFind(response, "\"commands\":[]") >= 0)
         {
            LogPrint(LOG_ALL, "COMMANDS", "Nenhum comando pendente");
         }
         else
         {
            LogPrint(LOG_ERRORS_ONLY, "COMMANDS", "Comandos encontrados! Processando...");
            
            // Verificar especificamente por CLOSE_ALL
            if(StringFind(response, "CLOSE_ALL") >= 0)
            {
               LogPrint(LOG_ERRORS_ONLY, "COMMAND", "COMANDO CLOSE_ALL ENCONTRADO!");
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
         LogPrint(LOG_ERRORS_ONLY, "ERROR", "Campo 'commands' não encontrado na resposta");
      }
   }
   else if(res == -1)
   {
      LogPrint(LOG_ERRORS_ONLY, "ERROR", "URL não permitida no WebRequest!");
      LogPrint(LOG_ERRORS_ONLY, "SOLUTION", "Adicione estas URLs nas configurações:");
      LogPrint(LOG_ERRORS_ONLY, "SOLUTION", "Ferramentas → Opções → Expert Advisors → WebRequest");
      LogPrint(LOG_ERRORS_ONLY, "SOLUTION", "URLs: https://kgrlcsimdszbrkcwjpke.supabase.co e *.supabase.co");
   }
   else if(res == 0)
   {
      LogPrint(LOG_ERRORS_ONLY, "ERROR", "Timeout ou sem conexão");
   }
   else
   {
      LogPrint(LOG_ERRORS_ONLY, "ERROR", "Erro HTTP: " + IntegerToString(res));
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
   // Extrair ID do comando (parsing simples)
   string commandId = ExtractCommandId(jsonResponse);
   
   int totalOrders = OrdersTotal();
   
   // ✅ LOG REMOTO DETECTADO (sempre visível)
   LogRemoteCloseCommand(commandId, totalOrders);
   
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
               LogPrint(LOG_ERRORS_ONLY, "ERROR", "Falha ao fechar posição: " + IntegerToString(OrderTicket()));
               LogPrint(LOG_ERRORS_ONLY, "ERROR", "Código: " + IntegerToString(error));
            }
         }
         else
         {
            LogPrint(LOG_ALL, "SKIP", "Pulando ordem (não é BUY/SELL): tipo " + IntegerToString(OrderType()));
         }
      }
      else
      {
         LogPrint(LOG_ERRORS_ONLY, "ERROR", "Erro ao selecionar ordem no índice: " + IntegerToString(i));
         failedCount++;
      }
   }
   
   // ✅ LOG RESULTADO DO FECHAMENTO (sempre visível)
   LogRemoteCloseResult(closedCount, failedCount, totalOrders);
   
   // Atualizar status do comando
   if(commandId != "")
   {
      if(failedCount == 0)
      {
         UpdateCommandStatus(commandId, "EXECUTED", "Todas as " + IntegerToString(closedCount) + " posições foram fechadas com sucesso");
      }
      else if(closedCount > 0)
      {
         UpdateCommandStatus(commandId, "PARTIAL", IntegerToString(closedCount) + " posições fechadas, " + IntegerToString(failedCount) + " falharam");
      }
      else
      {
         UpdateCommandStatus(commandId, "FAILED", "Nenhuma posição foi fechada. Total de falhas: " + IntegerToString(failedCount));
      }
   }
   else
   {
      LogPrint(LOG_ERRORS_ONLY, "ERROR", "ID do comando não encontrado - status não será atualizado");
   }
}

//+------------------------------------------------------------------+
// Extrair ID do comando do JSON
//+------------------------------------------------------------------+
string ExtractCommandId(string jsonResponse)
{
   int start = StringFind(jsonResponse, "\"id\":\"") + 6;
   if(start < 6) return("");
   
   int end = StringFind(jsonResponse, "\"", start);
   if(end <= start) return("");
   
   return(StringSubstr(jsonResponse, start, end - start));
}

//+------------------------------------------------------------------+
// Atualizar status do comando
//+------------------------------------------------------------------+
void UpdateCommandStatus(string commandId, string status, string message)
{
   LogPrint(LOG_ALL, "UPDATE", "Atualizando status do comando: " + commandId);
   LogPrint(LOG_ALL, "UPDATE", "Status: " + status + " | Mensagem: " + message);
   
   string jsonData = "{";
   jsonData += "\"commandId\":\"" + commandId + "\",";
   jsonData += "\"status\":\"" + status + "\",";
   jsonData += "\"message\":\"" + message + "\",";
   jsonData += "\"executedAt\":\"" + TimeToStr(TimeCurrent()) + "\"";
   jsonData += "}";
   
   string url = "https://kgrlcsimdszbrkcwjpke.supabase.co/functions/v1/update-command-status";
   string headers = "Content-Type: application/json\r\n";
   
   char post[];
   char result[];
   string resultHeaders;
   
   StringToCharArray(jsonData, post, 0, WHOLE_ARRAY);
   ArrayResize(post, ArraySize(post) - 1);
   
   int res = WebRequest("POST", url, headers, 5000, post, result, resultHeaders);
   
   if(res == 200)
   {
      LogPrint(LOG_ESSENTIAL, "SUCCESS", "Status do comando atualizado com sucesso");
   }
   else
   {
      LogPrint(LOG_ERRORS_ONLY, "ERROR", "Falha ao atualizar status do comando: " + IntegerToString(res));
   }
}