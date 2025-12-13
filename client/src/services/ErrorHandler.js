// services/ErrorHandler.js
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

class ErrorHandler {
  constructor() {
    this.isNative = Capacitor.isNativePlatform();
    this.errorLogFile = 'error_log.txt';
  }

  async logError(error, context = '') {
    const timestamp = new Date().toISOString();
    const errorMessage = `${timestamp} | Context: ${context} | Error: ${error.message || error}\nStack: ${error.stack || 'No stack trace'}\n\n`;
    
    if (this.isNative) {
      try {
        // Write error to a file in the documents directory
        const existingLog = await this.readErrorLog();
        const newLog = existingLog + errorMessage;
        
        await Filesystem.writeFile({
          path: this.errorLogFile,
          data: newLog,
          directory: Directory.Documents,
        });
      } catch (fsError) {
        console.error('Failed to write error to file:', fsError);
        // Fallback to console logging
        console.error(errorMessage);
      }
    } else {
      // For web, just log to console
      console.error(errorMessage);
    }
  }

  async readErrorLog() {
    if (this.isNative) {
      try {
        const result = await Filesystem.readFile({
          path: this.errorLogFile,
          directory: Directory.Documents,
        });
        return result.data || '';
      } catch (error) {
        // If file doesn't exist, return empty string
        return '';
      }
    }
    return '';
  }

  async clearErrorLog() {
    if (this.isNative) {
      try {
        await Filesystem.writeFile({
          path: this.errorLogFile,
          data: '',
          directory: Directory.Documents,
        });
      } catch (error) {
        console.error('Failed to clear error log:', error);
      }
    }
  }
}

export default new ErrorHandler();