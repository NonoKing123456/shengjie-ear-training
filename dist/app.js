const STORAGE_KEY = 'shengjie-ear-training-history-v1';
const SESSION_LENGTH = 10;

const intervalBank = [
  { id: 'm2', name: '小二度', semitones: 1 }, { id: 'M2', name: '大二度', semitones: 2 },
  { id: 'm3', name: '小三度', semitones: 3 }, { id: 'M3', name: '大三度', semitones: 4 },
  { id: 'P4', name: '纯四度', semitones: 5 }, { id: 'TT', name: '增四度', semitones: 6 },
  { id: 'P5', name: '纯五度', semitones: 7 }, { id: 'm6', name: '小六度', semitones: 8 },
  { id: 'M6', name: '大六度', semitones: 9 }, { id: 'm7', name: '小七度', semitones: 10 },
  { id: 'M7', name: '大七度', semitones: 11 }, { id: 'P8', name: '纯八度', semitones: 12 }
];

const progressionBank = [
  { id: 'I-V-vi-IV', name: 'I–V–vi–IV', subtitle: '流行进行', degrees: [0, 4, 5, 3] },
  { id: 'I-IV-V-I', name: 'I–IV–V–I', subtitle: '正格终止', degrees: [0, 3, 4, 0] },
  { id: 'ii-V-I', name: 'ii–V–I', subtitle: '爵士终止', degrees: [1, 4, 0] },
  { id: 'I-vi-IV-V', name: 'I–vi–IV–V', subtitle: '50 年代进行', degrees: [0, 5, 3, 4] },
  { id: 'vi-IV-I-V', name: 'vi–IV–I–V', subtitle: '小调起始', degrees: [5, 3, 0, 4] },
  { id: 'I-V-IV-I', name: 'I–V–IV–I', subtitle: '摇滚进行', degrees: [0, 4, 3, 0] }
];

const difficultyOptions = {
  interval: {
    foundation: ['M2', 'M3', 'P4', 'P5', 'P8'],
    standard: ['m2', 'M2', 'm3', 'M3', 'P4', 'P5', 'm6', 'M6'],
    advanced: intervalBank.map((item) => item.id)
  },
  progression: {
    foundation: ['I-IV-V-I', 'I-V-vi-IV', 'I-vi-IV-V'],
    standard: ['I-V-vi-IV', 'I-IV-V-I', 'ii-V-I', 'I-vi-IV-V'],
    advanced: progressionBank.map((item) => item.id)
  }
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const state = {
  mode: 'interval', difficulty: 'standard', question: null, index: 0, correct: 0,
  streak: 0, maxStreak: 0, answers: [], startedAt: null, questionStartedAt: null,
  locked: false, timerId: null, audioContext: null
};

function historyData() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}

function saveHistory(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, 200)));
}

function optionsFor(mode = state.mode, difficulty = state.difficulty) {
  const bank = mode === 'interval' ? intervalBank : progressionBank;
  const allowed = difficultyOptions[mode][difficulty];
  return bank.filter((item) => allowed.includes(item.id));
}

function randomItem(items, excludeId) {
  const choices = items.filter((item) => item.id !== excludeId);
  return choices[Math.floor(Math.random() * choices.length)] || items[0];
}

function newQuestion() {
  state.locked = false;
  state.question = randomItem(optionsFor(), state.question?.id);
  state.questionStartedAt = Date.now();
  renderQuestion();
}

function resetSession() {
  clearInterval(state.timerId);
  Object.assign(state, { question: null, index: 0, correct: 0, streak: 0, maxStreak: 0, answers: [], startedAt: null, questionStartedAt: null, locked: false, timerId: null });
  $('#timer').textContent = '00:00';
  $('#feedback-bar').className = 'feedback-bar';
  $('#feedback-text').textContent = '播放题目后选择答案';
  newQuestion();
  updateLiveStats();
}

function ensureSessionStarted() {
  if (state.startedAt) return;
  state.startedAt = Date.now();
  state.questionStartedAt = Date.now();
  state.timerId = setInterval(updateTimer, 1000);
}

function renderQuestion() {
  const isInterval = state.mode === 'interval';
  $('#question-kicker').textContent = `${isInterval ? 'INTERVAL' : 'CHORD PROGRESSION'} · ${String(state.index + 1).padStart(2, '0')}`;
  $('#question-title').textContent = isInterval ? '听辨这两个音的距离' : '识别这段和弦进行';
  $('#question-note').textContent = isInterval ? '音符将依次播放，可随时重新聆听。' : '和弦将在同一调内依次播放，可重复聆听。';
  $('#question-number').textContent = String(state.index + 1);
  const grid = $('#answer-grid');
  grid.innerHTML = '';
  optionsFor().forEach((option, index) => {
    const button = document.createElement('button');
    button.dataset.answer = option.id;
    button.innerHTML = `<span>${option.name}${option.subtitle ? `<small>${option.subtitle}</small>` : ''}</span><kbd>${index + 1}</kbd>`;
    button.addEventListener('click', () => submitAnswer(option.id, button));
    grid.appendChild(button);
  });
}

async function audioContext() {
  if (!state.audioContext) state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  if (state.audioContext.state === 'suspended') await state.audioContext.resume();
  return state.audioContext;
}

function midiToHz(midi) { return 440 * (2 ** ((midi - 69) / 12)); }

function tone(ctx, midi, start, duration, volume = 0.18) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.value = midiToHz(midi);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.025);
  gain.gain.setValueAtTime(volume, start + Math.max(.04, duration - .1));
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start); osc.stop(start + duration + .03);
}

async function playQuestion() {
  if (!state.question) return;
  ensureSessionStarted();
  const ctx = await audioContext();
  const playButton = $('#play-question');
  const wave = $('.wave');
  playButton.classList.add('is-playing'); wave.classList.add('is-playing');
  playButton.querySelector('.play-icon').textContent = '■';
  if (state.mode === 'interval') {
    const root = 52 + Math.floor(Math.random() * 10);
    const now = ctx.currentTime + .05;
    tone(ctx, root, now, .65); tone(ctx, root + state.question.semitones, now + .78, .75);
    setTimeout(stopAnimation, 1650);
  } else {
    const now = ctx.currentTime + .05;
    const scale = [0, 2, 4, 5, 7, 9, 11];
    state.question.degrees.forEach((degree, index) => {
      const chordStart = now + index * .78;
      [degree, (degree + 2) % 7, (degree + 4) % 7].forEach((scaleDegree, noteIndex) => {
        const octave = scaleDegree < degree ? 12 : 0;
        tone(ctx, 48 + scale[scaleDegree] + octave, chordStart, .68, .085 - noteIndex * .008);
      });
    });
    setTimeout(stopAnimation, state.question.degrees.length * 780 + 150);
  }
  function stopAnimation() {
    playButton.classList.remove('is-playing'); wave.classList.remove('is-playing');
    playButton.querySelector('.play-icon').textContent = '▶';
  }
}

function submitAnswer(answerId, button) {
  if (state.locked || !state.question) return;
  ensureSessionStarted();
  state.locked = true;
  const correct = answerId === state.question.id;
  const elapsed = Date.now() - state.questionStartedAt;
  state.correct += correct ? 1 : 0;
  state.streak = correct ? state.streak + 1 : 0;
  state.maxStreak = Math.max(state.maxStreak, state.streak);
  state.answers.push({ question: state.question.id, answer: answerId, correct, elapsed });
  $$('#answer-grid button').forEach((item) => {
    item.disabled = true;
    if (item.dataset.answer === state.question.id) item.classList.add('correct');
  });
  if (!correct) button.classList.add('wrong');
  $('#feedback-bar').className = `feedback-bar ${correct ? 'is-correct' : 'is-wrong'}`;
  $('#feedback-text').textContent = correct ? `正确 · ${state.question.name}` : `答案是 ${state.question.name}`;
  updateLiveStats();
  setTimeout(() => {
    state.index += 1;
    if (state.index >= SESSION_LENGTH) finishSession(); else {
      $('#feedback-bar').className = 'feedback-bar';
      $('#feedback-text').textContent = '下一题已准备好';
      newQuestion(); updateLiveStats();
    }
  }, 1050);
}

function updateTimer() {
  if (!state.startedAt) return;
  const seconds = Math.floor((Date.now() - state.startedAt) / 1000);
  $('#timer').textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function updateLiveStats() {
  const answered = state.answers.length;
  const score = answered ? Math.round((state.correct / answered) * 100) : 0;
  $('#live-score').textContent = answered ? score : '—';
  $('.score-ring').style.setProperty('--score', score);
  $('#correct-count').textContent = String(state.correct);
  $('#streak-count').textContent = String(state.streak);
  $('#progress-copy').textContent = `${answered} / ${SESSION_LENGTH}`;
  $('.progress-track i').style.width = `${answered / SESSION_LENGTH * 100}%`;
}

function finishSession() {
  clearInterval(state.timerId);
  const endedAt = Date.now();
  const score = Math.round((state.correct / SESSION_LENGTH) * 100);
  const averageResponseMs = Math.round(state.answers.reduce((sum, item) => sum + item.elapsed, 0) / state.answers.length);
  const record = {
    id: crypto.randomUUID ? crypto.randomUUID() : `${endedAt}-${Math.random()}`,
    mode: state.mode, difficulty: state.difficulty, score, correct: state.correct,
    total: SESSION_LENGTH, maxStreak: state.maxStreak, averageResponseMs,
    durationSeconds: Math.round((endedAt - state.startedAt) / 1000), createdAt: new Date().toISOString(), answers: state.answers
  };
  saveHistory([record, ...historyData()]);
  $('#dialog-score').textContent = String(score);
  $('#dialog-summary').textContent = score >= 80 ? `答对 ${state.correct} 题，表现稳定。继续保持！` : `答对 ${state.correct} 题，重复练习会让听感更清晰。`;
  $('#session-dialog').showModal();
  renderHistory(); renderReport();
}

function formatDate(iso) {
  return new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

function formatDuration(seconds) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function renderHistory() {
  const all = historyData();
  const filter = $('#history-filter').value;
  const records = filter === 'all' ? all : all.filter((item) => item.mode === filter);
  const average = records.length ? Math.round(records.reduce((sum, item) => sum + item.score, 0) / records.length) : 0;
  const best = records.length ? Math.max(...records.map((item) => item.score)) : 0;
  const latest = records.slice(0, 3);
  const previous = records.slice(3, 6);
  const latestAvg = latest.length ? latest.reduce((sum, item) => sum + item.score, 0) / latest.length : 0;
  const previousAvg = previous.length ? previous.reduce((sum, item) => sum + item.score, 0) / previous.length : latestAvg;
  const improvement = Math.round(latestAvg - previousAvg);
  $('#history-summary').innerHTML = [
    ['完成测试', records.length, '轮'], ['平均准确率', `${average}%`, improvement ? `${improvement > 0 ? '+' : ''}${improvement}% 近期变化` : '等待更多数据'],
    ['最佳成绩', `${best}%`, best >= 80 ? '状态出色' : '继续积累'], ['累计答题', records.reduce((sum, item) => sum + item.total, 0), '题']
  ].map(([label, value, note]) => `<div class="summary-card"><span>${label}</span><strong>${value}</strong><em>${note}</em></div>`).join('');
  renderTrend(records.slice(0, 12).reverse());
  $('#records-list').innerHTML = records.length ? records.map((record) => `
    <article class="record-row">
      <div class="record-mode"><span class="record-icon">${record.mode === 'interval' ? '↕' : '♬'}</span><div>${record.mode === 'interval' ? '音程辨认' : '和弦进行'}<div class="record-meta">${{ foundation:'基础',standard:'标准',advanced:'进阶' }[record.difficulty]} · ${record.correct}/${record.total} 正确</div></div></div>
      <div class="record-date">${formatDate(record.createdAt)}</div><div class="record-meta">用时 ${formatDuration(record.durationSeconds)}</div><div class="record-score">${record.score} 分</div>
    </article>`).join('') : '<div class="empty-state"><strong>还没有测试记录</strong>完成一轮 10 题训练后，成绩会自动保存在这里。</div>';
}

function renderTrend(records) {
  const container = $('#trend-chart');
  if (!records.length) { container.innerHTML = '<div class="empty-state"><strong>趋势正在等待你的第一次训练</strong>完成测试后会生成进步曲线。</div>'; return; }
  const w = 900, h = 220, pad = 34;
  const x = (i) => records.length === 1 ? w / 2 : pad + i * ((w - pad * 2) / (records.length - 1));
  const y = (score) => h - pad - (score / 100) * (h - pad * 2);
  const points = records.map((item, index) => `${x(index)},${y(item.score)}`).join(' ');
  const area = `${x(0)},${h-pad} ${points} ${x(records.length-1)},${h-pad}`;
  container.innerHTML = `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="训练准确率折线图">
    <defs><linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#caff58" stop-opacity=".22"/><stop offset="1" stop-color="#caff58" stop-opacity="0"/></linearGradient></defs>
    ${[0,25,50,75,100].map((v) => `<line class="chart-grid" x1="${pad}" y1="${y(v)}" x2="${w-pad}" y2="${y(v)}"/><text class="chart-label" x="0" y="${y(v)+4}">${v}</text>`).join('')}
    <polygon class="chart-area" points="${area}"/><polyline class="chart-line" points="${points}"/>
    ${records.map((item,index) => `<circle class="chart-point" cx="${x(index)}" cy="${y(item.score)}" r="5"><title>${item.score} 分 · ${formatDate(item.createdAt)}</title></circle>`).join('')}
  </svg>`;
}

function renderReport() {
  const records = historyData();
  const byMode = (mode) => records.filter((item) => item.mode === mode);
  const avg = (items) => items.length ? items.reduce((sum, item) => sum + item.score, 0) / items.length : 0;
  const intervalScore = Math.round(avg(byMode('interval')));
  const progressionScore = Math.round(avg(byMode('progression')));
  const overallAccuracy = Math.round(avg(records));
  const responseScore = records.length ? Math.max(0, Math.min(100, Math.round(120 - records.reduce((sum, item) => sum + item.averageResponseMs, 0) / records.length / 100))) : 0;
  const recent = records.slice(0, 5).map((item) => item.score);
  const consistency = recent.length > 1 ? Math.max(0, Math.round(100 - Math.sqrt(recent.reduce((sum, value) => sum + (value - avg(recent)) ** 2, 0) / recent.length) * 2.2)) : (recent.length ? 70 : 0);
  const breadth = Math.min(100, records.length * 6 + (byMode('interval').length && byMode('progression').length ? 20 : 0));
  const overall = records.length ? Math.round(overallAccuracy * .65 + consistency * .2 + breadth * .15) : 0;
  const level = overall >= 90 ? '敏锐听辨者' : overall >= 75 ? '稳定进阶者' : overall >= 60 ? '基础扎实' : overall > 0 ? '听感建立中' : '等待首次测试';
  $('#ability-score').textContent = records.length ? String(overall) : '—';
  $('.ability-score').style.setProperty('--score', overall);
  $('#ability-level').textContent = level;
  $('#ability-summary').textContent = records.length ? `你的总体准确率为 ${overallAccuracy}%，近期稳定性 ${consistency} 分。综合评分会随着训练样本增加而更准确。` : '完成一轮训练后，这里会给出你的能力概览。';
  $('#report-subtitle').textContent = records.length ? `基于 ${records.length} 次测试、${records.reduce((s,r)=>s+r.total,0)} 道题动态生成。` : '根据全部历史测试动态生成。';
  $('#skill-list').innerHTML = [
    ['音程辨认', intervalScore, byMode('interval').length], ['和弦进行', progressionScore, byMode('progression').length], ['反应速度', responseScore, records.length], ['稳定性', consistency, records.length]
  ].map(([name, score, count]) => `<div class="skill-item"><div class="skill-head"><span>${name}${count ? '' : ' · 暂无数据'}</span><strong>${count ? score : '—'}</strong></div><div class="skill-track"><i style="width:${count ? score : 0}%"></i></div></div>`).join('');
  const bestStreak = records.length ? Math.max(...records.map((item) => item.maxStreak)) : 0;
  const totalMinutes = Math.round(records.reduce((sum, item) => sum + item.durationSeconds, 0) / 60);
  $('#report-stats').innerHTML = [['总体准确率',records.length?`${overallAccuracy}%`:'—'],['训练轮次',records.length],['最佳连续答对',bestStreak],['累计训练',`${totalMinutes} 分钟`]].map(([label,value])=>`<div class="report-stat"><span>${label}</span><strong>${value}</strong></div>`).join('');
  const weaker = intervalScore && progressionScore ? (intervalScore <= progressionScore ? '音程辨认' : '和弦进行') : (!intervalScore ? '音程辨认' : '和弦进行');
  const advice = records.length ? [
    [`优先练习${weaker}`, `这个分项目前提升空间更大。建议连续完成 3 轮基础或标准难度，再观察准确率变化。`],
    ['先准确，再提速', responseScore < 70 ? '目前反应时间偏长，先建立稳定听觉参照，再尝试更快作答。' : '反应速度良好，可以在进阶难度下继续提高辨识精度。'],
    ['建立固定参照', '每天用纯五度、纯四度和 I–V–I 作为听觉锚点，能帮助其他音程与功能和声归类。'],
    ['保持短时高频', '每次 5–10 分钟、每周至少 4 次，通常比一次长时间训练更容易形成长期听觉记忆。']
  ] : [['完成第一次基准测试','先选择任一训练模式完成 10 道题，报告会据此建立初始能力基线。'],['两类训练都要覆盖','音程与和声能力互相支持，各完成一轮可获得更完整的综合评分。']];
  $('#insight-list').innerHTML = advice.map(([title,text])=>`<div class="insight-item"><strong>${title}</strong><p>${text}</p></div>`).join('');
}

function switchView(view) {
  $$('.nav-item').forEach((item) => item.classList.toggle('is-active', item.dataset.view === view));
  $$('.view').forEach((item) => item.classList.toggle('is-active', item.id === `${view}-view`));
  if (view === 'history') renderHistory();
  if (view === 'report') renderReport();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

$$('.nav-item').forEach((button) => button.addEventListener('click', () => switchView(button.dataset.view)));
$$('.mode-tab').forEach((button) => button.addEventListener('click', () => {
  state.mode = button.dataset.mode;
  $$('.mode-tab').forEach((item) => { const active = item === button; item.classList.toggle('is-active', active); item.setAttribute('aria-selected', String(active)); });
  resetSession();
}));
$('#difficulty-select').addEventListener('change', (event) => { state.difficulty = event.target.value; resetSession(); });
$('#restart-session').addEventListener('click', resetSession);
$('#play-question').addEventListener('click', playQuestion);
$('#history-filter').addEventListener('change', renderHistory);
$('#print-report').addEventListener('click', () => window.print());
$('#dialog-close').addEventListener('click', () => $('#session-dialog').close());
$('#train-again').addEventListener('click', () => { $('#session-dialog').close(); resetSession(); });
$('#view-report').addEventListener('click', () => { $('#session-dialog').close(); switchView('report'); });
$('#export-history').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), sessions: historyData() }, null, 2)], { type: 'application/json' });
  const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `shengjie-history-${new Date().toISOString().slice(0,10)}.json`; link.click(); URL.revokeObjectURL(link.href);
});
document.addEventListener('keydown', (event) => {
  if (event.target.matches('select,button') && event.code !== 'Space') return;
  if (event.code === 'Space') { event.preventDefault(); playQuestion(); return; }
  const index = Number(event.key) - 1;
  const buttons = $$('#answer-grid button');
  if (index >= 0 && index < buttons.length) buttons[index].click();
});

function registerWebMCPTools() {
  const context = document.modelContext;
  if (!context?.registerTool) return;
  const register = (tool) => Promise.resolve(context.registerTool(tool)).catch((error) => console.warn('WebMCP tool registration failed', error));
  register({
    name: 'configure_training',
    title: '配置练耳训练',
    description: '切换到指定训练类型和难度，并开始一轮新的 10 题测试。',
    inputSchema: {
      type: 'object',
      properties: {
        mode: { type: 'string', enum: ['interval', 'progression'] },
        difficulty: { type: 'string', enum: ['foundation', 'standard', 'advanced'] }
      },
      required: ['mode', 'difficulty'],
      additionalProperties: false
    },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute(input) {
      if (!['interval', 'progression'].includes(input?.mode) || !['foundation', 'standard', 'advanced'].includes(input?.difficulty)) throw new Error('无效的训练配置');
      state.mode = input.mode;
      state.difficulty = input.difficulty;
      $('#difficulty-select').value = input.difficulty;
      $$('.mode-tab').forEach((item) => { const active = item.dataset.mode === input.mode; item.classList.toggle('is-active', active); item.setAttribute('aria-selected', String(active)); });
      switchView('train');
      resetSession();
      return { mode: state.mode, difficulty: state.difficulty, questionCount: SESSION_LENGTH };
    }
  });
  register({
    name: 'read_training_summary',
    title: '读取训练摘要',
    description: '读取本地保存的训练次数、总体准确率和两项分项平均分。',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, untrustedContentHint: false },
    execute() {
      const records = historyData();
      const average = (items) => items.length ? Math.round(items.reduce((sum, item) => sum + item.score, 0) / items.length) : null;
      return {
        sessions: records.length,
        overallAccuracy: average(records),
        intervalAccuracy: average(records.filter((item) => item.mode === 'interval')),
        progressionAccuracy: average(records.filter((item) => item.mode === 'progression'))
      };
    }
  });
}

resetSession(); renderHistory(); renderReport(); registerWebMCPTools();
