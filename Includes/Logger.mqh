
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

//+------------------------------------------------------------------+
// SISTEMA DE LOGGING MELHORADO
//+------------------------------------------------------------------+
void LogPrint(LogLevel currentLogLevel, LogLevel level, string category, string message)
{
   if(currentLogLevel == LOG_NONE) return;
   if(level > currentLogLevel) return;
   
   string prefix = "";
   switch(level) {
      case LOG_ESSENTIAL: prefix = "📌 "; break;
      case LOG_CRITICAL:  prefix = "🚨 "; break;
      case LOG_ALL:       prefix = "💬 "; break;
   }
   
   Print(prefix + "[" + category + "] " + message);
}

void LogSeparator(LogLevel currentLogLevel, string category)
{
   if(currentLogLevel == LOG_NONE) return;
   Print("═══════════════════════════════════════════════════════════");
   Print("                    " + category);
   Print("═══════════════════════════════════════════════════════════");
}

void LogSubSeparator(LogLevel currentLogLevel, string subcategory)
{
   if(currentLogLevel == LOG_NONE) return;
   Print("─────────────── " + subcategory + " ───────────────");
}
