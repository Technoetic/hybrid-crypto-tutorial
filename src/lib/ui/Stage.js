export class Stage {
  static STAGES = [
    { id: 'keygen', ttl: '1. 키쌍 생성', sub: 'Alice가 자기 자물쇠/열쇠를 만듭니다' },
    { id: 'compose', ttl: '2. 메시지 작성', sub: 'Bob이 보낼 메시지를 입력합니다' },
    {
      id: 'seal',
      ttl: '3. 봉인(하이브리드)',
      sub: 'AES 세션키로 본문을 잠그고, 그 세션키를 Alice 공개키로 또 잠급니다',
    },
    { id: 'deliver', ttl: '4. 전송·복호화', sub: 'Alice가 개인키로 봉인을 풀고 메시지를 읽습니다' },
  ];

  constructor(bus) {
    this.bus = bus;
    this.index = 0;
    this.done = new Set();
  }

  get current() {
    return Stage.STAGES[this.index];
  }

  enter(idx) {
    if (idx < 0 || idx >= Stage.STAGES.length) return;
    this.index = idx;
    this.bus.emit('stage:enter', { idx, stage: this.current });
  }

  complete(idx) {
    this.done.add(idx);
    this.bus.emit('stage:complete', { idx, stage: Stage.STAGES[idx] });
  }

  next() {
    if (this.index < Stage.STAGES.length - 1) this.enter(this.index + 1);
    else this.bus.emit('stage:finish');
  }

  reset() {
    this.index = 0;
    this.done.clear();
    this.bus.emit('stage:reset');
  }
}
