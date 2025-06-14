
//+------------------------------------------------------------------+
//|                                              CommandProcessor.mqh |
//| Processador de comandos recebidos via API                       |
//+------------------------------------------------------------------+

#include "Logger.mqh"
#include "HttpClient.mqh"

//+------------------------------------------------------------------+
// Verificar comandos pendentes
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
// Executar comando CLOSE_ALL (MQL5)
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
// Extrair ID do comando
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
// Atualizar status do comando
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
// Descrição de erros (MQL5)
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
