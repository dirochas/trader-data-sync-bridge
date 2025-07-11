//+------------------------------------------------------------------+
//|                                                 AccountUtils.mqh |
//| Utilitários para informações de conta                           |
//+------------------------------------------------------------------+

#include "Logger.mqh" // update to Version 2.12

//+------------------------------------------------------------------+
// Verificar se há necessidade de processar (MQL5)
//+------------------------------------------------------------------+
bool HasOpenOrdersOrPendingOrders()
{
   int openPositions = 0;
   int pendingOrders = 0;
   
   // Contar posições abertas manualmente (como no MQ4 funcional)
   for(int i = 0; i < PositionsTotal(); i++)
   {
      if(PositionGetTicket(i) > 0)
      {
         openPositions++;
      }
   }
   
   // Contar ordens pendentes manualmente  
   for(int i = 0; i < OrdersTotal(); i++)
   {
      if(OrderGetTicket(i) > 0)
      {
         ENUM_ORDER_TYPE orderType = (ENUM_ORDER_TYPE)OrderGetInteger(ORDER_TYPE);
         if(orderType > ORDER_TYPE_SELL) // Ordens pendentes
         {
            pendingOrders++;
         }
      }
   }
   
   return (openPositions > 0 || pendingOrders > 0);
}

//+------------------------------------------------------------------+
// Construir dados JSON completos
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
   
   // LOG INTELIGENTE DA CONTA
   string accountInfo = "Conta: " + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) + " | Balance: $" + DoubleToString(AccountInfoDouble(ACCOUNT_BALANCE), 2) + " | Equity: $" + DoubleToString(AccountInfoDouble(ACCOUNT_EQUITY), 2);
   LogAccountSmart(accountInfo);
   
    // TEMPORÁRIO: Margem simplificada para evitar overflow
    json += "\"margin\":{\"used\":0.00,\"free\":0.00,\"level\":0.00},";
   
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
// Construir dados JSON para status idle
//+------------------------------------------------------------------+
string BuildIdleJsonData()
{
   string jsonData = "{";
   jsonData += "\"account\":{";
   jsonData += "\"balance\":" + DoubleToString(AccountInfoDouble(ACCOUNT_BALANCE), 2) + ",";
   jsonData += "\"equity\":" + DoubleToString(AccountInfoDouble(ACCOUNT_EQUITY), 2) + ",";
   jsonData += "\"profit\":0.00,";
   jsonData += "\"accountNumber\":\"" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) + "\",";
   jsonData += "\"server\":\"" + AccountInfoString(ACCOUNT_SERVER) + "\",";
   jsonData += "\"leverage\":" + IntegerToString(AccountInfoInteger(ACCOUNT_LEVERAGE));
   jsonData += "},";
    // TEMPORÁRIO: Margem simplificada para evitar overflow
    jsonData += "\"margin\":{\"used\":0.00,\"free\":0.00,\"level\":0.00},";
   jsonData += "\"positions\":[],";
   jsonData += "\"history\":[],";
   jsonData += "\"status\":\"IDLE\"";
   jsonData += "}";
   
   return jsonData;
}

