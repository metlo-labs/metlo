import LogLevel, { LogLevelNames } from "loglevel"

export class Logger {
  private static _logger: LogLevel.Logger
  public static getLogger(level?: LogLevelNames) {
    if (!Logger._logger) {
      Logger._logger = LogLevel.getLogger("metlo")
      if (level) {
        Logger._logger.setLevel(level)
      } else {
        Logger._logger.setLevel("error")
      }
    }
    return Logger._logger
  }
}
