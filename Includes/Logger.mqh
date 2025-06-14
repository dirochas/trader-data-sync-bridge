
//+------------------------------------------------------------------+
//|                                                       Logger.mqh |
//| Sistema de logging melhorado para EA                             |
//+------------------------------------------------------------------+

// SISTEMA DE LOGS MELHORADO
enum LogLevel {
   LOG_NONE = 0,        // Sem logs
   LOG_ESSENTIAL = 1,   // Apenas logs essenciais
   LOG_CRITICAL = 2,    // Logs críticos + essenciais
   LOG_ALL = 3          // Todos os logs
};

extern LogLevel LoggingLevel = LOG_ESSENTIAL; // Nível de logging

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
