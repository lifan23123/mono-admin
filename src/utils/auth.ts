import Cookies from "js-cookie";
import { useUserStoreHook } from "@/store/modules/user";
import { storageLocal, isString, isIncludeAllChildren } from "@pureadmin/utils";

export const userKey = "user-info";
export const TokenKey = "authorized-token";
export const multipleTabsKey = "multiple-tabs";

/** 获取`token` */
export function getToken(): any {
  return storageLocal().getItem(TokenKey);
}

/**
 * @description 设置`token`以及一些必要信息
 */
export function setToken(data: any) {
  // 按照优先级从 data 字段中获取 token
  const accessToken =
    typeof data === "string"
      ? data
      : data.token || data.accessToken || data.authorization || "";

  if (accessToken) {
    storageLocal().setItem(TokenKey, { accessToken });
  }

  storageLocal().setItem(multipleTabsKey, "true");

  // 清除可能存在的旧 Cookie
  Cookies.remove(TokenKey);
  Cookies.remove(multipleTabsKey);

  function setUserKey(data: any) {
    const { loginName, name, id, companyId, loginIp, loginTime, state, createTime, updateTime } = data;
    const username = loginName || data.username || "";
    const nickname = name || data.nickname || "";
    const roles = (data.roles && data.roles.length > 0) ? data.roles : ["admin"]; 
    const permissions = (data.permissions && data.permissions.length > 0) ? data.permissions : ["*:*:*"]; 
    const avatar = data.avatar || "";

    useUserStoreHook().SET_AVATAR(avatar);
    useUserStoreHook().SET_USERNAME(username);
    useUserStoreHook().SET_NICKNAME(nickname);
    useUserStoreHook().SET_ROLES(roles);
    useUserStoreHook().SET_PERMS(permissions);

    // 存储完整的用户信息（除去 token 以外的字段）
    const userInfo = {
      id,
      loginName,
      name,
      companyId,
      loginIp,
      loginTime,
      state,
      createTime,
      updateTime,
      avatar,
      username,
      nickname,
      roles,
      permissions
    };
    storageLocal().setItem(userKey, userInfo);
  }

  if (data) {
    setUserKey(data);
  }
}

/** 删除`token`以及相关 localStorage 信息 */
export function removeToken() {
  storageLocal().removeItem(TokenKey);
  storageLocal().removeItem(multipleTabsKey);
  storageLocal().removeItem(userKey);
  Cookies.remove(TokenKey);
  Cookies.remove(multipleTabsKey);
}

/** 格式化token */
export const formatToken = (token: string): string => {
  return token;
};

/** 是否有按钮级别的权限 */
export const hasPerms = (value: string | Array<string>): boolean => {
  if (!value) return false;
  const allPerms = "*:*:*";
  const { permissions } = useUserStoreHook();
  if (!permissions) return false;
  if (permissions.length === 1 && permissions[0] === allPerms) return true;
  const isAuths = isString(value)
    ? permissions.includes(value)
    : isIncludeAllChildren(value, permissions);
  return isAuths ? true : false;
};
