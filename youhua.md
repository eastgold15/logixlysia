1. 架构 / 逻辑问题
1.1 handle-http-error.ts 中无用的 string 类型判断
handle-http-error.ts:44-45 中对 request 做了 typeof request === 'string' 的判断，但参数类型声明为 Request，永远不会是 string。应该删除这些无用分支。

1.2 handleHttpError 和 log 职责重叠
logger/index.ts:51-107 的 log 函数和 handle-http-error.ts 都包含了相同的逻辑流程：transports → file → console。应该抽取一个统一的输出管道函数来避免重复。

1.3 文件日志配置检查重复
useTransportsOnly / disableFileLogging 的判断逻辑在以下三处重复：

logger/index.ts:64-77
handle-http-error.ts:25-31
output/file.ts:59-61
应该统一到一处。

2. 重复 / 无用代码
2.1 pad2 函数重复定义
create-logger.ts:5 和 rotation-manager.ts:14 各自定义了相同的 pad2 函数。应提取到 utils/ 中。

2.2 utils/error.ts 似乎未被使用
utils/error.ts 中的 parseError 没有被任何文件引用。如果确认没用，可以删除。

2.3 toProblemJson / formatProblemJsonLog 与 normalizeToProblem 功能重叠
utils/handle-error.ts 中同时存在两套错误处理方案：

normalizeToProblem — 在 onError 钩子中使用，实际在用
toProblemJson / formatProblemJsonLog — 导出了但主流程没有使用
另外 getDefaultTitle 定义了两份映射表（DEFAULT_TITLES 8 个状态码，getDefaultTitle 34 个状态码），应合并。

2.4 Error/type.ts 中的 HttpProblemJsonOptions 未被使用
Error/type.ts:24-49 中定义了 transform 和 onBeforeRespond 钩子，但实际没有被消费。ErrorContext 的 error 和 code 字段也没被用到。

2.5 RequestInfo 类型别名多余
interfaces.ts:11 中 type RequestInfo = Request 只是 Request 的别名，没有增加语义价值，可以直接用 Request。

3. 类型安全
3.1 normalizeToProblem 参数类型为 any
handle-error.ts:24 的 error 参数声明为 any，应改为 unknown。

4. 性能优化
4.1 每次请求重复创建 new URL(request.url)
formatLine (create-logger.ts:190)、logToFile (file.ts:71)、handle-http-error.ts (handle-http-error.ts:49) 都在各自创建 new URL(request.url)。应该在请求入口（onRequest）解析一次 pathname，存在 store 中复用。

4.2 STATUS_BY_NORMALIZED_NAME 可提升为模块级常量（已经是了，OK）
5. 目录命名不一致

src/Error/        ← 大写开头
src/extensions/   ← 小写
src/helpers/      ← 小写
src/logger/       ← 小写
src/output/       ← 小写
src/utils/        ← 小写
应统一为小写 src/error/。

6. 依赖优化
6.1 elysia 在 devDependencies 和 peerDependencies 中重复
package.json 中 elysia 同时出现在 devDependencies（^1.4.19）和 peerDependencies（^1.4.19）。当前分支 refactor/elysia-peer-dependencies 看起来就在处理这个。

6.2 pino-pretty 应为 optional dependency
pino-pretty 只在 prettyPrint: true 时使用，作为生产依赖会强制所有用户安装。应改为 peerDependencies 或 optionalDependencies。

7. 重载函数模式过度
logToTransports (output/index.ts:11-26) 和 logToFile (file.ts:16-55) 都使用了位置参数 + 对象参数的重载模式。但实际调用方全部使用对象参数形式。位置参数的重载可以移除，简化代码。

总结优先级
优先级	优化项	预期收益
高	统一输出管道，消除 log / handleHttpError 重复	维护性大幅提升
高	删除无用代码（parseError、toProblemJson、HttpProblemJsonOptions）	减少包体积和认知负担
高	error: any → unknown	类型安全
中	缓存 URL 解析，一次 onRequest 解析	减少每请求 GC 压力
中	移除函数重载模式	简化代码
中	Error/ → error/ 统一命名	一致性
低	提取 pad2 到 utils	消除重复
低	pino-pretty 改为 optional	减少用户安装负担