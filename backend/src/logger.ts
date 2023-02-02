import logLib from "loglevel"
import { DateTime } from "luxon"
import axios from "axios"
import { myMetloBackendUrl } from "./constants"

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

const postLog = async ({ msg, level, key, err }: LogType) => {
  const licenseKey = process.env.LICENSE_KEY
  if (licenseKey) {
    try {
      await axios.post(
        `${myMetloBackendUrl}/log`,
        {
          msg: msg[0],
          key,
          level,
          timestamp: DateTime.now().toMillis(),
          values: {},
        },
        {
          headers: {
            authorization: licenseKey,
            "content-type": "application/json",
          },
        },
      )
    } catch {}
  }
}

const formatMsg = ({ msg, level, err, key }: LogType) => {
  postLog({ msg, level, key, err })
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
    const logData = {
      key: "default",
      level: "Trace",
      err: null,
      msg,
    }
    postLog(logData)
    logLib.trace(formatMsg(logData))
  }

  static debug(...msg: any[]) {
    const logData = {
      key: "default",
      level: "Debug",
      err: null,
      msg,
    }
    postLog(logData)
    logLib.debug(formatMsg(logData))
  }

  static log(...msg: any[]) {
    const logData = {
      key: "default",
      level: "Log",
      err: null,
      msg,
    }
    postLog(logData)
    logLib.log(formatMsg(logData))
  }

  static info(...msg: any[]) {
    const logData = {
      key: "default",
      level: "Info",
      err: null,
      msg,
    }
    postLog(logData)
    logLib.info(formatMsg(logData))
  }

  static warn(...msg: any[]) {
    const logData = {
      key: "default",
      level: "Warn",
      err: null,
      msg,
    }
    postLog(logData)
    logLib.warn(formatMsg(logData))
  }

  static error(...msg: any[]) {
    const logData = {
      key: "default",
      level: "Error",
      err: null,
      msg,
    }
    postLog(logData)
    logLib.error(formatMsg(logData))
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
    const logData = {
      msg,
      key: this.key || "default",
      level: "Trace",
      err: this.err,
    }
    postLog(logData)
    logLib.trace(formatMsg(logData))
  }

  debug(...msg: any[]) {
    const logData = {
      msg,
      key: this.key || "default",
      level: "Debug",
      err: this.err,
    }
    postLog(logData)
    logLib.debug(formatMsg(logData))
  }

  log(...msg: any[]) {
    const logData = {
      msg,
      key: this.key || "default",
      level: "Log",
      err: this.err,
    }
    postLog(logData)
    logLib.log(formatMsg(logData))
  }

  info(...msg: any[]) {
    const logData = {
      msg,
      key: this.key || "default",
      level: "Info",
      err: this.err,
    }
    postLog(logData)
    logLib.info(formatMsg(logData))
  }

  warn(...msg: any[]) {
    const logData = {
      msg,
      key: this.key || "default",
      level: "Warn",
      err: this.err,
    }
    postLog(logData)
    logLib.warn(formatMsg(logData))
  }

  error(...msg: any[]) {
    const logData = {
      msg,
      key: this.key || "default",
      level: "Error",
      err: this.err,
    }
    postLog(logData)
    logLib.error(formatMsg(logData))
  }
}
