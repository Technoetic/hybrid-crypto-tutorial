import { Stage } from './Stage.js';

const LOCK_SVG_LOCKED = `
<svg class="lock-svg locked" viewBox="0 0 48 56" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path class="shackle" d="M14 22 V14 a10 10 0 0 1 20 0 V22"/>
  <rect class="body" x="8" y="22" width="32" height="28" rx="3"/>
  <circle class="body-text" cx="24" cy="34" r="3"/>
  <rect class="body-text" x="22.5" y="34" width="3" height="9" rx="1"/>
</svg>`;

const LOCK_SVG_UNLOCKED = `
<svg class="lock-svg unlocked" viewBox="0 0 48 56" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path class="shackle" d="M14 22 V14 a10 10 0 0 1 20 0 V18"/>
  <rect class="body" x="8" y="22" width="32" height="28" rx="3"/>
  <circle class="body-text" cx="24" cy="34" r="3"/>
  <rect class="body-text" x="22.5" y="34" width="3" height="9" rx="1"/>
</svg>`;

export class Visualizer {
  constructor({ dots, peerBob, peerAlice, flow, statusTop, statusSub }) {
    this.els = { dots, peerBob, peerAlice, flow, statusTop, statusSub };
  }

  renderDots(currentIdx, doneSet) {
    this.els.dots.innerHTML = Stage.STAGES.map((s, i) => {
      let cls = 'stage-dot';
      if (i === currentIdx) cls += ' active';
      else if (doneSet.has(i)) cls += ' done';
      return `<span class="${cls}" aria-label="${s.ttl}" role="img"></span>`;
    }).join('');
  }

  setActive(stageId) {
    this.els.peerBob.classList.toggle('active', stageId === 'compose' || stageId === 'seal');
    this.els.peerAlice.classList.toggle('active', stageId === 'keygen' || stageId === 'deliver');
    this.els.flow.classList.toggle('active', stageId === 'seal' || stageId === 'deliver');
  }

  status(top, sub) {
    this.els.statusTop.textContent = top;
    this.els.statusSub.textContent = sub;
  }

  static lockHtml(state) {
    return state === 'locked' ? LOCK_SVG_LOCKED : LOCK_SVG_UNLOCKED;
  }
}
