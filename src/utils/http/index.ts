import Axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type CustomParamsSerializer
} from "axios";
import type {
  PureHttpError,
  RequestMethods,
  PureHttpResponse,
  PureHttpRequestConfig
} from "./types.d";
import { stringify } from "qs";
import { getToken, formatToken } from "@/utils/auth";
import { useUserStoreHook } from "@/store/modules/user";
import { decrypt, encrypt } from "@/utils/crypto";
import { message } from "@/utils/message";

// 相关配置请参考：www.axios-js.com/zh-cn/docs/#axios-request-config-1
const defaultConfig: AxiosRequestConfig = {
  // 请求超时时间
  timeout: 20000,
  headers: {
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/json",
    'companyId': '1',
    // "X-Requested-With": "XMLHttpRequest"
  },
  // 数组格式参数序列化（https://github.com/axios/axios/issues/5142）
  paramsSerializer: {
    serialize: stringify as unknown as CustomParamsSerializer
  }
};

// 错误处理策略配置（可扩展）
const errorHandlers: Record<number, (error: any) => void> = {
  400: () => message("请求参数错误", { type: "error" }),
  401: () => {
    message("登录已过期，请重新登录", { type: "error" });
    useUserStoreHook().logOut();
  },
  403: () => message("没有权限访问", { type: "error" }),
  404: () => message("请求的资源不存在", { type: "error" }),
  500: () => message("服务器错误", { type: "error" }),
  502: () => message("网关错误", { type: "error" }),
  503: () => message("服务不可用", { type: "error" })
};

// 统一错误处理函数（可扩展）
function handleHttpError(error: PureHttpError): void {
  // 取消请求不提示
  if (error.isCancelRequest) return;

  const status = error.response?.status;
  const errorMsg = error.response?.data?.message || error.message;

  // 执行状态码对应的处理器
  if (status && errorHandlers[status]) {
    errorHandlers[status](error);
  } else if (errorMsg) {
    // 显示后端返回的错误信息
    message(errorMsg, { type: "error" });
  } else if (error.code === "ECONNABORTED") {
    message("请求超时，请稍后重试", { type: "error" });
  } else if (!window.navigator.onLine) {
    message("网络连接失败，请检查网络", { type: "error" });
  } else {
    message("请求失败，请稍后重试", { type: "error" });
  }
}

class PureHttp {
  constructor() {
    this.httpInterceptorsRequest();
    this.httpInterceptorsResponse();
  }

  /** `token`过期后，暂存待执行的请求 */
  private static requests = [];

  /** 防止重复刷新`token` */
  private static isRefreshing = false;

  /** 初始化配置对象 */
  private static initConfig: PureHttpRequestConfig = {};

  /** 保存当前`Axios`实例对象 */
  private static axiosInstance: AxiosInstance = Axios.create(defaultConfig);

  /** 重连原始请求 */
  private static retryOriginalRequest(config: PureHttpRequestConfig) {
    return new Promise(resolve => {
      PureHttp.requests.push((token: string) => {
        config.headers["Authorization"] = formatToken(token);
        resolve(config);
      });
    });
  }

  /** 请求拦截 */
  private httpInterceptorsRequest(): void {
    PureHttp.axiosInstance.interceptors.request.use(
      async (config: PureHttpRequestConfig): Promise<any> => {
        // 优先判断post/get等方法是否传入回调，否则执行初始化设置等回调
        if (typeof config.beforeRequestCallback === "function") {
          config.beforeRequestCallback(config);
          return config;
        }
        if (PureHttp.initConfig.beforeRequestCallback) {
          PureHttp.initConfig.beforeRequestCallback(config);
          return config;
        }

        // 加密请求数据
        if (config.data && typeof config.data === "object") {
          try {
            const jsonStr = JSON.stringify(config.data);
            const encrypted = await encrypt(jsonStr);
            config.data = encrypted;
            // 防止 axios 默认 transformRequest 对字符串做额外处理
            config.transformRequest = [data => data];
            console.log("[DEBUG] 加密前:", jsonStr);
            console.log("[DEBUG] 加密后:", encrypted);
            console.log("[DEBUG] 请求头:", JSON.stringify(config.headers));
          } catch (e) {
            console.error("Request encryption failed", e);
          }
        }

        /** 请求白名单，放置一些不需要`token`的接口（通过设置请求白名单，防止`token`过期后再请求造成的死循环问题） */
        const whiteList = ["/refresh-token", "/login", "/imchat/imsusermanager/login"];
        return whiteList.some(url => config.url.endsWith(url))
          ? config
          : new Promise(resolve => {
            const data = getToken();
            if (data) {
              const now = new Date().getTime();
              const expired = parseInt(data.expires) - now <= 0;
              if (expired) {
                if (!PureHttp.isRefreshing) {
                  PureHttp.isRefreshing = true;
                  // token过期刷新
                  useUserStoreHook()
                    .handRefreshToken({ refreshToken: data.refreshToken })
                    .then(res => {
                      const token = res.data.accessToken;
                      config.headers["Authorization"] = formatToken(token);
                      PureHttp.requests.forEach(cb => cb(token));
                      PureHttp.requests = [];
                    })
                    .finally(() => {
                      PureHttp.isRefreshing = false;
                    });
                }
                resolve(PureHttp.retryOriginalRequest(config));
              } else {
                config.headers["Authorization"] = formatToken(
                  data.accessToken
                );
                resolve(config);
              }
            } else {
              resolve(config);
            }
          });
      },
      error => {
        return Promise.reject(error);
      }
    );
  }

  /** 响应拦截 */
  private httpInterceptorsResponse(): void {
    const instance = PureHttp.axiosInstance;
    instance.interceptors.response.use(
      async (response: PureHttpResponse) => {
        const $config = response.config;
        // 优先判断post/get等方法是否传入回调，否则执行初始化设置等回调
        if (typeof $config.beforeResponseCallback === "function") {
          $config.beforeResponseCallback(response);
          return response.data;
        }
        if (PureHttp.initConfig.beforeResponseCallback) {
          PureHttp.initConfig.beforeResponseCallback(response);
          return response.data;
        }

        let data = response.data;
        // 如果数据是字符串且不是由 transformResponse 处理过的（或者哪怕处理过仍是加密串）
        // 统一在拦截器处理解密
        if (typeof data === "string" && data.length > 0) {
          try {
            const decrypted = await decrypt(data);
            console.log("解密后的数据:", decrypted);
            data = JSON.parse(decrypted);
          } catch (e) {
            // 如果尝试解密或解析失败，说明可能不是加密串，保持原样
            console.warn("Global decryption failed, using original data", e);
          }
        }

        // // 检查业务状态码
        // if (data && typeof data === "object" && data.success === false) {
        //   const error: any = new Error(data.message || "请求失败");
        //   error.response = response;
        //   error.response.data = data;
        //   return Promise.reject(error);
        // }

        return data;
      },
      (error: PureHttpError) => {
        const $error = error;
        $error.isCancelRequest = Axios.isCancel($error);
        // 统一错误处理
        handleHttpError($error);
        // 所有的响应异常 区分来源为取消请求/非取消请求
        return Promise.reject($error);
      }
    );
  }

  /** 通用请求工具函数 */
  public request<T>(
    method: RequestMethods,
    url: string,
    param?: AxiosRequestConfig,
    axiosConfig?: PureHttpRequestConfig
  ): Promise<T> {
    const config = {
      method,
      url,
      ...param,
      ...axiosConfig
    } as PureHttpRequestConfig;

    // 单独处理自定义请求/响应回调
    return new Promise((resolve, reject) => {
      PureHttp.axiosInstance
        .request(config)
        .then((response: undefined) => {
          resolve(response);
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  /** 单独抽离的`post`工具函数 */
  public post<T, P>(
    url: string,
    params?: AxiosRequestConfig<P>,
    config?: PureHttpRequestConfig
  ): Promise<T> {
    return this.request<T>("post", url, params, config);
  }

  /** 单独抽离的`get`工具函数 */
  public get<T, P>(
    url: string,
    params?: AxiosRequestConfig<P>,
    config?: PureHttpRequestConfig
  ): Promise<T> {
    return this.request<T>("get", url, params, config);
  }
}

export const http = new PureHttp();
