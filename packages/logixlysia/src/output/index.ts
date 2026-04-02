import type { LogLevel, StoreData, Transport } from "../interfaces";

interface LogToTransportsInput {
  data: Record<string, unknown>;
  level: LogLevel;
  request: Request;
  store: StoreData;
  transports: Transport[];
}

export const logToTransports = (input: LogToTransportsInput): void => {
  const { level, request, data, store, transports } = input;
  if (transports.length === 0) {
    return;
  }

  const message = typeof data.message === "string" ? data.message : "";
  const meta: Record<string, unknown> = {
    request: {
      method: request.method,
      url: request.url,
    },
    ...data,
    beforeTime: store.beforeTime,
  };

  for (const transport of transports) {
    try {
      const result = transport.log(level, message, meta);
      if (
        result &&
        typeof (result as { catch?: unknown }).catch === "function"
      ) {
        (result as Promise<void>).catch(() => {
          // Ignore errors
        });
      }
    } catch {
      // Transport failures must never crash application logging.
    }
  }
};
