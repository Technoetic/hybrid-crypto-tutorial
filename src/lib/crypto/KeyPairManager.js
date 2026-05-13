import { bufToHexGroups } from '../util/encoding.js';

export class KeyPairManager {
  constructor() {
    this.keyPair = null;
  }

  async generate({ modulusLength = 2048 } = {}) {
    this.keyPair = await crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true,
      ['encrypt', 'decrypt'],
    );
    return this.keyPair;
  }

  get publicKey() {
    return this.keyPair?.publicKey ?? null;
  }

  get privateKey() {
    return this.keyPair?.privateKey ?? null;
  }

  async exportPublic(format = 'spki') {
    return crypto.subtle.exportKey(format, this.publicKey);
  }

  async exportPrivate(format = 'pkcs8') {
    return crypto.subtle.exportKey(format, this.privateKey);
  }

  async fingerprint() {
    const spki = await this.exportPublic('spki');
    const digest = await crypto.subtle.digest('SHA-256', spki);
    return bufToHexGroups(digest, 2, 12);
  }
}
