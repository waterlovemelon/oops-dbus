import fs from 'fs'
import path from 'path'
import os from 'os'

/**
 * Logger utility for file logging
 * Logs to ~/.config/dbus-workbench-electron/logs/main.log
 */
class Logger {
  private logFile: string

  constructor() {
    const logDir = path.join(os.homedir(), '.config', 'dbus-workbench-electron', 'logs')

    // Create log directory if it doesn't exist
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }

    this.logFile = path.join(logDir, 'main.log')
  }

  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString()
    return `[${timestamp}] [${level}] ${message}\n`
  }

  info(message: string) {
    const formatted = this.formatMessage('INFO', message)
    fs.appendFileSync(this.logFile, formatted)
    console.log(formatted.trim())
  }

  error(message: string, error?: any) {
    const formatted = this.formatMessage('ERROR', message)
    fs.appendFileSync(this.logFile, formatted)
    console.error(formatted.trim())
    if (error) {
      const errorMsg = this.formatMessage('ERROR', JSON.stringify(error))
      fs.appendFileSync(this.logFile, errorMsg)
      console.error(error)
    }
  }

  warn(message: string) {
    const formatted = this.formatMessage('WARN', message)
    fs.appendFileSync(this.logFile, formatted)
    console.warn(formatted.trim())
  }

  debug(message: string) {
    const formatted = this.formatMessage('DEBUG', message)
    fs.appendFileSync(this.logFile, formatted)
    console.log(formatted.trim())
  }
}

export const logger = new Logger()
