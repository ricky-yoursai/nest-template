export class Result<T = any> {
  code: number; // 业务状态码
  message: string; // 提示信息
  data?: T; // 数据 payload，使用泛型
  timestamp: number; // 时间戳

  // 构造函数私有化，强制使用静态方法创建
  private constructor(code: number, message: string, data?: T) {
    this.code = code;
    this.message = message;
    this.data = data;
    this.timestamp = Date.now();
  }

  /**
   * 成功响应
   * @param object.data 数据
   * @param object.code 业务码，默认 200 或 0
   * @param object.message 消息，默认 'success'
   */
  static success<T>({ code = 200, message = 'success', data }: { code?: number; message?: string; data?: T } = {}): Result<T> {
    return new Result<T>(code, message, data);
  }

  /**
   * 失败响应
   * @param object.code 错误码
   * @param object.message 错误信息
   * @param object.data 可选的错误详情
   */
  static fail<T = null>({ code, message, data }: { code: number; message: string; data?: T }): Result<T> {
    return new Result<T>(code, message, data);
  }
}
