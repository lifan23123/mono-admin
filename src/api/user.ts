import { http } from "@/utils/http";

/** 登录 */
export const getLogin = (data?: object) => {
  return http.request<any>("post", "/imchat/imsusermanager/login", {
    data,
    responseType: "text"
  });
};

/** 平台数据统计 */
export const getPlatformDataStatistics = (data?: object) => {
  return http.request<any>("get", "/imchat/data/total", {
    data,
    responseType: "text"
  });
};

/** 子账号列表 */
export const getSubAccountList = (data?: object) => {
  return http.request<any>("post", "/imchat/imcompany/list", {
    data,
    responseType: "text"
  });
};

/** 子账号创建 */
export const getSubAccountCreate = (data?: object) => {
  return http.request<any>("post", "/imchat/imcompany/create", {
    data,
    responseType: "text"
  });
};

/** 子账号更新 */
export const getSubAccountUpdate = (data?: object) => {
  return http.request<any>("post", "/imchat/imcompany/update", {
    data,
    responseType: "text"
  });
};

/** 子账号删除 */
export const getSubAccountDelete = (data?: object) => {
  return http.request<any>("post", "/imchat/imcompany/del", {
    data,
    responseType: "text"
  });
};

/** 用户列表 */
export const getUserList = (data?: object) => {
  return http.request<any>("post", "/imchat/imsuser/list", {
    data,
    responseType: "text"
  });
};

/** 用户更新 */
export const getUserUpdate = (data?: object) => {
  return http.request<any>("post", "/imchat/imsuser/update", {
    data,
    responseType: "text"
  });
};

/** 群管理-发现管理列表 */
export const getGroupDiscoveryList = (data?: object) => {
  return http.request<any>("post", "/imchat/imfaxian/list", {
    data,
    responseType: "text"
  });
};

/** 群管理-发现管理新增 */
export const getGroupDiscoveryAdd = (data?: object) => {
  return http.request<any>("post", "/imchat/imfaxian/create", {
    data,
    responseType: "text"
  });
};

/** 群管理-发现管理更新 */
export const getGroupDiscoveryUpdate = (data?: object) => {
  return http.request<any>("post", "/imchat/imfaxian/update", {
    data,
    responseType: "text"
  });
};

/** 群管理-发现管理删除 */
export const getGroupDiscoveryDelete = (data?: object) => {
  return http.request<any>("post", "/imchat/imfaxian/del", {
    data,
    responseType: "text"
  });
};

/** 聊天列表 */
export const getChatList = (data?: object) => {
  return http.request<any>("post", "/imchat/imchatmanager/list", {
    data,
    responseType: "text"
  });
};

/** 聊天记录详情 */
export const getChatRecord = (data?: object) => {
  return http.request<any>("post", "/imchat/immessage/all/list", {
    data,
    responseType: "text"
  });
};

/** 后台用户管理 */
export const getBackstageUserList = (data?: object) => {
  return http.request<any>("post", "/imchat/imsusermanager/list", {
    data,
    responseType: "text"
  });
};

/** 后台用户更新 */
export const getBackstageUserUpdate = (data?: object) => {
  return http.request<any>("post", "/imchat/imsusermanager/update", {
    data,
    responseType: "text"
  });
};

/** 后台登录日志 */
export const getBackstageLoginLogList = (data?: object) => {
  return http.request<any>("post", "/imchat/imloginlog/list", {
    data,
    responseType: "text"
  });
};

/** 域名推送 */
export const pushAllHost = (data?: object) => {
  return http.request<any>("post", "/imchat/imsuser/pushAllHost", {
    data,
    responseType: "text"
  });
};

/** 获取七牛域名 */
export const getQiNiuDomain = (data?: object) => {
  return http.request<any>("get", "/imchat/immessage/image/token", {
    data,
    responseType: "text"
  });
};

/** 群管理更新 */
export const getChatUpdate = (data?: object) => {
  return http.request<any>("post", "/imchat/imchatmanager/update", {
    data,
    responseType: "text"
  });
};

/** 配置保存 */
export const getConfigUpdate = (data?: object) => {
  return http.request<any>("post", "/imchat/imconfig/create", {
    data,
    responseType: "text"
  });
};

/** 配置详情 */
export const getConfigDetail = (data?: object) => {
  return http.request<any>("post", "/imchat/imconfig/detail", {
    data,
    responseType: "text"
  });
};

/** 公告列表 */
export const getAnnouncementList = (data?: object) => {
  return http.request<any>("post", "/imchat/imgonggao/list", {
    data,
    responseType: "text"
  });
};

/** 公告创建 */
export const getAnnouncementCreate = (data?: object) => {
  return http.request<any>("post", "/imchat/imgonggao/create", {
    data,
    responseType: "text"
  });
};

/** 公告更新 */
export const getAnnouncementUpdate = (data?: object) => {
  return http.request<any>("post", "/imchat/imgonggao/update", {
    data,
    responseType: "text"
  });
};

/** 公告删除 */
export const getAnnouncementDelete = (data?: object) => {
  return http.request<any>("post", "/imchat/imgonggao/del", {
    data,
    responseType: "text"
  });
};

/** 公告详情 */
export const getAnnouncementDetail = (data?: object) => {
  return http.request<any>("post", "/imchat/imgonggao/detail", {
    data,
    responseType: "text"
  });
};

/** 获取上传七牛token */
export const getUploadToken = (data?: object) => {
  return http.request<any>("get", "/imchat/immessage/image/token", {
    data,
    responseType: "text"
  });
};

/** 表情列表 */
export const getEmojiList = (data?: object) => {
  return http.request<any>("post", "/imchat/imbiaoqingmain/list", {
    data,
    responseType: "text"
  });
};

/** 表情创建 */
export const createEmoji = (data?: FormData | object) => {
  return http.request<any>("post", "/imchat/imbiaoqingmain/create", {
    data,
    responseType: "text"
  });
};

/** 表情更新 */
export const updateEmoji = (data?: FormData | object) => {
  return http.request<any>("post", "/imchat/imbiaoqingmain/update", {
    data,
    responseType: "text"
  });
};

/** 表情删除 */
export const deleteEmoji = (data?: object) => {
  return http.request<any>("post", "/imchat/imbiaoqingmain/del", {
    data,
    responseType: "text"
  });
};

/** 表情详情列表 (子表情列表) */
export const getEmojiDetailList = (data?: object) => {
  return http.request<any>("post", "/imchat/imbiaoqingmain/list/list", {
    data,
    responseType: "text"
  });
};

/** 表情详情项删除 (删除单个子表情) */
export const deleteEmojiDetailItem = (data?: object) => {
  return http.request<any>("post", "/imchat/imbiaoqingmain/list/del", {
    data,
    responseType: "text"
  });
};

/** 表情详情项创建 (新增单个表情) */
export const createEmojiDetailItem = (data?: object) => {
  return http.request<any>("post", "/imchat/imbiaoqingmain/list/create", {
    data,
    responseType: "text"
  });
};

/** 帖子列表 */
export const getPostList = (data?: object) => {
  return http.request<any>("post", "/imchat/immoment/all/list", {
    data,
    responseType: "text"
  });
};

/** 修改用户状态（封号/解封） */
export const updateUserState = (data?: object) => {
  return http.request<any>("post", "/imchat/imsuser/state", {
    data,
    responseType: "text"
  });
};

/** 帖子评论分页列表 */
export const getPostReplyPage = (data?: object) => {
  return http.request<any>("post", "/imchat/immoment/reply/page", {
    data,
    responseType: "text"
  });
};

/** 删除帖子评论 */
export const deletePostReply = (data?: object) => {
  return http.request<any>("post", "/imchat/immoment/del/reply", {
    data,
    responseType: "text"
  });
};

/** 删除帖子 */
export const deletePost = (data?: object) => {
  return http.request<any>("post", "/imchat/immoment/del", {
    data,
    responseType: "text"
  });
};




