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

interface LogType {
  msg: any[]
  key: string
  level: string
  err: any
}

const formatMsg = ({ msg, level, err }: LogType) => {
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
  err?: any
  key?: string

  constructor(key?: string, err?: any) {
    this.key = key
    this.err = err
  }

  static withErr(err: any) {
    return new mlog(undefined, err)
  }

  static withKey(key: string) {
    return new mlog(key, undefined)
  }

  withKey(key: string) {
    if (this.key) {
      this.key = `${this.key}.${key}`
    } else {
      this.key = key
    }
    return this
  }

  withErr(err: any) {
    this.err = err
    return this
  }

  static trace(...msg: any[]) {
    logLib.trace(formatMsg({ msg, key: "default", level: "Trace", err: null }))
  }

  static debug(...msg: any[]) {
    logLib.debug(formatMsg({ msg, key: "default", level: "Debug", err: null }))
  }

  static log(...msg: any[]) {
    logLib.log(formatMsg({ msg, key: "default", level: "Log", err: null }))
  }

  static info(...msg: any[]) {
    logLib.info(formatMsg({ msg, key: "default", level: "Info", err: null }))
  }

  static warn(...msg: any[]) {
    logLib.warn(formatMsg({ msg, key: "default", level: "Warn", err: null }))
  }

  static error(...msg: any[]) {
    logLib.error(formatMsg({ msg, key: "default", level: "Error", err: null }))
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
    logLib.trace(
      formatMsg({
        msg,
        key: this.key || "default",
        level: "Trace",
        err: this.err,
      }),
    )
  }

  debug(...msg: any[]) {
    logLib.debug(
      formatMsg({
        msg,
        key: this.key || "default",
        level: "Debug",
        err: this.err,
      }),
    )
  }

  log(...msg: any[]) {
    logLib.log(
      formatMsg({
        msg,
        key: this.key || "default",
        level: "Log",
        err: this.err,
      }),
    )
  }

  info(...msg: any[]) {
    logLib.info(
      formatMsg({
        msg,
        key: this.key || "default",
        level: "Info",
        err: this.err,
      }),
    )
  }

  warn(...msg: any[]) {
    logLib.warn(
      formatMsg({
        msg,
        key: this.key || "default",
        level: "Warn",
        err: this.err,
      }),
    )
  }

  error(...msg: any[]) {
    logLib.error(
      formatMsg({
        msg,
        key: this.key || "default",
        level: "Error",
        err: this.err,
      }),
    )
  }
}
