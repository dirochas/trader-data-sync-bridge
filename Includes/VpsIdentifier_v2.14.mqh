
//+------------------------------------------------------------------+
//|                                                VpsIdentifier.mqh |
//| Utilitários para identificação única de VPS usando arquivo      |
//| compartilhado - Versão 2.14 MQL5                               |
//+------------------------------------------------------------------+

#include "Logger.mqh" // v2.14 compatível

// Constantes para o sistema de arquivo compartilhado
#define VPS_REGISTRY_FILE "vps_registry.json"
#define VPS_ID_PREFIX "VPS_"

//+------------------------------------------------------------------+
// Gerar ID único baseado em características do sistema (MQL5)
//+------------------------------------------------------------------+
string GenerateVpsId()
{
   // Combinar informações que são únicas por máquina/VPS
   string systemInfo = "";
   
   // CPU e Memória (características físicas do VPS)
   systemInfo += TerminalInfoString(TERMINAL_CPU_ARCHITECTURE) + "|";
   systemInfo += IntegerToString(TerminalInfoInteger(TERMINAL_CPU_CORES)) + "|";
   systemInfo += IntegerToString(TerminalInfoInteger(TERMINAL_MEMORY_PHYSICAL)) + "|";
   
   // Informações do sistema operacional
   systemInfo += TerminalInfoString(TERMINAL_OS_VERSION) + "|";
   
   // Caminho da pasta Common (único por instalação Windows/VPS)
   string commonPath = TerminalInfoString(TERMINAL_COMMONDATA_PATH);
   systemInfo += commonPath;
   
   // Gerar hash simples
   ulong hash = 0;
   int len = StringLen(systemInfo);
   
   for(int i = 0; i < len; i++)
   {
      ushort ch = StringGetCharacter(systemInfo, i);
      hash = hash * 31 + ch;
   }
   
   string vpsId = VPS_ID_PREFIX + IntegerToString(hash, 16);
   
   LogPrint(LOG_ALL, "VPS_ID", "ID gerado: " + vpsId);
   
   return vpsId;
}

//+------------------------------------------------------------------+
// Ler VPS ID do arquivo de registro (MQL5)
//+------------------------------------------------------------------+
string ReadVpsIdFromRegistry()
{
   int fileHandle = FileOpen(VPS_REGISTRY_FILE, FILE_READ|FILE_TXT|FILE_COMMON);
   
   if(fileHandle != INVALID_HANDLE)
   {
      string content = "";
      while(!FileIsEnding(fileHandle))
      {
         content += FileReadString(fileHandle) + "\n";
      }
      FileClose(fileHandle);
      
      // Extrair VPS ID do arquivo
      int vpsIdStart = StringFind(content, "\"vps_id\": \"") + 11;
      int vpsIdEnd = StringFind(content, "\"", vpsIdStart);
      
      if(vpsIdStart > 10 && vpsIdEnd > vpsIdStart)
      {
         string vpsId = StringSubstr(content, vpsIdStart, vpsIdEnd - vpsIdStart);
         LogPrint(LOG_ALL, "VPS_REG", "VPS ID encontrado: " + vpsId);
         return vpsId;
      }
   }
   
   return "";
}

//+------------------------------------------------------------------+
// Escrever/atualizar arquivo de registro VPS (MQL5)
//+------------------------------------------------------------------+
bool WriteVpsRegistry(string vpsId, long accountNumber)
{
   // Criar conteúdo JSON simples
   string jsonContent = "{\n";
   jsonContent += "  \"vps_id\": \"" + vpsId + "\",\n";
   jsonContent += "  \"last_update\": \"" + TimeToString(TimeCurrent()) + "\",\n";
   jsonContent += "  \"account\": " + IntegerToString(accountNumber) + ",\n";
   jsonContent += "  \"server\": \"" + AccountInfoString(ACCOUNT_SERVER) + "\",\n";
   jsonContent += "  \"terminal_type\": \"MT5\"\n";
   jsonContent += "}";
   
   // Escrever arquivo
   int fileHandle = FileOpen(VPS_REGISTRY_FILE, FILE_WRITE|FILE_TXT|FILE_COMMON);
   
   if(fileHandle != INVALID_HANDLE)
   {
      FileWrite(fileHandle, jsonContent);
      FileClose(fileHandle);
      
      LogPrint(LOG_ESSENTIAL, "VPS_REG", "Registro VPS atualizado: " + vpsId);
      return true;
   }
   else
   {
      LogPrint(LOG_ALL, "VPS_REG", "Erro ao escrever arquivo de registro");
      return false;
   }
}

//+------------------------------------------------------------------+
// Obter ID único do VPS (função principal MQL5)
//+------------------------------------------------------------------+
string GetVpsUniqueId()
{
   long currentAccount = AccountInfoInteger(ACCOUNT_LOGIN);
   
   // Tentar ler ID existente
   string vpsId = ReadVpsIdFromRegistry();
   
   // Se não encontrou, gerar novo
   if(vpsId == "")
   {
      vpsId = GenerateVpsId();
      LogPrint(LOG_ESSENTIAL, "VPS_ID", "Novo VPS ID: " + vpsId);
   }
   else
   {
      LogPrint(LOG_ESSENTIAL, "VPS_ID", "VPS ID existente: " + vpsId);
   }
   
   // Atualizar arquivo de registro
   WriteVpsRegistry(vpsId, currentAccount);
   
   return vpsId;
}

//+------------------------------------------------------------------+
// Verificar se há múltiplas contas (função simples MQL5)
//+------------------------------------------------------------------+
bool HasMultipleAccountsOnVps()
{
   int fileHandle = FileOpen(VPS_REGISTRY_FILE, FILE_READ|FILE_TXT|FILE_COMMON);
   
   if(fileHandle != INVALID_HANDLE)
   {
      string content = "";
      while(!FileIsEnding(fileHandle))
      {
         content += FileReadString(fileHandle) + "\n";
      }
      FileClose(fileHandle);
      
      // Contar quantas vezes aparece "account" no arquivo
      int accountCount = 0;
      int pos = 0;
      while((pos = StringFind(content, "\"account\":", pos)) >= 0)
      {
         accountCount++;
         pos += 10;
      }
      
      return (accountCount > 1);
   }
   
   return false;
}
