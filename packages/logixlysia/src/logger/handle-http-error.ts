import type { ProblemError } from "../error/errors";
import type { LogLevel, Options, StoreData } from "../interfaces";
import { logToTransports } from "../output";
import { logToFile } from "../output/file";

/**
 * 统一输出管道：transports → file → console
 * handleHttpError 和 log 共用同一管道，不再重复判断配置
 */
const outputPipeline = (
  level: LogLevel,
  request: Request,
  data: Record<string, unknown>,
  store: StoreData,
  options: Options,
  consoleMessage?: string
): void => {
  const config = options.config;

  // 1. Transports
  logToTransports({ level, request, data, store, options });

  // 2. File
  const useTransportsOnly = config?.useTransportsOnly === true;
  const disableFileLogging = config?.disableFileLogging === true;
  if (!(useTransportsOnly || disableFileLogging)) {
    const filePath = config?.logFilePath;
    if (filePath) {
      logToFile({ filePath, level, request, data, store, options }).catch(
        (e) => {
          console.error(e);
        }
      );
    }
  }

  // 3. Console
  if (useTransportsOnly || config?.disableInternalLogger === true) return;

  if (consoleMessage) {
    switch (level) {
      case "DEBUG":
        console.debug(consoleMessage);
        break;
      case "INFO":
        console.info(consoleMessage);
        break;
      case "WARNING":
        console.warn(consoleMessage);
        break;
      case "ERROR":
        console.error(consoleMessage);
        break;
      default:
        console.log(consoleMessage);
    }
  }
};

export const handleHttpError = (
  request: Request,
  problem: ProblemError,
  store: StoreData,
  options: Options
): void => {
  const config = options.config;
  const level: LogLevel = problem.status >= 500 ? "ERROR" : "WARNING";
  const rfcData = problem.toJSON();
  const data = {
    status: problem.status,
    message: problem.detail || problem.title,
    ...rfcData,
  };

  // 构建 console 消息
  let consoleMessage = "";
  if (!(config?.useTransportsOnly || config?.disableInternalLogger)) {
    let timestamp = "";
    if (config?.timestamp) {
      timestamp = `[${new Date().toISOString()}] `;
    }
    const pathname = store.pathname || new URL(request.url).pathname;
    consoleMessage = `${timestamp}${level} ${request.method} ${pathname} ${problem.status} - ${problem.title}`;

    // 详细错误日志
    if (config?.error?.verboseErrorLogging) {
      const parts = [consoleMessage];
      if (rfcData.detail) parts.push(`  Detail: ${rfcData.detail}`);
      if (rfcData.instance) parts.push(`  Instance: ${rfcData.instance}`);
      if (rfcData.type && rfcData.type !== "about:blank")
        parts.push(`  Type: ${rfcData.type}`);
      const extensions = Object.entries(rfcData).filter(
        ([key]) =>
          !["type", "title", "status", "detail", "instance"].includes(key)
      );
      if (extensions.length > 0) {
        parts.push("  Extensions:");
        for (const [key, value] of extensions) {
          parts.push(`    ${key}: ${JSON.stringify(value)}`);
        }
      }
      consoleMessage = parts.join("\n");
    }
  }

  outputPipeline(
    level,
    request,
    data,
    store,
    options,
    consoleMessage || undefined
  );
};

export { outputPipeline };
