import axios from "axios";
import { getUploadToken } from "@/api/user";

export interface QiniuTokenInfo {
  token: string;
  domain: string;
}

/**
 * 获取七牛云上传 Token 和访问域名
 */
export async function getQiniuUploadToken(): Promise<QiniuTokenInfo> {
  const res = await getUploadToken();
  const resData = (res as any)?.data || res;
  let token = "";
  let domain = "";

  if (typeof resData === "string") {
    token = resData;
  } else if (typeof resData === "object" && resData !== null) {
    token =
      resData.token ||
      resData.uploadToken ||
      resData.accessToken ||
      resData.data ||
      "";
    domain = resData.domain || resData.url || resData.qiniuDomain || "";
  }

  if (!token) {
    throw new Error("获取七牛上传 Token 失败");
  }

  return { token, domain };
}

/**
 * 通用上传图片/文件至七牛云
 * @param file 待上传的文件对象 (File 或 Blob)
 * @param folder 自定义存储目录前缀，默认 'image'
 * @returns 返回上传成功后的完整访问 URL
 */
export async function uploadToQiniu(
  file: File | Blob,
  folder = "image"
): Promise<string> {
  // 1. 获取七牛 Token 与域名
  const { token, domain } = await getQiniuUploadToken();

  // 2. 构造上传 FormData
  const fileName = (file as File).name || "image.png";
  const ext = fileName.includes(".")
    ? fileName.substring(fileName.lastIndexOf("."))
    : ".png";
  const key = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("token", token);
  formData.append("key", key);

  // 3. 上传到七牛云（多节点容错）
  const uploadUrls = [
    "https://upload.qiniup.com",
    "https://up.qiniup.com",
    "https://upload-z2.qiniup.com",
    "https://upload-z1.qiniup.com"
  ];

  let uploadSuccess = false;
  let uploadedKey = key;

  for (const upUrl of uploadUrls) {
    try {
      const uploadRes = await axios.post(upUrl, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (uploadRes.data && (uploadRes.data.key || uploadRes.data.hash)) {
        uploadedKey = uploadRes.data.key || key;
        uploadSuccess = true;
        break;
      }
    } catch (e) {
      console.warn(`Upload to ${upUrl} failed:`, e);
    }
  }

  if (!uploadSuccess) {
    throw new Error("上传图片至七牛云失败");
  }

  // 4. 拼接最终访问 URL
  if (domain) {
    const cleanDomain = domain.startsWith("http")
      ? domain.replace(/\/$/, "")
      : `https://${domain.replace(/\/$/, "")}`;
    return `${cleanDomain}/${uploadedKey.replace(/^\//, "")}`;
  } else {
    return uploadedKey.startsWith("http") ? uploadedKey : `/${uploadedKey}`;
  }
}
