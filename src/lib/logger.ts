// Local debugging logger
export class DebugLogger {
  private logs: string[] = [];
  
  log(level: 'INFO' | 'ERROR' | 'DEBUG' | 'WARN', component: string, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] [${component}] ${message}`;
    
    // Add to local logs array
    this.logs.push(logEntry);
    if (data) {
      this.logs.push(`[${timestamp}] [DATA] ${JSON.stringify(data, null, 2)}`);
    }
    
    // Also log to console
    console.log(logEntry);
    if (data) {
      console.log('Data:', data);
    }
    
    // Save to localStorage for persistence
    this.saveToStorage();
  }
  
  info(component: string, message: string, data?: any) {
    this.log('INFO', component, message, data);
  }
  
  error(component: string, message: string, error?: any) {
    this.log('ERROR', component, message, error);
  }
  
  debug(component: string, message: string, data?: any) {
    this.log('DEBUG', component, message, data);
  }
  
  warn(component: string, message: string, data?: any) {
    this.log('WARN', component, message, data);
  }
  
  // Save logs to localStorage
  private saveToStorage() {
    try {
      localStorage.setItem('crowdlift_debug_logs', JSON.stringify(this.logs));
    } catch (error) {
      console.error('Failed to save logs to localStorage:', error);
    }
  }
  
  // Get all logs
  getAllLogs(): string[] {
    return [...this.logs];
  }
  
  // Export logs as downloadable file
  downloadLogs() {
    const logContent = this.logs.join('\n');
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `crowdlift-debug-${new Date().toISOString().split('T')[0]}.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  // Clear logs
  clearLogs() {
    this.logs = [];
    localStorage.removeItem('crowdlift_debug_logs');
    console.log('Debug logs cleared');
  }
  
  // Load logs from localStorage
  loadFromStorage() {
    try {
      const saved = localStorage.getItem('crowdlift_debug_logs');
      if (saved) {
        this.logs = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load logs from localStorage:', error);
    }
  }
  
  // Print recent logs (last 10)
  printRecentLogs() {
    console.log('=== RECENT DEBUG LOGS ===');
    const recent = this.logs.slice(-20); // Last 20 entries
    recent.forEach(log => console.log(log));
    console.log('=== END RECENT LOGS ===');
  }
}

// Singleton logger instance
export const debugLogger = new DebugLogger();

// Load existing logs on initialization
debugLogger.loadFromStorage();

// Helper function for quick logging
export const log = {
  info: (component: string, message: string, data?: any) => debugLogger.info(component, message, data),
  error: (component: string, message: string, error?: any) => debugLogger.error(component, message, error),
  debug: (component: string, message: string, data?: any) => debugLogger.debug(component, message, data),
  warn: (component: string, message: string, data?: any) => debugLogger.warn(component, message, data),
}; 