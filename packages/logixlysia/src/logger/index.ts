import pino from "pino";
import type {
  LogFilter,
  Logger,
  LogLevel,
  Options,
  Pino,
  StoreData,
} from "../interfaces";
import { formatLine } from "./create-logger";
import { handleHttpError, outputPipeline } from "./handle-http-error";

export const createLogger = (options: Options = {}): Logger => {
  const config = options.config;

  const pinoConfig = config?.pino;
  const { prettyPrint, ...pinoOptions } = pinoConfig ?? {};

  const shouldPrettyPrint =
    prettyPrint === true && pinoOptions.transport === undefined;

  const pinoLogger: Pino = shouldPrettyPrint
    ? pino({
        ...pinoOptions,
        level: pinoOptions.level ?? "info",
        messageKey: pinoOptions.messageKey,
        errorKey: pinoOptions.errorKey,
        transport: {
          target: "pino-pretty",
          options: {
            colorize: process.stdout?.isTTY === true,
            translateTime: config?.timestamp?.translateTime,
            messageKey: pinoOptions.messageKey,
            errorKey: pinoOptions.errorKey,
          },
        },
      })
    : pino({
        ...pinoOptions,
        level: pinoOptions.level ?? "info",
        messageKey: pinoOptions.messageKey,
        errorKey: pinoOptions.errorKey,
      });

  const shouldLog = (level: LogLevel, logFilter?: LogFilter): boolean => {
    if (!logFilter?.level || logFilter.level.length === 0) {
      return true;
    }
    return logFilter.level.includes(level);
  };

  const log = (
    level: LogLevel,
    request: Request,
    data: Record<string, unknown>,
    store: StoreData
  ): void => {
    if (!shouldLog(level, config?.logFilter)) {
      return;
    }

    const consoleMessage = formatLine({ level, request, data, store, options });
    outputPipeline(level, request, data, store, options, consoleMessage);
  };

  const logWithContext = (
    level: LogLevel,
    request: Request,
    message: string,
    context?: Record<string, unknown>
  ): void => {
    const store: StoreData = {
      beforeTime: process.hrtime.bigint(),
      pathname: new URL(request.url).pathname,
    };
    log(level, request, { message, context }, store);
  };

  return {
    pino: pinoLogger,
    log,
    handleHttpError: (request, error, store) => {
      handleHttpError(request, error, store, options);
    },
    debug: (request, message, context) => {
      logWithContext("DEBUG", request, message, context);
    },
    info: (request, message, context) => {
      logWithContext("INFO", request, message, context);
    },
    warn: (request, message, context) => {
      logWithContext("WARNING", request, message, context);
    },
    error: (request, message, context) => {
      logWithContext("ERROR", request, message, context);
    },
  };
};
