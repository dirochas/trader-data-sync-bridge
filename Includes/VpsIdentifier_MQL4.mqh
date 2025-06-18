
//+------------------------------------------------------------------+
//|                                                VpsIdentifier.mqh |
//| Identificação VPS via arquivo compartilhado - MQL4              |
//+------------------------------------------------------------------+

// Constantes
#define VPS_REGISTRY_FILE "vps_registry.json"
#define VPS_ID_PREFIX "VPS_"

//+------------------------------------------------------------------+
// Gerar ID único do VPS (MQL4)
//+------------------------------------------------------------------+
string GenerateVpsId()
{
   string systemInfo = "";
   
   // Informações do terminal (MQL4)
   systemInfo += TerminalName() + "|";
   systemInfo += TerminalCompany() + "|";
   systemInfo += TerminalPath() + "|";
   
   // Gerar hash simples
   ulong hash = 0;
   for(int i = 0; i < StringLen(systemInfo); i++)
   {
      hash = hash * 31 + StringGetChar(systemInfo, i);
   }
   
   return VPS_ID_PREFIX + IntegerToString(hash, 16);
}

//+------------------------------------------------------------------+
// Ler VPS ID do arquivo (MQL4)
//+------------------------------------------------------------------+
string ReadVpsId()
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
      
      int start = StringFind(content, "\"vps_id\": \"") + 11;
      int end = StringFind(content, "\"", start);
      if(start > 10 && end > start)
      {
         return StringSubstr(content, start, end - start);
      }
   }
   return "";
}

//+------------------------------------------------------------------+
// Escrever VPS ID no arquivo (MQL4)
//+------------------------------------------------------------------+
void WriteVpsId(string vpsId)
{
   string jsonContent = "{\n";
   jsonContent += "  \"vps_id\": \"" + vpsId + "\",\n";
   jsonContent += "  \"last_update\": \"" + TimeToStr(TimeCurrent()) + "\",\n";
   jsonContent += "  \"account\": " + IntegerToString(AccountNumber()) + ",\n";
   jsonContent += "  \"server\": \"" + AccountServer() + "\",\n";
   jsonContent += "  \"terminal_type\": \"MT4\"\n";
   jsonContent += "}";
   
   int fileHandle = FileOpen(VPS_REGISTRY_FILE, FILE_WRITE|FILE_TXT|FILE_COMMON);
   if(fileHandle != INVALID_HANDLE)
   {
      FileWrite(fileHandle, jsonContent);
      FileClose(fileHandle);
   }
}

//+------------------------------------------------------------------+
// Verificar se há múltiplas contas no VPS (MQL4)
//+------------------------------------------------------------------+
bool CheckMultipleAccounts()
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

//+------------------------------------------------------------------+
// Obter ID único do VPS (função principal MQL4)
//+------------------------------------------------------------------+
string GetVpsUniqueId()
{
   string vpsId = ReadVpsId();
   if(vpsId == "")
   {
      vpsId = GenerateVpsId();
      Print("📌 [VPS] Novo VPS ID: " + vpsId);
   }
   else
   {
      Print("📌 [VPS] VPS ID existente: " + vpsId);
   }
   
   WriteVpsId(vpsId);
   
   // Verificar múltiplas contas
   if(CheckMultipleAccounts())
   {
      Print("🚨 [VPS_MULTI] 🔥 MÚLTIPLAS CONTAS DETECTADAS NESTE VPS!");
      Print("🚨 [VPS_MULTI] VPS ID: " + vpsId);
   }
   
   return vpsId;
}
