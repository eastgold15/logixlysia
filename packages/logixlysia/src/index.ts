import { Elysia, type SingletonBase } from 'elysia'
import { startServer } from './extensions'
import type { LogixlysiaStore, Options } from './interfaces'
import { createLogger } from './logger'
import { normalizeToProblem } from './utils/handle-error'

export type Logixlysia = Elysia<
  'Logixlysia',
  SingletonBase & { store: LogixlysiaStore }
>

export const logixlysia = (options: Options = {}): Logixlysia => {
  const didCustomLog = new WeakSet<Request>()
  const baseLogger = createLogger(options)
  const logger = {
    ...baseLogger,
    debug: (
      request: Request,
      message: string,
      context?: Record<string, unknown>
    ) => {
      didCustomLog.add(request)
      baseLogger.debug(request, message, context)
    },
    info: (
      request: Request,
      message: string,
      context?: Record<string, unknown>
    ) => {
      didCustomLog.add(request)
      baseLogger.info(request, message, context)
    },
    warn: (
      request: Request,
      message: string,
      context?: Record<string, unknown>
    ) => {
      didCustomLog.add(request)
      baseLogger.warn(request, message, context)
    },
    error: (
      request: Request,
      message: string,
      context?: Record<string, unknown>
    ) => {
      didCustomLog.add(request)
      baseLogger.error(request, message, context)
    }
  }

  const app = new Elysia({
    name: 'Logixlysia',
    detail: {
      description:
        'Logixlysia is a plugin for Elysia that provides a logger and pino logger.',
      tags: ['logging', 'pino']
    }
  })

  const errorConfig = options.config?.error

  return (
    app
      .state('logger', logger)
      .state('pino', logger.pino)
      .state('beforeTime', BigInt(0))
      .onStart(({ server }) => {
        if (server) {
          startServer(server, options)
        }
      })
      .onRequest(({ store }) => {
        store.beforeTime = process.hrtime.bigint()
      })
      .onAfterHandle(({ request, set, store }) => {
        if (didCustomLog.has(request)) {
          return
        }

        const status = typeof set.status === 'number' ? set.status : 200
        let level: 'INFO' | 'WARNING' | 'ERROR' = 'INFO'
        if (status >= 500) {
          level = 'ERROR'
        } else if (status >= 400) {
          level = 'WARNING'
        }

        logger.log(level, request, { status }, store)
      })
      .onError(({ request, error, code, path, store, set }) => {
        // ① 分层解析为 ProblemError
        const problem = normalizeToProblem(error, code, path, {
          typeBaseUrl: errorConfig?.typeBaseUrl,
          errorMap: errorConfig?.errorMap,
          resolve: errorConfig?.resolve,
          request
        })

        // ② 打印日志
        logger.handleHttpError(request, problem, store, options)

        // ③ 返回 RFC 9457 响应
        set.status = problem.status
        set.headers['content-type'] = 'application/problem+json'
        return problem.toJSON()
      })
      // Ensure plugin lifecycle hooks apply to the parent app.
      .as('scoped') as unknown as Logixlysia
  )
}

// ==========================================
// Error Exports
// ==========================================

export { createProblem } from './Error/errors'
export type { HttpErrorConstructor, ProblemConfig, ProblemDocument } from './Error/errors'
export * from './Error/errors'
export type { Code } from './Error/type'

// ==========================================
// Utils Exports
// ==========================================

export { normalizeToProblem } from './utils/handle-error'
export { getErrorCode } from './utils/get-error-code'

// ==========================================
// Interface Exports
// ==========================================

export type {
  ErrorMapping,
  ErrorResolver,
  Logger,
  LogixlysiaContext,
  LogixlysiaStore,
  LogLevel,
  Options,
  Pino,
  StoreData,
  Transport
} from './interfaces'

export default logixlysia
