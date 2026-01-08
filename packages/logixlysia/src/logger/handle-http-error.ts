
import { ProblemError } from '../Error/errors'
import type { LogLevel, Options, StoreData } from '../interfaces'
import { logToTransports } from '../output'
import { logToFile } from '../output/file'


export const handleHttpError = (
  request: Request,
  problem: ProblemError,
  store: StoreData,
  options: Options
): void => {
  const config = options.config
  // 1. 准备日志数据：将 RFC 标准字段与日志元数据合并
  const level: LogLevel = 'ERROR';
  const rfcData = problem.toJSON();
  const data = { 
    status: problem.status, 
    message: problem.detail || problem.title, 
    ...rfcData 
  };
// 2. 阶段：传输层 (Transports)
  logToTransports({ level, request, data, store, options });
// 3. 阶段：持久化 (File Logging)
  // 匹配你的接口：useTransportsOnly 和 disableFileLogging 直接在 config 下
  if (!(config?.useTransportsOnly || config?.disableFileLogging)) {
    const filePath = config?.logFilePath;
    if (filePath) {
      logToFile({ filePath, level, request, data, store, options }).catch(() => {});
    }
  }

  // 4. 阶段：控制台输出 (Console/Internal)
  if (config?.useTransportsOnly || config?.disableInternalLogger) return;


  // 处理时间戳显示逻辑
  let timestamp = '';
  if (config?.timestamp) {
    timestamp = `[${new Date().toISOString()}] `;
  }

// 1. 安全提取 Method 和 Path
const method = typeof request === 'string' ? 'REQ' : request.method;
const urlString = typeof request === 'string' ? request : request.url;

let path: string;
try {
  // 如果是完整 URL 则提取 pathname，如果是相对路径则直接使用
  path = urlString.includes('://') 
    ? new URL(urlString).pathname 
    : urlString;
} catch {
  path = urlString;
}

// 2. 语义化终端打印
// 现在的代码对 string 和 Request 类型都百分之百安全了
console.error(
  `${timestamp}${level} ${method} ${path} ${problem.status} - ${problem.title}`
);
}
