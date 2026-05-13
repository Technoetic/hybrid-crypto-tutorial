export class SessionKeyManager {
  async generate() {
    return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
      'encrypt',
      'decrypt',
    ]);
  }

  generateIV() {
    return crypto.getRandomValues(new Uint8Array(12));
  }

  async exportRaw(key) {
    return crypto.subtle.exportKey('raw', key);
  }

  async importRaw(raw) {
    return crypto.subtle.importKey('raw', raw, 'AES-GCM', true, ['encrypt', 'decrypt']);
  }
}
