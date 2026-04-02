/**
 * 分层错误解析 — 将任意错误转换为 RFC 9457 ProblemError
 *
 * 解析顺序（第一层返回非 void 即停止）：
 *   Layer 1: 已是 ProblemError → 直接返回
 *   Layer 2: 用户 resolve() 回调 → 完全自定义
 *   Layer 3: VALIDATION → 字段级 ProblemError
 *   Layer 4: errorMap 查表（递归 getErrorCode）→ 数据库/第三方错误映射
 *   Layer 5: Elysia 内置错误码（NOT_FOUND / PARSE / ...）
 *   Layer 6: Fallback → 500
 */

import {
  createProblem,
  type ProblemConfig,
  ProblemError,
} from "../error/errors";
import type { Code } from "../error/type";
import type { ErrorMapping, ErrorResolver } from "../interfaces";
import { getErrorCode } from "./get-error-code";

// Layer 5: Elysia 内置错误码映射
const CODE_MAP: Record<
  string,
  { status: number; title: string; detail?: string }
> = {
  VALIDATION: { status: 400, title: "Validation Failed" },
  NOT_FOUND: { status: 404, title: "Resource Not Found" },
  PARSE: {
    status: 400,
    title: "Invalid Payload",
    detail: "The request body could not be parsed as valid JSON.",
  },
  INVALID_COOKIE_SIGNATURE: { status: 401, title: "Invalid Credentials" },
  INTERNAL_SERVER_ERROR: { status: 500, title: "Internal Server Error" },
};

interface NormalizeOptions {
  errorMap?: Record<string, ErrorMapping>;
  request?: Request;
  resolve?: ErrorResolver;
  typeBaseUrl?: string;
}

export const normalizeToProblem = (
  error: unknown,
  code: Code,
  path: string,
  options: NormalizeOptions = {}
): ProblemError => {
  const { typeBaseUrl = "about:blank", errorMap, resolve, request } = options;
  const buildType = (suffix: string) =>
    typeBaseUrl === "about:blank" ? typeBaseUrl : `${typeBaseUrl}/${suffix}`;

  // ==========================================
  // Layer 1: 已是 ProblemError
  // ==========================================
  if (error instanceof ProblemError) {
    if (error.instance) return error;
    return new ProblemError(
      error.type,
      error.title,
      error.status,
      error.detail,
      path,
      error.extensions
    );
  }

  // ==========================================
  // Layer 2: 用户 resolve() 回调
  // ==========================================
  if (resolve && request) {
    const resolved = resolve(error, { code, path, request });
    if (resolved instanceof ProblemError) return resolved;
  }

  // ==========================================
  // Layer 3: VALIDATION — 字段级详情
  // ==========================================
  if (code === "VALIDATION") {
    const validationError = error as {
      all?: Array<{ path: string; summary?: string; message: string }>;
    };
    return createProblem(400, {
      title: "Validation Failed",
      detail: "One or more fields failed validation",
      type: buildType("validation"),
      instance: path,
      extensions: {
        errors:
          validationError.all?.map((err) => ({
            field: err.path.replace(/^\//, ""),
            message: err.summary || err.message,
          })) ?? [],
      },
    });
  }

  // ==========================================
  // Layer 4: errorMap 查表（递归 getErrorCode）
  // ==========================================
  if (errorMap) {
    const errorCode = getErrorCode(error);
    if (errorCode && errorCode in errorMap) {
      const mapping = errorMap[errorCode];
      return createProblem(mapping.status, {
        title: mapping.title,
        detail: mapping.detail,
        type: buildType(errorCode),
        instance: path,
      });
    }
  }

  // ==========================================
  // Layer 5: Elysia 内置错误码
  // ==========================================
  const builtIn = CODE_MAP[code as string];
  if (builtIn) {
    const detail =
      builtIn.detail ??
      (error instanceof Error ? error.message : String(error));
    return createProblem(builtIn.status, {
      title: builtIn.title,
      detail,
      type: buildType(String(code)),
      instance: path,
    });
  }

  // ==========================================
  // Layer 6: Fallback
  // ==========================================
  const detail = error instanceof Error ? error.message : String(error);
  const fallbackStatus =
    typeof (error as Record<string, unknown>)?.status === "number"
      ? (error as { status: number }).status
      : 500;
  const fallbackConfig: ProblemConfig = {
    detail,
    type: buildType("unknown"),
    instance: path,
  };
  if (fallbackStatus !== 500) {
    fallbackConfig.title = undefined; // createProblem 会用 DEFAULT_TITLES 自动补全
  }
  return createProblem(fallbackStatus, fallbackConfig);
};
