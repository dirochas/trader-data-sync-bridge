
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

// DEFINIÇÃO DO NÍVEL DE LOGGING (não extern, mas input)
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
   LogSeparator(LoggingLevel, "EA INICIALIZAÇÃO");
   LogPrint(LoggingLevel, LOG_ESSENTIAL, "INIT", "EA TRADING DATA SENDER INICIADO");
   LogPrint(LoggingLevel, LOG_ESSENTIAL, "INIT", "Versão: 2.12 - Sistema Inteligente MQL5");
   LogPrint(LoggingLevel, LOG_ALL, "CONFIG", "URL do servidor: " + ServerURL);
   LogPrint(LoggingLevel, LOG_ALL, "CONFIG", "Intervalo de envio: " + IntegerToString(SendIntervalSeconds) + " segundos");
   LogPrint(LoggingLevel, LOG_ALL, "CONFIG", "Modo selecionado: " + (UseTimer ? "TIMER (sem ticks)" : "TICK (com ticks)"));
   LogPrint(LoggingLevel, LOG_ALL, "CONFIG", "Polling de comandos: " + (EnableCommandPolling ? "HABILITADO" : "DESABILITADO"));
   LogPrint(LoggingLevel, LOG_ALL, "CONFIG", "Intervalo ativo: " + IntegerToString(CommandCheckIntervalSeconds) + "s | Intervalo idle: " + IntegerToString(IdleCommandCheckIntervalSeconds) + "s");
   LogPrint(LoggingLevel, LOG_ALL, "CONFIG", "Nível de log: " + EnumToString(LoggingLevel));
   
   if(UseTimer)
   {
      EventSetTimer(SendIntervalSeconds);
      LogPrint(LoggingLevel, LOG_ESSENTIAL, "TIMER", "Timer configurado para " + IntegerToString(SendIntervalSeconds) + " segundos");
      LogPrint(LoggingLevel, LOG_ALL, "TIMER", "EA funcionará mesmo com mercado FECHADO");
   }
   else
   {
      LogPrint(LoggingLevel, LOG_ALL, "TIMER", "EA funcionará apenas com mercado ABERTO (ticks)");
   }
   
   // Enviar dados imediatamente na inicialização
   LogPrint(LoggingLevel, LOG_ESSENTIAL, "INIT", "Enviando dados iniciais...");
   SendTradingDataIntelligent();
   
   return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   LogSeparator(LoggingLevel, "EA FINALIZAÇÃO");
   if(UseTimer)
   {
      EventKillTimer();
      LogPrint(LoggingLevel, LOG_ESSENTIAL, "TIMER", "Timer finalizado");
   }
   LogPrint(LoggingLevel, LOG_ESSENTIAL, "DEINIT", "EA FINALIZADO - Motivo: " + IntegerToString(reason));
}

//+------------------------------------------------------------------+
void OnTick()
{
   // Só funciona se UseTimer = false
   if(!UseTimer && TimeCurrent() - lastSendTime >= SendIntervalSeconds)
   {
      LogPrint(LoggingLevel, LOG_ALL, "TICK", "OnTick executado - enviando dados...");
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
            LogSubSeparator(LoggingLevel, "MODO IDLE ATIVADO");
            LogPrint(LoggingLevel, LOG_ESSENTIAL, "IDLE", "Conta " + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) + " sem ordens abertas");
            LogPrint(LoggingLevel, LOG_ESSENTIAL, "IDLE", "Balance: $" + DoubleToString(AccountInfoDouble(ACCOUNT_BALANCE), 2) + " | Equity: $" + DoubleToString(AccountInfoDouble(ACCOUNT_EQUITY), 2));
            LogPrint(LoggingLevel, LOG_ALL, "IDLE", "Logs reduzidos ativados - dados continuam sendo enviados");
            idleLogAlreadyShown = true;
            activeLogAlreadyShown = false; // Reset flag do modo ativo
         }
         else
         {
            // Log periódico (a cada 5 minutos)
            LogPrint(LoggingLevel, LOG_ESSENTIAL, "IDLE", "Status idle - Balance: $" + DoubleToString(AccountInfoDouble(ACCOUNT_BALANCE), 2) + " | Equity: $" + DoubleToString(AccountInfoDouble(ACCOUNT_EQUITY), 2));
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
         LogSubSeparator(LoggingLevel, "MODO ATIVO REATIVADO");
         LogPrint(LoggingLevel, LOG_ESSENTIAL, "ACTIVE", "Detectadas " + IntegerToString(currentOrderCount) + " ordens - logs completos reativados");
         activeLogAlreadyShown = true;
         idleLogAlreadyShown = false; // Reset flag do modo idle
      }
      
      // Logs detalhados apenas se mudou de estado ou se está em nível ALL
      if(stateChanged || LoggingLevel >= LOG_ALL)
      {
         LogSubSeparator(LoggingLevel, "COLETA DE DADOS COMPLETA");
         LogPrint(LoggingLevel, LOG_ALL, "DATA", "Iniciando coleta completa de dados");
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
            LogPrint(LoggingLevel, LOG_ALL, "DEBUG", "Dados salvos em arquivo: trading_data.json");
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
   if(!idleLogAlreadyShown || LoggingLevel >= LOG_ALL)
   {
      LogPrint(LoggingLevel, LOG_ALL, "IDLE", "Enviando status idle para servidor (mantendo conexão)...");
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
      // Log reduzido do timer
      bool hasOrders = HasOpenOrdersOrPendingOrders();
      
      // Log do timer apenas se mudou de estado ou se está em modo ativo com ordens
      if(!idleLogAlreadyShown || hasOrders || LoggingLevel >= LOG_ALL)
      {
         LogSeparator(LoggingLevel, "EXECUÇÃO TIMER");
         LogPrint(LoggingLevel, LOG_ESSENTIAL, "TIMER", "Timer executado - " + TimeToString(TimeCurrent()));
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
               LogPrint(LoggingLevel, hasOrders ? LOG_ALL : LOG_ALL, "POLLING", "Iniciando verificação de comandos...");
               LogPrint(LoggingLevel, LOG_ALL, "POLLING", "Modo: " + (hasOrders ? "ATIVO" : "IDLE") + " | Intervalo: " + IntegerToString(intervalToUse) + "s");
            }
            CheckPendingCommands();
            lastCommandCheck = TimeCurrent();
         }
         else
         {
            if(LoggingLevel >= LOG_ALL)
            {
               int remaining = intervalToUse - (int)(TimeCurrent() - lastCommandCheck);
               LogPrint(LoggingLevel, LOG_ALL, "POLLING", "Próxima verificação em: " + IntegerToString(remaining) + "s (" + (hasOrders ? "modo ativo" : "modo idle") + ")");
            }
         }
      }
   }
}
