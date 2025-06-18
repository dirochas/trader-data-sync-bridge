//+------------------------------------------------------------------+
//|                                           TradingDataSender.mq5 |
//|                            EA para envio de dados de trading    |
//+------------------------------------------------------------------+
#property version   "2.14"

#include "Includes/Logger.mqh"
#include "Includes/AccountUtils.mqh"
#include "Includes/HttpClient.mqh" 
#include "Includes/CommandProcessor.mqh"

input string ServerURL = "https://kgrlcsimdszbrkcwjpke.supabase.co/functions/v1/trading-data";
input int SendIntervalSeconds = 3; // Intervalo de envio (segundos)
input bool UseTimer = true; // true = OnTimer (sem ticks), false = OnTick (com ticks)

// VARIÁVEL PARA IDENTIFICAÇÃO DO USUÁRIO
input string UserEmail = "usuario@exemplo.com"; // Email do usuário para vinculação da conta

// VARIÁVEIS PARA POLLING DE COMANDOS
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

// FLAG INTELIGENTE PARA CONTROLAR LOGS REPETITIVOS
bool idleLogAlreadyShown = false;
bool activeLogAlreadyShown = false;

//+------------------------------------------------------------------+
int OnInit()
{
   // Configurar nível de logging no sistema
   SetLoggingLevel(LoggingLevel);
   
   LogSeparator("EA INICIALIZAÇÃO");
   LogPrint(LOG_ESSENTIAL, "INIT", "EA TRADING DATA SENDER INICIADO");
   LogPrint(LOG_ESSENTIAL, "INIT", "Versão: 2.14 - Sistema Inteligente MQL5");
   LogPrint(LOG_ALL, "CONFIG", "URL do servidor: " + ServerURL);
   LogPrint(LOG_ALL, "CONFIG", "Email do usuário: " + UserEmail);
   LogPrint(LOG_ALL, "CONFIG", "Intervalo de envio: " + IntegerToString(SendIntervalSeconds) + " segundos");
   LogPrint(LOG_ALL, "CONFIG", "Modo selecionado: " + (UseTimer ? "TIMER (sem ticks)" : "TICK (com ticks)"));
   LogPrint(LOG_ALL, "CONFIG", "Polling de comandos: " + (EnableCommandPolling ? "HABILITADO" : "DESABILITADO"));
   LogPrint(LOG_ALL, "CONFIG", "Intervalo ativo: " + IntegerToString(CommandCheckIntervalSeconds) + "s | Intervalo idle: " + IntegerToString(IdleCommandCheckIntervalSeconds) + "s");
   LogPrint(LOG_ALL, "CONFIG", "Nível de log: " + EnumToString(LoggingLevel));
   
   // TESTE DE COLETA DE DADOS DA MÁQUINA (para identificação única)
   TestMachineDataCollection();
   
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
// FUNÇÃO PARA GERAR IDENTIFICADOR ÚNICO DE VPS
//+------------------------------------------------------------------+
string GenerateVPSIdentifier()
{
   // Combinar dados únicos da máquina para gerar identificador consistente
   string components = "";
   
   // 1. Terminal Company + Name
   components += TerminalInfoString(TERMINAL_COMPANY);
   components += "_";
   components += TerminalInfoString(TERMINAL_NAME);
   components += "_";
   
   // 2. Hardware único (CPU + Memória Física)
   components += IntegerToString(TerminalInfoInteger(TERMINAL_CPU_CORES));
   components += "_";
   components += IntegerToString(TerminalInfoInteger(TERMINAL_MEMORY_PHYSICAL));
   components += "_";
   
   // 3. Path do terminal (sem o hash final que varia por instalação)
   string dataPath = TerminalInfoString(TERMINAL_DATA_PATH);
   // Pegar só o username da path (mais estável)
   string username = ExtractUsernameFromPath(dataPath);
   components += username;
   
   // 4. Account Server (servidor da conta)
   components += "_";
   components += AccountInfoString(ACCOUNT_SERVER);
   
   // Gerar hash simplificado dos componentes
   string vpsId = "VPS-" + GenerateSimpleHash(components);
   
   LogPrint(LOG_ALL, "VPS", "Identificador gerado: " + vpsId);
   LogPrint(LOG_ALL, "VPS", "Componentes: " + components);
   
   return vpsId;
}

//+------------------------------------------------------------------+
// FUNÇÃO AUXILIAR PARA EXTRAIR USERNAME DA PATH
//+------------------------------------------------------------------+
string ExtractUsernameFromPath(string path)
{
   // Extrair nome do usuário de C:\Users\USERNAME\...
   string result = "";
   
   if(StringFind(path, "\\Users\\") >= 0)
   {
      int start = StringFind(path, "\\Users\\") + 7; // 7 = len("\\Users\\")
      int end = StringFind(path, "\\", start);
      
      if(end > start)
      {
         result = StringSubstr(path, start, end - start);
      }
   }
   
   return result != "" ? result : "unknown";
}

//+------------------------------------------------------------------+
// FUNÇÃO AUXILIAR PARA GERAR HASH SIMPLES
//+------------------------------------------------------------------+
string GenerateSimpleHash(string input)
{
   // Hash simples baseado em soma de caracteres
   int hash = 0;
   for(int i = 0; i < StringLen(input); i++)
   {
      hash += StringGetCharacter(input, i) * (i + 1);
   }
   
   // Converter para hex simplificado
   string result = "";
   int tempHash = MathAbs(hash);
   
   while(tempHash > 0)
   {
      int remainder = tempHash % 16;
      if(remainder < 10)
         result = IntegerToString(remainder) + result;
      else
         result = CharToString(55 + remainder) + result; // A=65, mas queremos A=10, então 65-10=55
      
      tempHash = tempHash / 16;
   }
   
   // Garantir pelo menos 8 caracteres
   while(StringLen(result) < 8)
   {
      result = "0" + result;
   }
   
   // Limitar a 8 caracteres
   if(StringLen(result) > 8)
   {
      result = StringSubstr(result, 0, 8);
   }
   
   return StringToLower(result);
}

//+------------------------------------------------------------------+
// FUNÇÃO PARA TESTAR COLETA DE DADOS DA MÁQUINA
//+------------------------------------------------------------------+
void TestMachineDataCollection()
{
   Print("========== TESTE DE COLETA DE DADOS DA MÁQUINA ==========");
   
   // Informações do Terminal
   Print("TERMINAL INFO:");
   Print("Terminal Name: ", TerminalInfoString(TERMINAL_NAME));
   Print("Terminal Company: ", TerminalInfoString(TERMINAL_COMPANY));
   Print("Terminal Path: ", TerminalInfoString(TERMINAL_PATH));
   Print("Terminal Data Path: ", TerminalInfoString(TERMINAL_DATA_PATH));
   Print("Terminal Common Data Path: ", TerminalInfoString(TERMINAL_COMMONDATA_PATH));
   Print("Terminal Language: ", TerminalInfoString(TERMINAL_LANGUAGE));
   Print("Terminal Build: ", IntegerToString(TerminalInfoInteger(TERMINAL_BUILD)));
   Print("Terminal CPU Cores: ", IntegerToString(TerminalInfoInteger(TERMINAL_CPU_CORES)));
   Print("Terminal Memory Physical: ", IntegerToString(TerminalInfoInteger(TERMINAL_MEMORY_PHYSICAL)), " MB");
   Print("Terminal Memory Total: ", IntegerToString(TerminalInfoInteger(TERMINAL_MEMORY_TOTAL)), " MB");
   Print("Terminal Memory Available: ", IntegerToString(TerminalInfoInteger(TERMINAL_MEMORY_AVAILABLE)), " MB");
   Print("Terminal Memory Used: ", IntegerToString(TerminalInfoInteger(TERMINAL_MEMORY_USED)), " MB");
   Print("Terminal Disk Space: ", IntegerToString(TerminalInfoInteger(TERMINAL_DISK_SPACE)), " MB");
   Print("Terminal Screen DPI: ", IntegerToString(TerminalInfoInteger(TERMINAL_SCREEN_DPI)));
   Print("Terminal Ping Last: ", IntegerToString(TerminalInfoInteger(TERMINAL_PING_LAST)), " microseconds");
   
   // Conta e Servidor
   Print("\nACCOUNT & SERVER INFO:");
   Print("Account Number: ", IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)));
   Print("Account Server: ", AccountInfoString(ACCOUNT_SERVER));
   Print("Account Company: ", AccountInfoString(ACCOUNT_COMPANY));
   Print("Account Name: ", AccountInfoString(ACCOUNT_NAME));
   Print("Account Currency: ", AccountInfoString(ACCOUNT_CURRENCY));
   
   // Símbolo atual
   Print("\nSYMBOL INFO:");
   Print("Current Symbol: ", Symbol());
   Print("Symbol Server: ", SymbolInfoString(Symbol(), SYMBOL_PATH));
   
   // Data e Hora
   Print("\nTIME INFO:");
   Print("Local Time: ", TimeToString(TimeLocal()));
   Print("Server Time: ", TimeToString(TimeCurrent()));
   Print("GMT Time: ", TimeToString(TimeGMT()));
   
   // TESTE DO IDENTIFICADOR DE VPS
   Print("========== TESTE DE IDENTIFICADOR DE VPS ==========");
   string vpsId = GenerateVPSIdentifier();
   Print("VPS Identifier Final: ", vpsId);
   Print("====================================================");
   
   Print("========== FIM DO TESTE DE COLETA DE DADOS ==========");
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
      
      string jsonData = BuildJsonDataWithVPS();
      
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
// CONSTRUIR JSON COM IDENTIFICADOR DE VPS
//+------------------------------------------------------------------+
string BuildJsonDataWithVPS()
{
   string vpsIdentifier = GenerateVPSIdentifier();
   
   string jsonData = BuildJsonData(); // Função original
   
   // Adicionar VPS identifier ao JSON
   // Encontrar a posição do campo "server" e adicionar VPS depois
   int serverPos = StringFind(jsonData, "\"server\":");
   if(serverPos >= 0)
   {
      int serverEnd = StringFind(jsonData, ",", serverPos);
      if(serverEnd > serverPos)
      {
         string beforeServer = StringSubstr(jsonData, 0, serverEnd);
         string afterServer = StringSubstr(jsonData, serverEnd);
         
         jsonData = beforeServer + ",\"vps_identifier\":\"" + vpsIdentifier + "\"" + afterServer;
      }
   }
   
   return jsonData;
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
   
   string jsonData = BuildIdleJsonDataWithVPS();
   SendToSupabase(jsonData, ServerURL);
}

//+------------------------------------------------------------------+
// CONSTRUIR JSON IDLE COM VPS
//+------------------------------------------------------------------+
string BuildIdleJsonDataWithVPS()
{
   string vpsIdentifier = GenerateVPSIdentifier();
   
   string jsonData = BuildIdleJsonData(); // Função original
   
   // Adicionar VPS identifier ao JSON idle
   int serverPos = StringFind(jsonData, "\"server\":");
   if(serverPos >= 0)
   {
      int serverEnd = StringFind(jsonData, ",", serverPos);
      if(serverEnd > serverPos)
      {
         string beforeServer = StringSubstr(jsonData, 0, serverEnd);
         string afterServer = StringSubstr(jsonData, serverEnd);
         
         jsonData = beforeServer + ",\"vps_identifier\":\"" + vpsIdentifier + "\"" + afterServer;
      }
   }
   
   return jsonData;
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
