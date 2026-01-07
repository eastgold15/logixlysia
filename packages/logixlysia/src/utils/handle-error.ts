/**
 * RFC 9457 Problem JSON 格式化工具
 * @see https://www.rfc-editor.org/rfc/rfc9457.html
 */

import { ProblemError } from "../Error/errors";
import { Code } from "../Error/type";


/**
 * 默认的状态码与标题映射表 (RFC 标准推荐)
 */
const DEFAULT_TITLES: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  422: 'Unprocessable Entity',
  500: 'Internal Server Error',
  503: 'Service Unavailable',
};

export const normalizeToProblem = (
  error: any,
  code: Code,
  path: string,
  typeBaseUrl: string = 'about:blank'
): ProblemError => {
  // 1. 如果已经是 ProblemError，直接补充 instance 并返回
  if (error instanceof ProblemError) {
    // 如果没有 instance，自动补全为当前请求路径
    return error.instance ? error : new ProblemError(
      error.type,
      error.title,
      error.status,
      error.detail,
      path,
      error.extensions
    );
  }

  // 2. 初始化默认值
  let status = 500;
  let title = 'Internal Server Error';
  let detail = error instanceof Error ? error.message : String(error);
  let extensions: Record<string, unknown> = {};

  // 3. 识别 Elysia 内置错误码并“对齐”标准
  switch (code) {
    case 'VALIDATION':
      status = 400;
      title = 'Validation Failed';
      // 提取 Elysia 的校验细节
      extensions = { errors: error.all || [] };
      break;
    case 'NOT_FOUND':
      status = 404;
      title = 'Resource Not Found';
      break;
    case 'PARSE':
      status = 400;
      title = 'Invalid Payload';
      detail = 'The request body could not be parsed as valid JSON.';
      break;
    case 'INVALID_COOKIE_SIGNATURE':
      status = 401;
      title = 'Invalid Credentials';
      break;
    default:
      // 如果错误对象本身带有状态码（比如某些库抛出的）
      if (typeof error?.status === 'number') {
        status = error.status;
        title = DEFAULT_TITLES[status] || 'Unknown Error';
      }
      break;
  }

  // 4. 构造并返回标准的 ProblemError
  return new ProblemError(
    typeBaseUrl === 'about:blank' ? typeBaseUrl : `${typeBaseUrl}/${code}`,
    title,
    status,
    detail,
    path,
    extensions
  );
};


export interface ProblemJson {
  type?: string
  title: string
  status: number
  detail?: string
  instance?: string
  [key: string]: unknown
}

export interface ProblemJsonOptions {
  /**
   * 基础 URL，用于生成错误类型的链接
   * @example 'https://api.example.com/errors'
   */
  typeBaseUrl?: string

  /**
   * 是否在日志中显示完整的 Problem JSON
   * @default true
   */
  enabled?: boolean

  /**
   * 自定义格式化函数
   */
  format?: (error: unknown, request: Request) => ProblemJson | null
}

const isErrorWithStatus = (
  value: unknown
): value is { status: number } =>
  typeof value === 'object' &&
  value !== null &&
  'status' in value &&
  typeof (value as { status?: unknown }).status === 'number'

const isErrorLike = (value: unknown): value is Error =>
  value instanceof Error ||
  (typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof (value as { message?: unknown }).message === 'string')

/**
 * 将错误转换为 RFC 9457 Problem JSON 格式
 */
export function toProblemJson(
  error: unknown,
  request: Request,
  options: ProblemJsonOptions = {}
): ProblemJson {
  // 如果提供了自定义格式化函数，使用它
  if (options.format) {
    const custom = options.format(error, request)
    if (custom) {
      return custom
    }
  }

  const url = new URL(request.url)
  const status = isErrorWithStatus(error) ? error.status : 500
  const message = isErrorLike(error)
    ? error.message
    : String(error ?? 'Unknown Error')

  // 默认的 Problem JSON 结构
  const problem: ProblemJson = {
    type: options.typeBaseUrl
      ? `${options.typeBaseUrl}/${status}`
      : 'about:blank',
    title: getDefaultTitle(status),
    status,
    detail: message,
    instance: url.pathname + url.search
  }

  // 尝试从错误对象中提取额外的信息
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>

    // 如果错误已经有 Problem JSON 结构，直接使用
    if ('type' in err || 'title' in err) {
      if (err.type) problem.type = err.type as string
      if (err.title) problem.title = err.title as string
    }

    // 添加其他扩展字段（排除标准字段）
    for (const [key, value] of Object.entries(err)) {
      if (
        !['status', 'message', 'type', 'title', 'detail', 'instance'].includes(
          key
        )
      ) {
        problem[key] = value
      }
    }
  }

  return problem
}

/**
 * 根据状态码获取默认标题
 */
function getDefaultTitle(status: number): string {
  const titles: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    402: 'Payment Required',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    406: 'Not Acceptable',
    407: 'Proxy Authentication Required',
    408: 'Request Timeout',
    409: 'Conflict',
    410: 'Gone',
    411: 'Length Required',
    412: 'Precondition Failed',
    413: 'Payload Too Large',
    414: 'URI Too Long',
    415: 'Unsupported Media Type',
    416: 'Range Not Satisfiable',
    417: 'Expectation Failed',
    418: "I'm a teapot",
    422: 'Unprocessable Entity',
    423: 'Locked',
    424: 'Failed Dependency',
    425: 'Too Early',
    426: 'Upgrade Required',
    428: 'Precondition Required',
    429: 'Too Many Requests',
    431: 'Request Header Fields Too Large',
    451: 'Unavailable For Legal Reasons',
    500: 'Internal Server Error',
    501: 'Not Implemented',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
    505: 'HTTP Version Not Supported',
    506: 'Variant Also Negotiates',
    507: 'Insufficient Storage',
    508: 'Loop Detected',
    510: 'Not Extended',
    511: 'Network Authentication Required'
  }

  return titles[status] || 'Error'
}

/**
 * 将 Problem JSON 格式化为日志字符串
 */
export function formatProblemJsonLog(
  problem: ProblemJson,
  request: Request
): string {
  const url = new URL(request.url)
  const parts: string[] = []

  // 标题行
  const statusStr = problem.status.toString()
  const emoji = getStatusEmoji(problem.status)
  parts.push(
    `\n${emoji} [HTTP ${statusStr}] ${request.method} ${url.pathname}`
  )

  // Problem JSON 内容
  parts.push(`  Type:    ${problem.type}`)
  parts.push(`  Title:   ${problem.title}`)
  if (problem.detail) {
    parts.push(`  Detail:  ${problem.detail}`)
  }
  if (problem.instance) {
    parts.push(`  Instance: ${problem.instance}`)
  }

  // 扩展字段
  const extensions = Object.entries(problem).filter(
    ([key]) =>
      !['type', 'title', 'status', 'detail', 'instance'].includes(key)
  )
  if (extensions.length > 0) {
    parts.push('  Extensions:')
    for (const [key, value] of extensions) {
      parts.push(`    ${key}: ${JSON.stringify(value)}`)
    }
  }

  return parts.join('\n')
}

function getStatusEmoji(status: number): string {
  if (status >= 500) return '🔴'
  if (status >= 400) return '🟡'
  if (status >= 300) return '🔵'
  if (status >= 200) return '🟢'
  return '⚪'
}
