/**
 * 扩展 Express Request，将 auth 挂到全局类型上
 * 与 jwt-parse.middleware 中赋值的 req.auth 一致（可为 User 实例或至少含 id 的鉴权信息）
 */
export interface RequestAuth {
  id: string;
  userId?: string;
  username?: string;
  role?: string;
  jui?: string;
}

declare global {
  namespace Express {
    interface Request {
      auth?: RequestAuth;
    }
  }
}

export {};
