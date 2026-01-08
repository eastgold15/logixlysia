import type {
  Logger as PinoLogger,
  LoggerOptions as PinoLoggerOptions
} from 'pino'
import { ProblemError } from './Error/errors'
import { Code } from './Error/type'

export type Pino = PinoLogger<never, boolean>
export type Request = Request

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

    // Outputs
    transports?: Transport[]
    useTransportsOnly?: boolean
    disableInternalLogger?: boolean
    disableFileLogging?: boolean
    logFilePath?: string
    logRotation?: LogRotationConfig

    // Pino
    pino?: (PinoLoggerOptions & { prettyPrint?: boolean }) | undefined
  
    error?:{ 
     problemJson?:{ 
      typeBaseUrl?: string
    }
    }

  }

 transform?: (error: unknown, context: { request: Request; code: Code }) => ProblemError | unknown

 
}

export class HttpError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
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
