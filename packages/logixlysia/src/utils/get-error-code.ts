/**
 * 递归提取错误码
 * 沿 cause/error 链递归查找，支持被包装的底层错误（Postgres、MySQL、第三方库等）
 */
export const getErrorCode = (error: unknown): string | undefined => {
  if (typeof error !== 'object' || error === null) return undefined

  const obj = error as Record<string, unknown>

  if ('code' in obj && typeof obj.code === 'string') {
    return obj.code
  }

  if ('cause' in obj) {
    return getErrorCode(obj.cause)
  }

  if ('error' in obj) {
    return getErrorCode(obj.error)
  }

  return undefined
}
