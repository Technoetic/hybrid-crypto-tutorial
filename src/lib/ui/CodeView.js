const SNIPPETS = {
  keygen: `// 1. Alice의 RSA 키쌍 생성
const keyPair = await crypto.subtle.generateKey(
  {
    name: 'RSA-OAEP',
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: 'SHA-256',
  },
  true,
  ['encrypt', 'decrypt']
);
// → keyPair.publicKey 는 모두에게 공유 가능 (자물쇠)
// → keyPair.privateKey 는 Alice만 보관   (열쇠)`,

  compose: `// 2. Bob이 보낼 평문 메시지
const plaintext = '안녕 Alice, 비밀 메시지야';
// (실제 앱: WhatsApp 입력창에 텍스트 입력)`,

  seal: `// 3-a. 1회용 AES-GCM 세션키 생성
const sessionKey = await crypto.subtle.generateKey(
  { name: 'AES-GCM', length: 256 },
  true,
  ['encrypt', 'decrypt']
);
const iv = crypto.getRandomValues(new Uint8Array(12));

// 3-b. 본문을 세션키로 빠르게 암호화 (DEM)
const ciphertext = await crypto.subtle.encrypt(
  { name: 'AES-GCM', iv },
  sessionKey,
  new TextEncoder().encode(plaintext)
);

// 3-c. 세션키 자체를 Alice 공개키로 봉인 (KEM)
const rawKey = await crypto.subtle.exportKey('raw', sessionKey);
const wrappedKey = await crypto.subtle.encrypt(
  { name: 'RSA-OAEP' },
  alicePublicKey,
  rawKey
);
// → 전송 패킷: { wrappedKey, iv, ciphertext }`,

  deliver: `// 4-a. Alice가 개인키로 봉인된 세션키를 해제
const rawBack = await crypto.subtle.decrypt(
  { name: 'RSA-OAEP' },
  alicePrivateKey,
  wrappedKey
);
const sessionKey = await crypto.subtle.importKey(
  'raw', rawBack, 'AES-GCM', false, ['decrypt']
);

// 4-b. 그 세션키로 본문 복호화
const plainBuf = await crypto.subtle.decrypt(
  { name: 'AES-GCM', iv },
  sessionKey,
  ciphertext
);
const plaintext = new TextDecoder().decode(plainBuf);
// → '안녕 Alice, 비밀 메시지야'`,
};

export class CodeView {
  constructor(rootEl) {
    this.root = rootEl;
  }

  show(stageId) {
    const code = SNIPPETS[stageId] ?? '';
    this.root.innerHTML = `<pre><code>${escapeHtml(code)}</code></pre>`;
  }

  static all() {
    return SNIPPETS;
  }
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
