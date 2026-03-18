const IV_LENGTH = 12;
const TAG_LENGTH = 128;
const ALGORITHM = "AES-GCM";

let cryptoKey: CryptoKey | null = null;

/**
 * 初始化密钥（Base64 字符串）
 */
export async function initSecretKey(base64Key: string): Promise<CryptoKey> {
  const keyBytes = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
  cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: ALGORITHM, length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
  return cryptoKey;
}

async function ensureKey(): Promise<CryptoKey> {
  if (!cryptoKey) {
    await initSecretKey("UrOkTeAYoyhaVnSoDfx0fT52lbRIbBMisYqlUWiq+DY=");
  }
  return cryptoKey!;
}

/**
 * 加密：明文 -> Base64(IV + 密文)
 */
export async function encrypt(plainText: string): Promise<string> {
  const key = await ensureKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(plainText);

  const cipherText = await crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv,
      tagLength: TAG_LENGTH
    },
    key,
    encoded
  );

  const result = new Uint8Array(IV_LENGTH + cipherText.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(cipherText), IV_LENGTH);

  let binary = "";
  for (let i = 0; i < result.length; i++) {
    binary += String.fromCharCode(result[i]);
  }
  return btoa(binary);
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
 * 解密：Base64(IV + 密文) -> 明文
 */
export async function decrypt(encryptedText: string): Promise<string> {
  const key = await ensureKey();
  const cleaned = cleanBase64(encryptedText);
  console.log("清理后的 Base64 前20字符:", cleaned.substring(0, 20));
  const encryptedBytes = Uint8Array.from(atob(cleaned), c =>
    c.charCodeAt(0)
  );

  const iv = encryptedBytes.slice(0, IV_LENGTH);
  const cipherText = encryptedBytes.slice(IV_LENGTH);

  const plainBytes = await crypto.subtle.decrypt(
    {
      name: ALGORITHM,
      iv,
      tagLength: TAG_LENGTH
    },
    key,
    cipherText
  );

  return new TextDecoder().decode(plainBytes);
}
