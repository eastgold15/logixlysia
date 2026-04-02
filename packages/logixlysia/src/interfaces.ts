import type {
  Logger as PinoLogger,
  LoggerOptions as PinoLoggerOptions,
} from "pino";
import type { ProblemError } from "./error/errors";
import type { Code } from "./error/type";

export type Pino = PinoLogger<never, boolean>;

export type LogLevel = "DEBUG" | "INFO" | "WARNING" | "ERROR";

export interface StoreData {
  beforeTime: bigint;
  pathname: string;
}

export interface LogixlysiaStore {
  beforeTime?: bigint;
  logger: Logger;
  pathname?: string;
  pino: Pino;
  [key: string]: unknown;
}

export interface Transport {
  log: (
    level: LogLevel,
    message: string,
    meta?: Record<string, unknown>
  ) => void | Promise<void>;
}

export interface LogRotationConfig {
  compress?: boolean;
  compression?: "gzip";
  /**
   * Rotate at a fixed interval, e.g. '1d', '12h'.
   */
  interval?: string;
  /**
   * Keep at most N files or keep files for a duration like '7d'.
   */
  maxFiles?: number | string;
  /**
   * Max log file size before rotation, e.g. '10m', '5k', or a byte count.
   */
  maxSize?: string | number;
}

// ==========================================
// Error Mapping
// ==========================================

export interface ErrorMapping {
  detail?: string;
  status: number;
  title: string;
}

export type ErrorResolver = (
  error: unknown,
  context: { code: Code; path: string; request: Request }
) => ProblemError | void;

// ==========================================
// Options
// ==========================================

export interface StartupConfig {
  format?: "simple" | "banner";
  show?: boolean;
}

export interface FormatConfig {
  colors?: boolean;
  showIp?: boolean;
  template?: string;
  timestamp?: string;
}

export interface FileConfig {
  path: string;
  rotation?: LogRotationConfig;
}

export interface TransportsConfig {
  only?: boolean;
  targets: Transport[];
}

export interface ErrorConfig {
  errorMap?: Record<string, ErrorMapping>;
  resolve?: ErrorResolver;
  typeBaseUrl?: string;
  verbose?: boolean;
}

export interface Options {
  error?: ErrorConfig;
  file?: false | FileConfig;
  format?: FormatConfig;
  logLevel?: LogLevel | LogLevel[];
  pino?: PinoLoggerOptions;
  startup?: StartupConfig;
  transports?: Transport[] | TransportsConfig;
}

// ==========================================
// Logger
// ==========================================

export interface Logger {
  debug: (
    request: Request,
    message: string,
    context?: Record<string, unknown>
  ) => void;
  error: (
    request: Request,
    message: string,
    context?: Record<string, unknown>
  ) => void;
  handleHttpError: (
    request: Request,
    error: ProblemError,
    store: StoreData,
    options: Options
  ) => void;
  info: (
    request: Request,
    message: string,
    context?: Record<string, unknown>
  ) => void;
  log: (
    level: LogLevel,
    request: Request,
    data: Record<string, unknown>,
    store: StoreData
  ) => void;
  pino: Pino;
  warn: (
    request: Request,
    message: string,
    context?: Record<string, unknown>
  ) => void;
}

export interface LogixlysiaContext {
  request: Request;
  store: LogixlysiaStore;
}
