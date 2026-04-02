// RFC 9457 Problem Details - https://www.rfc-editor.org/rfc/rfc9457.html

export interface ProblemDocument {
  detail?: string;
  instance?: string;
  status?: number;
  title: string;
  type: string;
  [key: string]: unknown;
}

/**
 * RFC 9457 Problem Details Error
 *
 * Core members:
 * - type: URI reference identifying the problem type (default "about:blank")
 * - title: Short human-readable summary
 * - status: HTTP status code
 * - detail: Human-readable explanation for this occurrence
 * - instance: URI reference identifying this specific occurrence
 * - extensions: Additional properties serialized as-is
 */
export class ProblemError extends Error {
  public readonly status: number;
  public readonly title: string;
  public readonly type: string;
  public readonly detail?: string;
  public readonly instance?: string;
  public readonly extensions?: Record<string, unknown>;

  constructor(
    type = "about:blank",
    title: string,
    status: number,
    detail?: string,
    instance?: string,
    extensions?: Record<string, unknown>
  ) {
    super(detail || title);
    Object.setPrototypeOf(this, ProblemError.prototype);

    this.status = status;
    this.title = title;
    this.type = type;
    this.detail = detail;
    this.instance = instance;
    this.extensions = extensions;
  }

  toJSON(): ProblemDocument {
    return {
      type: this.type,
      title: this.title,
      status: this.status,
      ...(this.detail ? { detail: this.detail } : {}),
      ...(this.instance ? { instance: this.instance } : {}),
      ...this.extensions,
    };
  }
}

// ==========================================
// Factory Function
// ==========================================

const DEFAULT_TITLES: Record<number, string> = {
  400: "Bad Request",
  401: "Unauthorized",
  402: "Payment Required",
  403: "Forbidden",
  404: "Not Found",
  405: "Method Not Allowed",
  406: "Not Acceptable",
  409: "Conflict",
  500: "Internal Server Error",
  501: "Not Implemented",
  502: "Bad Gateway",
  503: "Service Unavailable",
  504: "Gateway Timeout",
};

export interface ProblemConfig {
  detail?: string;
  extensions?: Record<string, unknown>;
  instance?: string;
  title?: string;
  type?: string;
}

/**
 * 工厂函数：根据 HTTP 状态码快速创建 ProblemError
 *
 * @example
 * throw createProblem(400, { detail: 'Invalid email' })
 * throw createProblem(409, { title: 'Duplicate', detail: 'Email already exists' })
 */
export const createProblem = (
  status: number,
  overrides?: ProblemConfig
): ProblemError => {
  const title = overrides?.title ?? DEFAULT_TITLES[status] ?? "Unknown Error";
  return new ProblemError(
    overrides?.type ?? `https://httpstatuses.com/${status}`,
    title,
    status,
    overrides?.detail,
    overrides?.instance,
    overrides?.extensions
  );
};

// ==========================================
// HttpError Namespace (convenience wrappers via createProblem)
// ==========================================

type HttpErrorFactory = (
  detail?: string,
  extensions?: Record<string, unknown>
) => ProblemError;

const factory =
  (status: number): HttpErrorFactory =>
  (detail, extensions) =>
    createProblem(status, { detail, extensions });

export interface HttpErrorConstructor {
  BadGateway: HttpErrorFactory;
  BadRequest: HttpErrorFactory;
  Conflict: HttpErrorFactory;
  Forbidden: HttpErrorFactory;
  GatewayTimeout: HttpErrorFactory;
  InternalServerError: HttpErrorFactory;
  MethodNotAllowed: HttpErrorFactory;
  NotAcceptable: HttpErrorFactory;
  NotFound: HttpErrorFactory;
  NotImplemented: HttpErrorFactory;
  PaymentRequired: HttpErrorFactory;
  ServiceUnavailable: HttpErrorFactory;
  Unauthorized: HttpErrorFactory;
}

export const HttpError: HttpErrorConstructor = {
  BadRequest: factory(400),
  Unauthorized: factory(401),
  PaymentRequired: factory(402),
  Forbidden: factory(403),
  NotFound: factory(404),
  MethodNotAllowed: factory(405),
  NotAcceptable: factory(406),
  Conflict: factory(409),
  InternalServerError: factory(500),
  NotImplemented: factory(501),
  BadGateway: factory(502),
  ServiceUnavailable: factory(503),
  GatewayTimeout: factory(504),
};
