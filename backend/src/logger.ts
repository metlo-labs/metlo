import logLib from "loglevel"
import { DateTime } from "luxon"

var originalFactory = logLib.methodFactory
logLib.methodFactory = function (methodName, logLevel, loggerName) {
  var rawMethod = originalFactory(methodName, logLevel, loggerName)
  return function (message) {
    rawMethod(`${DateTime.utc().toString()} ${message}`)
  }
}

logLib.setLevel((process.env.LOG_LEVEL as logLib.LogLevelDesc) || "INFO")

const formatMsg = (msg: any[], level: string, err: any) => {
  let out = msg.map(e => `${level}: ${e}`)
  if (err) {
    out = out.map(e => `${e} - ${err}`)
  }
  if (err && err.stack) {
    out = out.map(e => `${e} - Error Stack - ${err.stack}`)
  }
  return out
}

export default class mlog {
  err: any

  constructor(err: any) {
    this.err = err
  }

  static withErr(err: any) {
    return new mlog(err)
  }

  static trace(...msg: any[]) {
    logLib.trace(formatMsg(msg, "Trace", null))
  }

  static debug(...msg: any[]) {
    logLib.debug(formatMsg(msg, "Debug", null))
  }

  static log(...msg: any[]) {
    logLib.log(formatMsg(msg, "Log", null))
  }

  static info(...msg: any[]) {
    logLib.info(formatMsg(msg, "Info", null))
  }

  static warn(...msg: any[]) {
    logLib.warn(formatMsg(msg, "Warn", null))
  }

  static error(...msg: any[]) {
    logLib.error(formatMsg(msg, "Error", null))
  }

  static time(key: string, value: number, sampleRate?: number) {
    mlog.debug(`timing:${key}:${value}`)
  }

  static count(key: string, value?: number, sampleRate?: number) {
    mlog.debug(`count:${key}:${value || 1}`)
  }

  static gauge(key: string, value: number, sampleRate?: number) {
    mlog.debug(`gauge:${key}:${value}`)
  }

  trace(...msg: any[]) {
    logLib.trace(formatMsg(msg, "Trace", this.err))
  }

  debug(...msg: any[]) {
    logLib.debug(formatMsg(msg, "Debug", this.err))
  }

  log(...msg: any[]) {
    logLib.log(formatMsg(msg, "Log", this.err))
  }

  info(...msg: any[]) {
    logLib.info(formatMsg(msg, "Info", this.err))
  }

  warn(...msg: any[]) {
    logLib.warn(formatMsg(msg, "Warn", this.err))
  }

  error(...msg: any[]) {
    logLib.error(formatMsg(msg, "Error", this.err))
  }
}
