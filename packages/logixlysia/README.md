<div align="center">
  <h1><code>🦊</code> Logixlysia</h1>
  <strong>Logixlysia is a logging library for ElysiaJS</strong>
  <img src="https://github.com/PunGrumpy/logixlysia/blob/main/apps/docs/app/opengraph-image.png?raw=true" alt="Logixlysia" width="100%" height="auto" />
</div>

## `📩` Installation

```bash
bun add logixlysia
```

## `📝` Usage

### Basic

```ts
import { Elysia } from 'elysia'
import logixlysia from 'logixlysia'

const app = new Elysia()
  .use(logixlysia())
  .get('/', () => 'Hello World')
  .listen(3000)
```

### With Configuration

```ts
app.use(logixlysia({
  startup: {
    show: true,
    format: 'simple',
  },
  format: {
    timestamp: 'yyyy-mm-dd HH:MM:ss.SSS',
    showIp: true,
    template: '🦊 {now} {level} {duration} {method} {pathname} {status} {message} {ip}',
  },
  file: {
    path: './logs/example.log',
    rotation: {
      maxSize: '10m',
      maxFiles: 7,
      compress: true,
    },
  },
  logLevel: ['ERROR', 'WARNING'],
}))
```

## `⚙️` Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `startup.show` | `boolean` | `true` | Show startup message |
| `startup.format` | `"simple" \| "banner"` | `"banner"` | Startup message style |
| `format.colors` | `boolean` | `true` (TTY) | Enable colored output |
| `format.timestamp` | `string` | — | Timestamp format pattern (e.g. `'yyyy-mm-dd HH:MM:ss.SSS'`) |
| `format.template` | `string` | — | Custom log format template |
| `format.showIp` | `boolean` | `false` | Show IP address in logs |
| `logLevel` | `LogLevel \| LogLevel[]` | — | Filter logs by level(s) |
| `file` | `false \| { path, rotation? }` | — | File logging config (`false` to disable) |
| `file.path` | `string` | — | Log file path (required when file logging enabled) |
| `file.rotation` | `LogRotationConfig` | — | Log file rotation settings |
| `transports` | `Transport[] \| { targets, only? }` | — | Custom transports |
| `pino` | `PinoLoggerOptions` | — | Pino logger options |
| `error.typeBaseUrl` | `string` | — | Base URL for error types (RFC 9457) |
| `error.errorMap` | `Record<string, ErrorMapping>` | — | Error code to HTTP status mapping |
| `error.resolve` | `ErrorResolver` | — | Custom error resolver function |
| `error.verbose` | `boolean` | `false` | Show full error details in console |

## `📚` Documentation

Check out the [website](https://logixlysia.vercel.app) for more detailed documentation and examples.

## `📄` License

Licensed under the [MIT License](LICENSE).
