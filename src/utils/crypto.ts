import { gcm } from "@noble/ciphers/aes.js";
import { randomBytes } from "@noble/ciphers/utils.js";

const IV_LENGTH = 12;
const SECRET_KEY_BASE64 = "UrOkTeAYoyhaVnSoDfx0fT52lbRIbBMisYqlUWiq+DY=";

/**
 * 将 Base64 字符串解码为 Uint8Array
 */
function base64ToBytes(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}

/**
 * 将 Uint8Array 编码为 Base64 字符串
 */
function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * 获取密钥字节
 */
function getKeyBytes(): Uint8Array {
  return base64ToBytes(SECRET_KEY_BASE64);
}

/**
 * 加密：明文 -> Base64(IV + 密文 + TAG)
 * 使用 @noble/ciphers 的纯 JS 实现，兼容 HTTP 环境
 */
export async function encrypt(plainText: string): Promise<string> {
  const key = getKeyBytes();
  const iv = randomBytes(IV_LENGTH);
  const encoded = new TextEncoder().encode(plainText);

  const aes = gcm(key, iv);
  const cipherText = aes.encrypt(encoded);

  // cipherText 包含密文 + 16字节 TAG
  const result = new Uint8Array(IV_LENGTH + cipherText.length);
  result.set(iv, 0);
  result.set(cipherText, IV_LENGTH);

  return bytesToBase64(result);
}

/**
 * 清理 Base64 字符串，兼容 Base64URL 格式
 */
function cleanBase64(str: string): string {
  // 去除首尾空白和引号
  let cleaned = str.trim().replace(/^["']|["']$/g, "");
  // 去除所有换行和空格
  cleaned = cleaned.replace(/[\s\r\n]/g, "");
  // Base64URL -> 标准 Base64（将 - 替换为 +，_ 替换为 /）
  cleaned = cleaned.replace(/-/g, "+").replace(/_/g, "/");
  // 补齐 Base64 填充
  const pad = cleaned.length % 4;
  if (pad) {
    cleaned += "=".repeat(4 - pad);
  }
  return cleaned;
}

/**
 * 解密：Base64(IV + 密文 + TAG) -> 明文
 * 使用 @noble/ciphers 的纯 JS 实现，兼容 HTTP 环境
 */
export async function decrypt(encryptedText: string): Promise<string> {
  const key = getKeyBytes();
  const cleaned = cleanBase64(encryptedText);
  const encryptedBytes = base64ToBytes(cleaned);

  const iv = encryptedBytes.slice(0, IV_LENGTH);
  const cipherText = encryptedBytes.slice(IV_LENGTH);

  const aes = gcm(key, iv);
  const plainBytes = aes.decrypt(cipherText);

  return new TextDecoder().decode(plainBytes);
}
