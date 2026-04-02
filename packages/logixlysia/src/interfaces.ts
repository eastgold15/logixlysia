import type {
  Logger as PinoLogger,
  LoggerOptions as PinoLoggerOptions,
} from "pino";
import type { ProblemError } from "./Error/errors";
import type { Code } from "./Error/type";

export type Pino = PinoLogger<never, boolean>;

export type LogLevel = "DEBUG" | "INFO" | "WARNING" | "ERROR";

export interface StoreData {
  beforeTime: bigint;
}

export interface LogixlysiaStore {
  beforeTime?: bigint;
  logger: Logger;
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

export interface LogFilter {
  /**
   * Array of log levels to allow. If specified, only logs with these levels will be processed.
   * If not specified, all log levels will be allowed.
   */
  level?: LogLevel[];
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

export interface Options {
  config?: {
    showStartupMessage?: boolean;
    startupMessageFormat?: "simple" | "banner";
    useColors?: boolean;
    ip?: boolean;
    timestamp?: {
      translateTime?: string;
    };
    customLogFormat?: string;

    // Filtering
    logFilter?: LogFilter;

    // Outputs
    transports?: Transport[];
    useTransportsOnly?: boolean;
    disableInternalLogger?: boolean;
    disableFileLogging?: boolean;
    logFilePath?: string;
    logRotation?: LogRotationConfig;

    // Pino
    pino?: (PinoLoggerOptions & { prettyPrint?: boolean }) | undefined;

    // Error handling
    error?: {
      /**
       * 自定义错误类型的 Base URL
       * @example "https://api.mysite.com/errors"
       */
      typeBaseUrl?: string;

      /**
       * 错误码映射表（Postgres / MySQL / 自定义错误码）
       * 键为错误码字符串，值为 ProblemError 字段
       *
       * @example
       * ```ts
       * errorMap: {
       *   '23505': { status: 409, title: 'Resource already exists', detail: 'Unique constraint violation' },
       *   '23503': { status: 400, title: 'Foreign key constraint failed' },
       *   'ER_DUP_ENTRY': { status: 409, title: 'Duplicate entry' },
       * }
       * ```
       */
      errorMap?: Record<string, ErrorMapping>;

      /**
       * 用户自定义错误解析回调
       * 返回 ProblemError 表示已处理，返回 void 表示交给下一层
       *
       * @example
       * ```ts
       * resolve(error, { code, path }) {
       *   if (isStripeError(error)) {
       *     return createProblem(402, { detail: error.message })
       *   }
       *   // return void → 交给下一层
       * }
       * ```
       */
      resolve?: ErrorResolver;

      /**
       * 是否在控制台显示完整的错误详情（包括 detail 和 extensions）
       * @default false
       */
      verboseErrorLogging?: boolean;
    };
  };
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
