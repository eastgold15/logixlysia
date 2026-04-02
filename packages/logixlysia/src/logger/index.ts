import pino from "pino";
import type { Logger, LogLevel, Options, Pino, StoreData } from "../interfaces";
import { formatLine } from "./create-logger";
import { handleHttpError, outputPipeline } from "./handle-http-error";

const shouldLog = (
  level: LogLevel,
  logLevel?: LogLevel | LogLevel[]
): boolean => {
  if (logLevel === undefined) return true;
  const levels = Array.isArray(logLevel) ? logLevel : [logLevel];
  if (levels.length === 0) return true;
  return levels.includes(level);
};

export const createLogger = (options: Options = {}): Logger => {
  const pinoOptions = options.pino ?? {};
  const isPrettyPrint = pinoOptions.transport === undefined;

  const basePinoOptions = {
    ...pinoOptions,
    level: pinoOptions.level ?? "info",
    messageKey: pinoOptions.messageKey,
    errorKey: pinoOptions.errorKey,
  };

  const createPinoLogger = (): Pino => {
    if (!isPrettyPrint) return pino(basePinoOptions);
    try {
      return pino({
        ...basePinoOptions,
        transport: {
          target: "pino-pretty",
          options: {
            colorize: process.stdout?.isTTY === true,
            translateTime: options.format?.timestamp,
            messageKey: pinoOptions.messageKey,
            errorKey: pinoOptions.errorKey,
          },
        },
      });
    } catch {
      return pino(basePinoOptions);
    }
  };

  const pinoLogger = createPinoLogger();

  const log = (
    level: LogLevel,
    request: Request,
    data: Record<string, unknown>,
    store: StoreData
  ): void => {
    if (!shouldLog(level, options.logLevel)) {
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
