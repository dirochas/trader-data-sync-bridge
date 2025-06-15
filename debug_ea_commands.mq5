//+------------------------------------------------------------------+
//|                                           TradingDataSender.mq5 |
//|                            EA para envio de dados de trading    |
//+------------------------------------------------------------------+
#property version   "2.12"

#include "Includes/Logger.mqh"
#include "Includes/AccountUtils.mqh"
#include "Includes/HttpClient.mqh"
#include "Includes/CommandProcessor.mqh"

input string ServerURL = "https://kgrlcsimdszbrkcwjpke.supabase.co/functions/v1/trading-data";
input int SendIntervalSeconds = 3; // Intervalo de envio (segundos)
input bool UseTimer = true; // true = OnTimer (sem ticks), false = OnTick (com ticks)

// NOVAS VARIÁVEIS PARA POLLING DE COMANDOS
input bool EnableCommandPolling = true; // Habilitar polling de comandos
input int CommandCheckIntervalSeconds = 1; // Intervalo para verificar comandos (segundos)
input int IdleCommandCheckIntervalSeconds = 30; // Intervalo quando não há ordens (segundos)

// DEFINIÇÃO DO NÍVEL DE LOGGING
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
int OnInit()
{
   // Configurar nível de logging no sistema
   SetLoggingLevel(LoggingLevel);
   
   LogSeparator("EA INICIALIZAÇÃO");
   LogPrint(LOG_ESSENTIAL, "INIT", "EA TRADING DATA SENDER INICIADO");
   LogPrint(LOG_ESSENTIAL, "INIT", "Versão: 2.12 - Sistema Inteligente MQL5");
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
      
      string jsonData = BuildJsonData();
      
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
      SendToSupabase(jsonData, ServerURL);
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
   
   string jsonData = BuildIdleJsonData();
   SendToSupabase(jsonData, ServerURL);
}

//+------------------------------------------------------------------+
void OnTimer()
{
   // Só funciona se UseTimer = true
   if(UseTimer)
   {
      bool hasOrders = HasOpenOrdersOrPendingOrders();
      
      // LOG INTELIGENTE DO TIMER
      LogTimerSmart("Timer executado - " + TimeToString(TimeCurrent()));
      
      SendTradingDataIntelligent();
      lastSendTime = TimeCurrent();
      
      // NOVA FUNCIONALIDADE INTELIGENTE: Verificar comandos com intervalos dinâmicos
      if(EnableCommandPolling)
      {
         int intervalToUse = hasOrders ? CommandCheckIntervalSeconds : IdleCommandCheckIntervalSeconds;
         
         if(TimeCurrent() - lastCommandCheck >= intervalToUse)
         {
            // LOG INTELIGENTE DE COMANDOS
            LogCommandSmart("Verificando comandos - Modo: " + (hasOrders ? "ATIVO" : "IDLE") + " | Intervalo: " + IntegerToString(intervalToUse) + "s");
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

