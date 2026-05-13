import { bufToText, textToBuf } from '../util/encoding.js';

export class Cipher {
  constructor(sessionKey, iv) {
    this.sessionKey = sessionKey;
    this.iv = iv;
  }

  async encrypt(plaintext) {
    return crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: this.iv },
      this.sessionKey,
      textToBuf(plaintext),
    );
  }

  async decrypt(ciphertext) {
    const buf = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: this.iv },
      this.sessionKey,
      ciphertext,
    );
    return bufToText(buf);
  }
}
