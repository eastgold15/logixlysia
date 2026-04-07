/**
 * 递归提取错误码
 * 沿 cause/error 链递归查找，支持被包装的底层错误（Postgres、MySQL、第三方库等）
 */
export const getErrorCode = (error: unknown): string | undefined => {
  if (typeof error !== "object" || error === null) return undefined;

  const obj = error as Record<string, unknown>;

  if ("code" in obj && typeof obj.code === "string") {
    return obj.code;
  }

  if ("cause" in obj) {
    return getErrorCode(obj.cause);
  }

  if ("error" in obj) {
    return getErrorCode(obj.error);
  }

  return undefined;
};

/** 从数据库错误中提取的结构化元数据 */
export interface ErrorMeta {
  /** 错误码（如 Postgres "23505"） */
  code: string;
  /** 列名（部分驱动提供） */
  column?: string;
  /** 约束名（如 "uk_site_product_slug"） */
  constraint?: string;
  /** 数据库原生详情（如 "Key (slug)=(xxx) already exists."） */
  detail?: string;
  /** 表名 */
  table?: string;
}

/**
 * 递归提取数据库错误的元数据
 * 从 Postgres / MySQL 等驱动的错误对象中提取 constraint、table、column、detail 等字段
 */
export const getErrorMeta = (error: unknown): ErrorMeta | undefined => {
  if (typeof error !== "object" || error === null) return undefined;

  const obj = error as Record<string, unknown>;

  if ("code" in obj && typeof obj.code === "string") {
    return {
      code: obj.code,
      column:
        "column" in obj && typeof obj.column === "string"
          ? obj.column
          : undefined,
      constraint:
        "constraint" in obj && typeof obj.constraint === "string"
          ? obj.constraint
          : undefined,
      detail:
        "detail" in obj && typeof obj.detail === "string"
          ? obj.detail
          : undefined,
      table:
        "table_name" in obj && typeof obj.table_name === "string"
          ? obj.table_name
          : "table" in obj && typeof obj.table === "string"
            ? obj.table
            : undefined,
    };
  }

  if ("cause" in obj) return getErrorMeta(obj.cause);
  if ("error" in obj) return getErrorMeta(obj.error);

  return undefined;
};
