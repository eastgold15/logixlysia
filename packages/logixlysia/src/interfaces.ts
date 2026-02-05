import type {
  Logger as PinoLogger,
  LoggerOptions as PinoLoggerOptions
} from 'pino'
import type { ProblemError } from './Error/errors'
import type { Code } from './Error/type'

export type Pino = PinoLogger<never, boolean>


export type RequestInfo = Request

export type LogLevel = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR'

export interface StoreData {
  beforeTime: bigint
}

export interface LogixlysiaStore {
  logger: Logger
  pino: Pino
  beforeTime?: bigint
  [key: string]: unknown
}

export interface Transport {
  log: (
    level: LogLevel,
    message: string,
    meta?: Record<string, unknown>
  ) => void | Promise<void>
}

export interface LogRotationConfig {
  /**
   * Max log file size before rotation, e.g. '10m', '5k', or a byte count.
   */
  maxSize?: string | number
  /**
   * Keep at most N files or keep files for a duration like '7d'.
   */
  maxFiles?: number | string
  /**
   * Rotate at a fixed interval, e.g. '1d', '12h'.
   */
  interval?: string
  compress?: boolean
  compression?: 'gzip'
}

export interface LogFilter {
  /**
   * Array of log levels to allow. If specified, only logs with these levels will be processed.
   * If not specified, all log levels will be allowed.
   */
  level?: LogLevel[]
}

export interface Options {
  config?: {
    showStartupMessage?: boolean
    startupMessageFormat?: 'simple' | 'banner'
    useColors?: boolean
    ip?: boolean
    timestamp?: {
      translateTime?: string
    }
    customLogFormat?: string

    // Filtering
    logFilter?: LogFilter

    // Outputs
    transports?: Transport[]
    useTransportsOnly?: boolean
    disableInternalLogger?: boolean
    disableFileLogging?: boolean
    logFilePath?: string
    logRotation?: LogRotationConfig

    // Pino
    pino?: (PinoLoggerOptions & { prettyPrint?: boolean }) | undefined

    error?: {
      problemJson?: {
        typeBaseUrl?: string
      }
      /**
       * 是否在控制台显示完整的错误详情（包括 detail 和 extensions）
       * 开启后会将完整的错误对象打印到控制台，便于调试
       * @default false
       */
      verboseErrorLogging?: boolean
    }
  }

  transform?: (
    error: unknown,
    context: { request: Request; code: Code, path: string }
  ) => ProblemError | unknown
}



export interface Logger {
  pino: Pino
  log: (
    level: LogLevel,
    request: Request,
    data: Record<string, unknown>,
    store: StoreData
  ) => void
  handleHttpError: (
    request: Request,
    error: ProblemError,
    store: StoreData,
    options: Options
  ) => void
  debug: (
    request: Request,
    message: string,
    context?: Record<string, unknown>
  ) => void
  info: (
    request: Request,
    message: string,
    context?: Record<string, unknown>
  ) => void
  warn: (
    request: Request,
    message: string,
    context?: Record<string, unknown>
  ) => void
  error: (
    request: Request,
    message: string,
    context?: Record<string, unknown>
  ) => void
}

export interface LogixlysiaContext {
  request: Request
  store: LogixlysiaStore
}
