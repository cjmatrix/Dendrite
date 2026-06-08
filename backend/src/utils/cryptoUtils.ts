import crypto from "crypto";

const getSecretKey = () => {
  const secret = process.env.BYOK_SECRET_KEY || "default_development_secret_key_32";
  if (secret.length < 32) {
    return Buffer.concat([Buffer.from(secret), Buffer.alloc(32 - secret.length)]);
  }
  return Buffer.from(secret.substring(0, 32));
};

export const encryptKey = (text: string): string => {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", getSecretKey(), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
  } catch (err) {
    console.error("Encryption error", err);
    return "";
  }
};

export const decryptKey = (text: string): string => {
  try {
    const textParts = text.split(":");
    const iv = Buffer.from(textParts.shift()!, "hex");
    const encryptedText = Buffer.from(textParts.join(":"), "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", getSecretKey(), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (err) {
    console.error("Decryption error", err);
    return "";
  }
};
