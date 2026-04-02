import type { ProblemError } from '../Error/errors'
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

  // 日志级别：4xx = WARNING，5xx = ERROR
  const level: LogLevel = problem.status >= 500 ? 'ERROR' : 'WARNING'

  // 1. 准备日志数据
  const rfcData = problem.toJSON()
  const data = {
    status: problem.status,
    message: problem.detail || problem.title,
    ...rfcData
  }

  // 2. Transports
  logToTransports({ level, request, data, store, options })

  // 3. File Logging
  if (!(config?.useTransportsOnly || config?.disableFileLogging)) {
    const filePath = config?.logFilePath
    if (filePath) {
      logToFile({ filePath, level, request, data, store, options }).catch(() => {})
    }
  }

  // 4. Console
  if (config?.useTransportsOnly || config?.disableInternalLogger) return

  let timestamp = ''
  if (config?.timestamp) {
    timestamp = `[${new Date().toISOString()}] `
  }

  const pathname = new URL(request.url).pathname
  console.error(
    `${timestamp}${level} ${request.method} ${pathname} ${problem.status} - ${problem.title}`
  )

  // 详细错误日志
  if (config?.error?.verboseErrorLogging) {
    const json = problem.toJSON()

    if (json.detail) {
      console.error(`  Detail: ${json.detail}`)
    }
    if (json.instance) {
      console.error(`  Instance: ${json.instance}`)
    }
    if (json.type && json.type !== 'about:blank') {
      console.error(`  Type: ${json.type}`)
    }

    const extensions = Object.entries(json).filter(
      ([key]) => !['type', 'title', 'status', 'detail', 'instance'].includes(key)
    )
    if (extensions.length > 0) {
      console.error('  Extensions:')
      for (const [key, value] of extensions) {
        console.error(`    ${key}:`, value)
      }
    }
  }
}
