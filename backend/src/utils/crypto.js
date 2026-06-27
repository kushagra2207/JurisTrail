import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

const getEncryptionKey = () => {
  const key = process.env.DB_ENCRYPTION_KEY;
  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('DB_ENCRYPTION_KEY is required in production environment.');
    }
    // Fallback key: 32 bytes
    return Buffer.from('supersecretencryptionkey12345678', 'utf8');
  }
  
  // Derives a 32-byte key from the configured DB_ENCRYPTION_KEY
  return crypto.scryptSync(key, 'juris-trail-salt', 32);
};

/**
 * Encrypts a value (converts objects/arrays to JSON string first) using AES-256-GCM.
 * Returns an object with the encrypted ciphertext, iv, and tag.
 * @param {any} val
 * @returns {object|null}
 */
export const encrypt = (val) => {
  if (val === null || val === undefined) return val;
  
  const text = typeof val === 'string' ? val : JSON.stringify(val);
  const iv = crypto.randomBytes(12); // GCM standard IV size is 12 bytes
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let ciphertext = cipher.update(text, 'utf8', 'hex');
  ciphertext += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  
  return {
    encrypted: true,
    ciphertext,
    iv: iv.toString('hex'),
    tag: tag
  };
};

/**
 * Decrypts an encrypted GCM payload. If the data does not appear to be encrypted,
 * it returns the parsed JSON or plain value.
 * @param {any} data
 * @returns {any}
 */
export const decrypt = (data) => {
  if (!data) return data;
  
  // Check if it's our encrypted schema
  if (typeof data === 'object' && data.encrypted === true) {
    try {
      const key = getEncryptionKey();
      const iv = Buffer.from(data.iv, 'hex');
      const tag = Buffer.from(data.tag, 'hex');
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(tag);
      
      let decrypted = decipher.update(data.ciphertext, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted;
      }
    } catch (err) {
      console.error('Decryption failed:', err.message);
      return null;
    }
  }
  
  // Backward compatibility: If the database value is a plain JSON string, parse it.
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }
  
  return data;
};
