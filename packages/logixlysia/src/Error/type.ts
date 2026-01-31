// src/libs/elysia-http-problem-json/types.ts

import type { HttpError, ProblemError } from './errors'

export type Code =
  | number
  | 'PROBLEM_ERROR'
  | 'UNKNOWN'
  | 'VALIDATION'
  | 'NOT_FOUND'
  | 'PARSE'
  | 'INTERNAL_SERVER_ERROR'
  | 'INVALID_COOKIE_SIGNATURE'
  | 'INVALID_FILE_TYPE'

// 获取 HttpError 对象的所有 Key (例如 "BadRequest" | "NotFound")
export type HttpErrorType = keyof typeof HttpError

export interface ErrorContext {
  request: Request
  path: string
  code: string | number
  error: unknown
}

export interface HttpProblemJsonOptions {
  /**
   * 自定义错误类型的 Base URL
   * @example "https://api.mysite.com/errors"
   */
  typeBaseUrl?: string

  /**
   * 🪝 Transform Hook
   * 将未知错误转换为 HttpError。
   * 返回 undefined/null 表示不处理（走默认逻辑）。
   */
  transform?: (
    error: unknown,
    context: ErrorContext
  ) => ProblemError | undefined | null // 这里直接返回 ProblemError 实例更好，或者用 HttpErrorType 也可以，看你喜好

  /**
   * 📢 Listen Hook
   * 在响应发送前触发（用于日志）。
   */
  onBeforeRespond?: (
    problem: ProblemError,
    context: ErrorContext
  ) => void | Promise<void>
}
