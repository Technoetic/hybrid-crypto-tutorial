import { SessionKeyManager } from './SessionKeyManager.js';

export class Envelope {
  constructor(rsaPublicKey, rsaPrivateKey) {
    this.publicKey = rsaPublicKey;
    this.privateKey = rsaPrivateKey;
    this.sessionMgr = new SessionKeyManager();
  }

  async wrap(sessionKey) {
    const raw = await this.sessionMgr.exportRaw(sessionKey);
    return crypto.subtle.encrypt({ name: 'RSA-OAEP' }, this.publicKey, raw);
  }

  async unwrap(wrappedBuf) {
    const raw = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, this.privateKey, wrappedBuf);
    return this.sessionMgr.importRaw(raw);
  }
}
