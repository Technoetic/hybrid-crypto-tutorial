import { Cipher } from './lib/crypto/Cipher.js';
import { Envelope } from './lib/crypto/Envelope.js';
import { KeyPairManager } from './lib/crypto/KeyPairManager.js';
import { SessionKeyManager } from './lib/crypto/SessionKeyManager.js';
import { CodeView } from './lib/ui/CodeView.js';
import { EventBus } from './lib/ui/EventBus.js';
import { Stage } from './lib/ui/Stage.js';
import { bufToBase64, bufToHexGroups, truncate } from './lib/util/encoding.js';

class App {
  constructor() {
    this.bus = new EventBus();
    this.stage = new Stage(this.bus);
    this.kpm = new KeyPairManager();
    this.skm = new SessionKeyManager();

    this.state = {
      fingerprint: '',
      plaintext: '안녕 Alice! 이건 하이브리드 암호로 봉인된 비밀 메시지야.',
      sessionKey: null,
      iv: null,
      wrappedKey: null,
      ciphertext: null,
      decrypted: '',
    };

    this.els = this.queryEls();
    this.codeView = new CodeView(this.els.codeBody);

    this.bindEvents();
    this.bindBus();
    this.boot();
  }

  queryEls() {
    return {
      dots: document.querySelector('#stage-dots'),
      cards: {
        keygen: document.querySelector('#stage-1'),
        compose: document.querySelector('#stage-2'),
        seal: document.querySelector('#stage-3'),
        deliver: document.querySelector('#stage-4'),
      },
      statusTop: document.querySelector('#status-top'),
      statusSub: document.querySelector('#status-sub'),
      codeBody: document.querySelector('#code-body'),

      btnGenerate: document.querySelector('#btn-generate'),
      btnSeal: document.querySelector('#btn-seal'),
      btnReceive: document.querySelector('#btn-receive'),
      btnNext: document.querySelector('#btn-next'),
      btnReset: document.querySelector('#btn-reset'),

      textarea: document.querySelector('#plaintext'),

      keyFingerprint: document.querySelector('#key-fingerprint'),
      keyChips: document.querySelector('#key-chips'),

      sessionRaw: document.querySelector('#session-raw'),
      cipherBox: document.querySelector('#cipher-box'),
      wrappedBox: document.querySelector('#wrapped-box'),
      ivBox: document.querySelector('#iv-box'),

      resultBox: document.querySelector('#result-box'),
      flowCanvas: document.querySelector('#flow-canvas'),

      banner: document.querySelector('#banner'),
    };
  }

  bindEvents() {
    this.els.btnGenerate.addEventListener('click', () => this.runKeygen());
    this.els.btnSeal.addEventListener('click', () => this.runSeal());
    this.els.btnReceive.addEventListener('click', () => this.runDeliver());
    this.els.btnNext.addEventListener('click', () => this.advance());
    this.els.btnReset.addEventListener('click', () => this.reset());
    this.els.textarea.addEventListener('input', (e) => {
      this.state.plaintext = e.target.value;
      if (this.stage.current.id === 'compose') {
        this.els.btnNext.disabled = this.state.plaintext.trim().length === 0;
      }
    });
  }

  bindBus() {
    this.bus.on('stage:enter', ({ idx }) => this.onEnter(idx));
    this.bus.on('stage:complete', () => {
      this.renderDots();
      this.renderCards();
    });
    this.bus.on('error', ({ stage, message }) => {
      this.els.banner.hidden = false;
      this.els.banner.textContent = `❌ [${stage}] ${message} — 재시도하거나 처음부터 다시 시작하세요.`;
    });
    this.bus.on('stage:reset', () => {
      this.els.banner.hidden = true;
    });
  }

  boot() {
    if (!window.crypto?.subtle) {
      this.els.banner.hidden = false;
      this.els.banner.textContent =
        '❌ 이 브라우저는 Web Crypto API를 지원하지 않습니다. 최신 Chrome/Firefox/Safari로 다시 열어주세요.';
      return;
    }
    this.els.textarea.value = this.state.plaintext;
    this.stage.enter(0);
  }

  onEnter(idx) {
    const s = Stage.STAGES[idx];
    this.renderDots();
    this.renderCards();
    this.els.statusTop.textContent = s.ttl;
    this.els.statusSub.textContent = s.sub;
    this.codeView.show(s.id);
    this.updateActionStates(s.id);
    this.renderFlow(s.id);
    if (idx > 0) this.scrollActiveIntoView(s.id);
  }

  renderDots() {
    this.els.dots.innerHTML = Stage.STAGES.map((s, i) => {
      let cls = 'stage-dot';
      if (i === this.stage.index) cls += ' active';
      else if (this.stage.done.has(i)) cls += ' done';
      return `<span class="${cls}" aria-label="${s.ttl}" role="img"></span>`;
    }).join('');
  }

  renderCards() {
    for (let i = 0; i < Stage.STAGES.length; i++) {
      const s = Stage.STAGES[i];
      const card = this.els.cards[s.id];
      if (!card) continue;
      card.classList.toggle('active', i === this.stage.index);
      card.classList.toggle('done', this.stage.done.has(i) && i !== this.stage.index);
    }
  }

  scrollActiveIntoView(stageId) {
    const card = this.els.cards[stageId];
    if (!card) return;
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  updateActionStates(stageId) {
    const has = {
      keys: !!this.kpm.publicKey,
      msg: this.state.plaintext.trim().length > 0,
      sealed: !!this.state.ciphertext,
    };
    this.els.btnGenerate.disabled = stageId !== 'keygen';
    this.els.btnSeal.disabled = !(stageId === 'seal' && has.keys && has.msg);
    this.els.btnReceive.disabled = !(stageId === 'deliver' && has.sealed);

    const nextOk =
      (stageId === 'keygen' && has.keys) ||
      (stageId === 'compose' && has.msg) ||
      (stageId === 'seal' && has.sealed) ||
      (stageId === 'deliver' && this.state.decrypted.length > 0);
    this.els.btnNext.disabled = !nextOk;
    this.els.btnNext.textContent = stageId === 'deliver' ? '🎉 처음부터 다시' : '다음 단계 →';
  }

  async runKeygen() {
    this.els.btnGenerate.disabled = true;
    this.els.btnGenerate.textContent = '⏳ 생성 중…';
    try {
      await this.kpm.generate();
      this.state.fingerprint = await this.kpm.fingerprint();
      this.els.keyFingerprint.textContent = this.state.fingerprint;
      this.els.keyChips.innerHTML = `
        <span class="key-chip public">🔓 공개키 (모두에게 OK)</span>
        <span class="key-chip private">🔑 개인키 (Alice만)</span>`;
      this.stage.complete(0);
      this.updateActionStates('keygen');
    } catch (e) {
      this.bus.emit('error', { stage: 'keygen', message: e.message });
    } finally {
      this.els.btnGenerate.textContent = '🔧 키쌍 다시 생성';
    }
  }

  async runSeal() {
    this.els.btnSeal.disabled = true;
    this.els.btnSeal.textContent = '⏳ 봉인 중…';
    try {
      this.state.sessionKey = await this.skm.generate();
      this.state.iv = this.skm.generateIV();

      const cipher = new Cipher(this.state.sessionKey, this.state.iv);
      this.state.ciphertext = await cipher.encrypt(this.state.plaintext);

      const envelope = new Envelope(this.kpm.publicKey, null);
      this.state.wrappedKey = await envelope.wrap(this.state.sessionKey);

      const rawKey = await this.skm.exportRaw(this.state.sessionKey);
      this.els.sessionRaw.textContent = bufToHexGroups(rawKey, 2, 16);
      this.els.cipherBox.textContent = truncate(bufToBase64(this.state.ciphertext), 96, 16);
      this.els.wrappedBox.textContent = truncate(bufToBase64(this.state.wrappedKey), 96, 16);
      this.els.ivBox.textContent = bufToHexGroups(this.state.iv, 2, 12);
      this.stage.complete(2);
      this.renderFlow('seal');
      this.updateActionStates('seal');
    } catch (e) {
      this.bus.emit('error', { stage: 'seal', message: e.message });
    } finally {
      this.els.btnSeal.textContent = '🔒 봉인하기 (하이브리드)';
    }
  }

  async runDeliver() {
    this.els.btnReceive.disabled = true;
    this.els.btnReceive.textContent = '⏳ 해제 중…';
    try {
      const envelope = new Envelope(null, this.kpm.privateKey);
      const sessionKeyBack = await envelope.unwrap(this.state.wrappedKey);
      const cipher = new Cipher(sessionKeyBack, this.state.iv);
      this.state.decrypted = await cipher.decrypt(this.state.ciphertext);
      this.els.resultBox.textContent = this.state.decrypted;
      this.els.resultBox.hidden = false;
      this.stage.complete(3);
      this.renderFlow('deliver');
      this.updateActionStates('deliver');
    } catch (e) {
      this.bus.emit('error', { stage: 'deliver', message: e.message });
    } finally {
      this.els.btnReceive.textContent = '📬 Alice가 받기 · 열기';
    }
  }

  advance() {
    if (this.stage.current.id === 'deliver') return this.reset();
    this.stage.next();
  }

  reset() {
    this.state.sessionKey = null;
    this.state.iv = null;
    this.state.wrappedKey = null;
    this.state.ciphertext = null;
    this.state.decrypted = '';
    this.state.fingerprint = '';
    this.kpm.keyPair = null;
    this.els.keyFingerprint.textContent = '— 아직 생성되지 않음 —';
    this.els.keyChips.innerHTML = '';
    this.els.sessionRaw.textContent = '—';
    this.els.cipherBox.textContent = '—';
    this.els.wrappedBox.textContent = '—';
    this.els.ivBox.textContent = '—';
    this.els.resultBox.hidden = true;
    this.els.resultBox.textContent = '';
    this.els.btnGenerate.textContent = '🔧 키쌍 만들기';
    this.stage.reset();
    this.stage.enter(0);
  }

  renderFlow(stageId) {
    const canvas = this.els.flowCanvas;
    if (!canvas) return;
    if (stageId !== 'seal' && stageId !== 'deliver') {
      canvas.innerHTML = '';
      return;
    }
    if (stageId === 'seal') {
      canvas.innerHTML = `
        <div class="flow-track"></div>
        <div class="flow-node session" style="left: 22%;">⚷ AES 세션키</div>
        <div class="flow-node wrapped" style="left: 56%;">📦 RSA로 봉인된 세션키</div>
        <div class="flow-node" style="left: 88%;">🔒 본문은 AES로 봉인</div>`;
      return;
    }
    if (stageId === 'deliver') {
      canvas.innerHTML = `
        <div class="flow-track"></div>
        <div class="flow-node wrapped" style="left: 12%;">📦 봉인된 세션키 도착</div>
        <div class="flow-node session" style="left: 50%;">⚷ Alice 개인키로 해제</div>
        <div class="flow-node" style="left: 88%;">🔓 본문 복호 완료</div>`;
    }
  }
}

new App();
