
//+------------------------------------------------------------------+
//|                                           TradingDataSender.mq5 |
//|                            EA para envio de dados de trading    |
//+------------------------------------------------------------------+
#property copyright "MrBot © 2025"
#property version   "2.15"

#include "Includes/Logger.mqh"
#include "Includes/AccountUtils.mqh"
#include "Includes/HttpClient.mqh" 
#include "Includes/CommandProcessor.mqh"
#include "Includes/VpsIdentifier_v2.14.mqh"  // BIBLIOTECA VPS

input string ServerURL_MT2 = "https://kgrlcsimdszbrkcwjpke.supabase.co";// Adicione esta URL em configurações → Permitir WebRequest
string ServerURL = "https://kgrlcsimdszbrkcwjpke.supabase.co/functions/v1/trading-data";

// VARIÁVEL PARA IDENTIFICAÇÃO DO USUÁRIO
input string UserEmail = "usuario@exemplo.com"; // Email do usuário para vinculação da conta

input bool UseTimer = true; // true = OnTimer (sem ticks), false = OnTick (com ticks)
input int SendIntervalSeconds = 3; // Intervalo de envio (segundos)

// VARIÁVEIS PARA POLLING DE COMANDOS
input bool EnableCommandPolling = true; // Habilitar polling de comandos
input int CommandCheckIntervalSeconds = 2; // Intervalo para verificar comandos (segundos)
input int IdleCommandCheckIntervalSeconds = 120; // Intervalo quando não há ordens (segundos)

// DEFINIÇÃO DO NÍVEL DE LOGGING
input LogLevel LoggingLevel = LOG_ERRORS_ONLY; // Nível de logging

// VARIÁVEL PARA VPS
bool EnableVpsIdentification = true; // Habilitar identificação de VPS

datetime lastSendTime = 0;
datetime lastCommandCheck = 0;
datetime lastIdleLog = 0;
bool lastHadOrders = false; // Para detectar mudanças de estado
int lastOrderCount = -1;    // Para detectar mudanças na quantidade de ordens

// FLAG INTELIGENTE PARA CONTROLAR LOGS REPETITIVOS
bool idleLogAlreadyShown = false;
bool activeLogAlreadyShown = false;

// VARIÁVEL GLOBAL PARA VPS ID
string g_VpsId = "";

//+------------------------------------------------------------------+
int OnInit()
{
   // Configurar nível de logging no sistema
   SetLoggingLevel(LoggingLevel);
   
   LogSeparator("EA INICIALIZAÇÃO");
   LogPrint(LOG_ESSENTIAL, "INIT", "EA TRADING DATA SENDER INICIADO");
   LogPrint(LOG_ESSENTIAL, "INIT", "Versão: 2.15 - Conector MQL5 com VPS ID");
   LogPrint(LOG_ALL, "CONFIG", "URL do servidor: " + ServerURL);
   LogPrint(LOG_ALL, "CONFIG", "Email do usuário: " + UserEmail);
   LogPrint(LOG_ALL, "CONFIG", "Intervalo de envio: " + IntegerToString(SendIntervalSeconds) + " segundos");
   LogPrint(LOG_ALL, "CONFIG", "Modo selecionado: " + (UseTimer ? "TIMER (sem ticks)" : "TICK (com ticks)"));
   LogPrint(LOG_ALL, "CONFIG", "Polling de comandos: " + (EnableCommandPolling ? "HABILITADO" : "DESABILITADO"));
   LogPrint(LOG_ALL, "CONFIG", "Intervalo ativo: " + IntegerToString(CommandCheckIntervalSeconds) + "s | Intervalo idle: " + IntegerToString(IdleCommandCheckIntervalSeconds) + "s");
   LogPrint(LOG_ALL, "CONFIG", "Nível de log: " + EnumToString(LoggingLevel));
   
   // INICIALIZAR VPS ID
   if(EnableVpsIdentification)
   {
      LogSubSeparator("IDENTIFICAÇÃO VPS");
      g_VpsId = GetVpsUniqueId(); // Obter e salvar VPS ID globalmente
      LogPrint(LOG_ESSENTIAL, "VPS", "VPS ID ativo: " + g_VpsId);
   }
   
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
// Envio de dados com verificação prévia
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
      if(stateChanged || g_LoggingLevel >= LOG_ALL)
      {
         LogSubSeparator("COLETA DE DADOS COMPLETA");
         LogPrint(LOG_ALL, "DATA", "Iniciando coleta completa de dados");
      }
      
      string jsonData = BuildJsonDataWithVps();
      
      // Debug - salvar em arquivo apenas quando necessário
      if(g_LoggingLevel >= LOG_ALL && (stateChanged || TimeCurrent() - lastSendTime >= 30))
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
      SendToSupabaseWithHeaders(jsonData, ServerURL);
   }
   
   // Atualizar estado anterior
   lastHadOrders = hasOrders;
   lastOrderCount = currentOrderCount;
}

//+------------------------------------------------------------------+
// Enviar status "idle" para o servidor (dados mínimos)
//+------------------------------------------------------------------+
void SendIdleStatusToSupabase()
{
   // Log apenas se não foi mostrado ainda ou se está em nível ALL
   if(!idleLogAlreadyShown || g_LoggingLevel >= LOG_ALL)
   {
      LogPrint(LOG_ALL, "IDLE", "Enviando status idle para servidor (mantendo conexão)...");
   }
   
   string jsonData = BuildIdleJsonDataWithVps();
   SendToSupabaseWithHeaders(jsonData, ServerURL);
}

//+------------------------------------------------------------------+
// Nova função para construir JSON Idle com VPS ID
//+------------------------------------------------------------------+
string BuildIdleJsonDataWithVps()
{
   string json = "{";
   json += "\"account\":{";
   json += "\"balance\":" + DoubleToString(AccountInfoDouble(ACCOUNT_BALANCE), 2) + ",";
   json += "\"equity\":" + DoubleToString(AccountInfoDouble(ACCOUNT_EQUITY), 2) + ",";
   json += "\"profit\":0.00,";
   json += "\"accountNumber\":\"" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) + "\",";
   json += "\"server\":\"" + AccountInfoString(ACCOUNT_SERVER) + "\",";
   json += "\"leverage\":" + IntegerToString(AccountInfoInteger(ACCOUNT_LEVERAGE));
   json += "},";
   json += "\"margin\":{\"used\":0.00,\"free\":" + DoubleToString(AccountInfoDouble(ACCOUNT_MARGIN_FREE), 2) + ",\"level\":0.00},";
   json += "\"positions\":[],";
   json += "\"history\":[],";
   json += "\"userEmail\":\"" + UserEmail + "\",";
   json += "\"status\":\"IDLE\"";
   
   // ADICIONAR VPS ID SE DISPONÍVEL
   if(EnableVpsIdentification && g_VpsId != "")
   {
      json += ",\"vpsId\":\"" + g_VpsId + "\"";
   }
   
   json += "}";
   
   return json;
}

//+------------------------------------------------------------------+
// Função modificada para incluir VPS ID
//+------------------------------------------------------------------+
string BuildJsonDataWithVps()
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
   
   // LOG INTELIGENTE DA CONTA
   if(g_LoggingLevel >= LOG_ESSENTIAL)
   {
      LogPrint(LOG_ESSENTIAL, "ACCOUNT", "Conta: " + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) + " | Balance: $" + DoubleToString(AccountInfoDouble(ACCOUNT_BALANCE), 2));
   }
   
   // Margin Info
   json += "\"margin\":{";
   json += "\"used\":" + DoubleToString(AccountInfoDouble(ACCOUNT_MARGIN), 2) + ",";
   json += "\"free\":" + DoubleToString(AccountInfoDouble(ACCOUNT_MARGIN_FREE), 2) + ",";
   json += "\"level\":" + DoubleToString(AccountInfoDouble(ACCOUNT_MARGIN) == 0 ? 0 : AccountInfoDouble(ACCOUNT_EQUITY)/AccountInfoDouble(ACCOUNT_MARGIN)*100, 2);
   json += "},";
   
   LogPrint(LOG_ALL, "MARGIN", "Usada: $" + DoubleToString(AccountInfoDouble(ACCOUNT_MARGIN), 2) + " | Livre: $" + DoubleToString(AccountInfoDouble(ACCOUNT_MARGIN_FREE), 2));
   
   // Open Positions - FIX: Correct function name and syntax
   json += "\"positions\":[";
   int posCount = 0;
   int totalPositions = PositionsTotal();
   for(int i = 0; i < totalPositions; i++)
   {
      if(PositionGetTicket(i) > 0)
      {
         if(posCount > 0) json += ",";
         json += "{";
         json += "\"ticket\":" + IntegerToString(PositionGetInteger(POSITION_TICKET)) + ",";
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
   
   // LOG INTELIGENTE DAS POSIÇÕES
   if(g_LoggingLevel >= LOG_ESSENTIAL)
   {
      LogPrint(LOG_ESSENTIAL, "POSITIONS", "Posições abertas: " + IntegerToString(posCount));
   }
   
   // Trade History (últimos 10)
   json += "\"history\":[";
   int histCount = 0;
   HistorySelect(0, TimeCurrent());
   for(int i = HistoryDealsTotal()-1; i >= 0 && histCount < 10; i--)
   {
      ulong ticket = HistoryDealGetTicket(i);
      if(ticket > 0 && HistoryDealGetInteger(ticket, DEAL_TYPE) <= 1)
      {
         if(histCount > 0) json += ",";
         json += "{";
         json += "\"ticket\":" + IntegerToString((long)ticket) + ",";
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
// Enviar dados para Supabase com headers
//+------------------------------------------------------------------+
void SendToSupabaseWithHeaders(string jsonData, string url)
{
   // Log apenas se não foi mostrado ainda ou se está em nível ALL
   bool isIdle = (StringFind(jsonData, "\"status\":\"IDLE\"") >= 0);
   if(!isIdle || g_LoggingLevel >= LOG_ALL)
   {
      LogPrint(LOG_ALL, "HTTP", "Enviando dados para: " + url);
      LogPrint(LOG_ALL, "HTTP", "Tamanho dos dados: " + IntegerToString(StringLen(jsonData)) + " bytes");
   }
   
   // Usar a função do HttpClient
   SendToSupabase(jsonData, url);
}

//+------------------------------------------------------------------+
void OnTimer()
{
   // Só funciona se UseTimer = true
   if(UseTimer)
   {
      bool hasOrders = HasOpenOrdersOrPendingOrders();
      
      // LOG INTELIGENTE DO TIMER - FIX: Remove parameter to match Logger.mqh signature
      string timerMessage = "Timer executado - " + TimeToString(TimeCurrent());
      LogTimerSmart(timerMessage);
      
      SendTradingDataIntelligent();
      lastSendTime = TimeCurrent();
      
      // NOVA FUNCIONALIDADE INTELIGENTE: Verificar comandos com intervalos dinâmicos
      if(EnableCommandPolling)
      {
         int intervalToUse = hasOrders ? CommandCheckIntervalSeconds : IdleCommandCheckIntervalSeconds;
         
         if(TimeCurrent() - lastCommandCheck >= intervalToUse)
         {
            // LOG INTELIGENTE DE COMANDOS - usando sobrecarga com bool para especificar importância
            string commandMessage = "Verificando comandos - Modo: " + (hasOrders ? "ATIVO" : "IDLE") + " | Intervalo: " + IntegerToString(intervalToUse) + "s";
            LogCommandSmart(commandMessage, false); // false = não é importante
            CheckPendingCommands();
            lastCommandCheck = TimeCurrent();
         }
         else
         {
            if(g_LoggingLevel >= LOG_ALL)
            {
               int remaining = intervalToUse - (int)(TimeCurrent() - lastCommandCheck);
               LogPrint(LOG_ALL, "POLLING", "Próxima verificação em: " + IntegerToString(remaining) + "s (" + (hasOrders ? "modo ativo" : "modo idle") + ")");
            }
         }
      }
      
      // Marcar primeira execução como completa após alguns ciclos
      MarkFirstRunCompleted();
   }
}