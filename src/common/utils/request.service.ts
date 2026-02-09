import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

@Injectable()
export class RequestService {
  public readonly instance: AxiosInstance;
  private readonly logger = new Logger(RequestService.name);

  constructor(private configService: ConfigService) {
    // 1. 读取配置
    const isProxy = this.configService.get<string>('IS_PROXY') === 'true'; // 注意大小写建议统一
    const rawProxyUrl = this.configService.get<string>('PROXY_URL');
    // HttpsProxyAgent 需要一个合法的 URL，这里自动补全协议前缀，避免出现 "127.0.0.1:7890" 这样的 ERR_INVALID_URL
    const proxyUrl =
      (rawProxyUrl &&
        (rawProxyUrl.startsWith('http://') || rawProxyUrl.startsWith('https://')
          ? rawProxyUrl
          : `http://${rawProxyUrl}`)) ||
      'http://127.0.0.1:7890';

    const axiosConfig: AxiosRequestConfig = {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // 2. 处理代理
    if (isProxy) {
      this.logger.warn(`🚀 Proxy Enabled: ${proxyUrl}`);
      const agent = new HttpsProxyAgent(proxyUrl);
      axiosConfig.httpAgent = agent;
      axiosConfig.httpsAgent = agent;
      axiosConfig.proxy = false;
    } else {
      this.logger.log('✅ Proxy Disabled: Direct Connect');
    }

    // 3. 初始化实例
    this.instance = axios.create(axiosConfig);

    // 4. 挂载拦截器
    this.setupInterceptors();
  }

  // ==========================================
  // 👇 常用方法封装 (使用泛型 T 定义返回类型)
  // ==========================================

  /**
   * GET 请求
   * @param url 请求地址
   * @param config 配置 (params 等)
   */
  public get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.get(url, config);
  }

  /**
   * POST 请求
   * @param url 请求地址
   * @param data 请求体
   * @param config 配置
   */
  public post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.post(url, data, config);
  }

  /**
   * PUT 请求
   * @param url 请求地址
   * @param data 请求体
   * @param config 配置
   */
  public put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.put(url, data, config);
  }

  /**
   * DELETE 请求
   * @param url 请求地址
   * @param config 配置 (data 可以放在 config.data 里)
   */
  public delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.delete(url, config);
  }

  /**
   * PATCH 请求
   */
  public patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.patch(url, data, config);
  }

  // ==========================================
  // 👇 private
  // ==========================================

  private setupInterceptors() {
    // 响应拦截器：
    // 作用：直接返回 response.data，这样你在业务层 await request.get() 拿到的直接就是数据，
    // 而不是 { data: {...}, status: 200, headers: ... } 这种包裹层。
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        return response.data;
      },
      (error) => {
        // 可以在这里统一打印错误日志
        this.logger.error(`Request Error: ${error.message}`);
        return Promise.reject(error);
      },
    );
  }
}
