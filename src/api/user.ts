import { http } from "@/utils/http";

/** 登录 */
export const getLogin = (data?: object) => {
  return http.request<any>("post", "/api/imchat/imsusermanager/login", {
    data,
    responseType: "text"
  });
};

/** 平台数据统计 */
export const getPlatformDataStatistics = (data?: object) => {
  return http.request<any>("get", "/api/imchat/data/total", {
    data,
    responseType: "text"
  });
};

/** 子账号列表 */
export const getSubAccountList = (data?: object) => {
  return http.request<any>("post", "/api/imchat/imcompany/list", {
    data,
    responseType: "text"
  });
};

/** 子账号创建 */
export const getSubAccountCreate = (data?: object) => {
  return http.request<any>("post", "/api/imchat/imcompany/create", {
    data,
    responseType: "text"
  });
};

/** 子账号更新 */
export const getSubAccountUpdate = (data?: object) => {
  return http.request<any>("post", "/api/imchat/imcompany/update", {
    data,
    responseType: "text"
  });
};

/** 子账号删除 */
export const getSubAccountDelete = (data?: object) => {
  return http.request<any>("post", "/api/imchat/imcompany/del", {
    data,
    responseType: "text"
  });
};

/** 用户列表 */
export const getUserList = (data?: object) => {
  return http.request<any>("post", "/api/imchat/imsuser/list", {
    data,
    responseType: "text"
  });
};
