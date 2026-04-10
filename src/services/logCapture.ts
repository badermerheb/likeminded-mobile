// src/services/logCapture.ts
// Captures console.log/warn/error into an in-memory buffer for the debug screen.

export interface LogEntry {
  id: number;
  level: 'log' | 'warn' | 'error' | 'info';
  message: string;
  timestamp: Date;
}

const MAX_LOGS = 500;
let _logs: LogEntry[] = [];
let _nextId = 1;
let _listeners: Array<() => void> = [];
let _installed = false;

function addLog(level: LogEntry['level'], args: any[]) {
  const message = args
    .map(a => {
      if (typeof a === 'string') return a;
      try {
        return JSON.stringify(a, null, 0);
      } catch {
        return String(a);
      }
    })
    .join(' ');

  const entry: LogEntry = {
    id: _nextId++,
    level,
    message,
    timestamp: new Date(),
  };

  _logs.push(entry);
  if (_logs.length > MAX_LOGS) {
    _logs = _logs.slice(-MAX_LOGS);
  }

  // Notify listeners
  _listeners.forEach(fn => fn());
}

/**
 * Install console interceptors. Call once at app startup (index.js).
 * Original console methods still work — we just tap into them.
 */
export function installLogCapture() {
  if (_installed) return;
  _installed = true;

  const origLog = console.log;
  const origWarn = console.warn;
  const origError = console.error;
  const origInfo = console.info;

  console.log = (...args: any[]) => {
    origLog(...args);
    addLog('log', args);
  };
  console.warn = (...args: any[]) => {
    origWarn(...args);
    addLog('warn', args);
  };
  console.error = (...args: any[]) => {
    origError(...args);
    addLog('error', args);
  };
  console.info = (...args: any[]) => {
    origInfo(...args);
    addLog('info', args);
  };
}

/** Get all captured logs */
export function getLogs(): LogEntry[] {
  return _logs;
}

/** Clear all logs */
export function clearLogs() {
  _logs = [];
  _nextId = 1;
  _listeners.forEach(fn => fn());
}

/** Subscribe to log changes — returns unsubscribe function */
export function subscribeLogs(listener: () => void): () => void {
  _listeners.push(listener);
  return () => {
    _listeners = _listeners.filter(fn => fn !== listener);
  };
}
