import type { ProblemError } from "../error/errors";
import type {
  LogLevel,
  Options,
  StoreData,
  Transport,
  TransportsConfig,
} from "../interfaces";
import { logToTransports } from "../output";
import { logToFile } from "../output/file";

const normalizeTransports = (
  transports?: Transport[] | TransportsConfig
): { targets: Transport[]; only: boolean } => {
  if (!transports) return { targets: [], only: false };
  if (Array.isArray(transports)) return { targets: transports, only: false };
  return { targets: transports.targets, only: transports.only === true };
};

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
  const { targets, only: transportsOnly } = normalizeTransports(
    options.transports
  );

  // 1. Transports
  logToTransports({ level, request, data, store, transports: targets });

  // 2. File
  const fileConfig = options.file;
  const hasFile = fileConfig !== false && fileConfig !== undefined;
  if (!transportsOnly && hasFile) {
    logToFile({
      filePath: fileConfig.path,
      level,
      request,
      data,
      store,
      options,
    }).catch((e) => {
      console.error(e);
    });
  }

  // 3. Console
  if (transportsOnly) return;

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
  const level: LogLevel = problem.status >= 500 ? "ERROR" : "WARNING";
  const rfcData = problem.toJSON();
  const data = {
    status: problem.status,
    message: problem.detail || problem.title,
    ...rfcData,
  };

  // 构建 console 消息
  const { only: transportsOnly } = normalizeTransports(options.transports);
  let consoleMessage = "";
  if (!transportsOnly) {
    let timestamp = "";
    if (options.format?.timestamp) {
      timestamp = `[${new Date().toISOString()}] `;
    }
    const pathname = store.pathname || new URL(request.url).pathname;
    consoleMessage = `${timestamp}${level} ${request.method} ${pathname} ${problem.status} - ${problem.title}`;

    // 详细错误日志
    if (options.error?.verbose) {
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
