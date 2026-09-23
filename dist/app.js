const STORAGE_KEY = 'shengjie-ear-training-history-v1';

const intervalBank = [
  { id:'m2', name:'小二度', semitones:1 }, { id:'M2', name:'大二度', semitones:2 },
  { id:'m3', name:'小三度', semitones:3 }, { id:'M3', name:'大三度', semitones:4 },
  { id:'P4', name:'纯四度', semitones:5 }, { id:'TT', name:'增四度', semitones:6 },
  { id:'P5', name:'纯五度', semitones:7 }, { id:'m6', name:'小六度', semitones:8 },
  { id:'M6', name:'大六度', semitones:9 }, { id:'m7', name:'小七度', semitones:10 },
  { id:'M7', name:'大七度', semitones:11 }, { id:'P8', name:'纯八度', semitones:12 }
];

const chord = {
  I:[0,4,7], ii:[2,5,9], IV:[5,9,12], V:[7,11,14], vi:[9,12,16],
  bVII:[10,14,17], iv:[5,8,12], bVI:[8,12,15], VV:[2,6,9], Vvi:[4,8,11]
};

const progressionBank = [
  { id:'I-V-vi-IV', name:'I–V–vi–IV', subtitle:'流行进行', chords:[chord.I,chord.V,chord.vi,chord.IV] },
  { id:'I-IV-V-I', name:'I–IV–V–I', subtitle:'正格终止', chords:[chord.I,chord.IV,chord.V,chord.I] },
  { id:'ii-V-I', name:'ii–V–I', subtitle:'爵士终止', chords:[chord.ii,chord.V,chord.I] },
  { id:'I-vi-IV-V', name:'I–vi–IV–V', subtitle:'50 年代进行', chords:[chord.I,chord.vi,chord.IV,chord.V] },
  { id:'vi-IV-I-V', name:'vi–IV–I–V', subtitle:'小调起始', chords:[chord.vi,chord.IV,chord.I,chord.V] },
  { id:'I-V-IV-I', name:'I–V–IV–I', subtitle:'摇滚进行', chords:[chord.I,chord.V,chord.IV,chord.I] }
];

const borrowedBank = [
  { id:'I-bVII-IV-I', name:'I–♭VII–IV–I', subtitle:'混合利底亚借用', chords:[chord.I,chord.bVII,chord.IV,chord.I] },
  { id:'I-IV-iv-I', name:'I–IV–iv–I', subtitle:'小下属和弦', chords:[chord.I,chord.IV,chord.iv,chord.I] },
  { id:'I-bVI-bVII-I', name:'I–♭VI–♭VII–I', subtitle:'双降级借用', chords:[chord.I,chord.bVI,chord.bVII,chord.I] },
  { id:'I-VV-V-I', name:'I–V/V–V–I', subtitle:'重属和弦', chords:[chord.I,chord.VV,chord.V,chord.I] },
  { id:'I-Vvi-vi-IV', name:'I–V/vi–vi–IV', subtitle:'副属和弦', chords:[chord.I,chord.Vvi,chord.vi,chord.IV] }
];

const keys = [
  { value:0, name:'C' }, { value:1, name:'D♭' }, { value:2, name:'D' }, { value:3, name:'E♭' },
  { value:4, name:'E' }, { value:5, name:'F' }, { value:6, name:'F♯' }, { value:7, name:'G' },
  { value:8, name:'A♭' }, { value:9, name:'A' }, { value:10, name:'B♭' }, { value:11, name:'B' }
];

const chromaticNotes = [
  { value:1, name:'♭2 / ♯1' }, { value:3, name:'♭3 / ♯2' }, { value:6, name:'♯4 / ♭5' },
  { value:8, name:'♭6 / ♯5' }, { value:10, name:'♭7 / ♯6' }
];

const scaleTypes = [
  { id:'major', name:'大调', notes:[0,2,4,5,7,9,11] },
  { id:'naturalMinor', name:'自然小调', notes:[0,2,3,5,7,8,10] },
  { id:'harmonicMinor', name:'和声小调', notes:[0,2,3,5,7,8,11] },
  { id:'melodicMinor', name:'旋律小调', notes:[0,2,3,5,7,9,11] },
  { id:'pentatonic', name:'五声音阶', notes:[0,2,4,7,9] }
];

const difficultyPresets = {
  foundation:{ intervals:['M2','M3','P4','P5','P8'], progressions:['I-V-vi-IV','I-IV-V-I','I-vi-IV-V'], scales:['major'] },
  standard:{ intervals:['m2','M2','m3','M3','P4','P5','m6','M6'], progressions:['I-V-vi-IV','I-IV-V-I','ii-V-I','I-vi-IV-V'], scales:['major','naturalMinor'] },
  advanced:{ intervals:intervalBank.map(x=>x.id), progressions:progressionBank.map(x=>x.id), scales:scaleTypes.map(x=>x.id) }
};

const instrumentNames = { piano:'钢琴', guitar:'吉他', sax:'萨克斯', violin:'小提琴' };
const difficultyNames = { foundation:'基础', standard:'标准', advanced:'进阶' };
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const config = {
  mode:'interval', difficulty:'standard', questionCount:10, instrument:'piano',
  keys:[0,2,7], intervals:[...difficultyPresets.standard.intervals], scales:[...difficultyPresets.standard.scales],
  progressions:[...difficultyPresets.standard.progressions], allowChromatic:false,
  chromaticNotes:[6], borrowedChords:['I-bVII-IV-I','I-IV-iv-I']
};

const state = {
  sessionConfig:null, question:null, lastQuestionId:null, index:0, correct:0, streak:0,
  maxStreak:0, answers:[], startedAt:null, questionStartedAt:null, locked:false,
  timerId:null, audioContext:null
};

function historyData(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||[]}catch{return[]}}
function saveHistory(records){localStorage.setItem(STORAGE_KEY,JSON.stringify(records.slice(0,200)))}
function shuffle(items){return [...items].sort(()=>Math.random()-.5)}
function randomItem(items,exclude){const pool=items.filter(item=>item.id!==exclude);return (pool.length?pool:items)[Math.floor(Math.random()*(pool.length||items.length))]}
function clone(value){return JSON.parse(JSON.stringify(value))}

function renderOptionControls(){
  $('#key-options').innerHTML=keys.map(item=>`<button data-key="${item.value}">${item.name}</button>`).join('');
  $('#interval-options').innerHTML=intervalBank.map(item=>`<button data-interval="${item.id}">${item.name}</button>`).join('');
  $('#chromatic-note-options').innerHTML=chromaticNotes.map(item=>`<button data-chromatic-note="${item.value}">${item.name}</button>`).join('');
  $('#scale-options').innerHTML=scaleTypes.map(item=>`<button data-scale="${item.id}">${item.name}</button>`).join('');
  $('#progression-options').innerHTML=progressionBank.map(item=>checkOption('progression',item)).join('');
  $('#borrowed-chord-options').innerHTML=borrowedBank.map(item=>checkOption('borrowed',item)).join('');

  $$('#key-options button').forEach(button=>button.addEventListener('click',()=>toggleArray(config.keys,Number(button.dataset.key))));
  $$('#interval-options button').forEach(button=>button.addEventListener('click',()=>toggleArray(config.intervals,button.dataset.interval)));
  $$('#chromatic-note-options button').forEach(button=>button.addEventListener('click',()=>toggleArray(config.chromaticNotes,Number(button.dataset.chromaticNote))));
  $$('#scale-options button').forEach(button=>button.addEventListener('click',()=>toggleArray(config.scales,button.dataset.scale)));
  $$('#progression-options .check-option').forEach(label=>label.addEventListener('click',event=>{event.preventDefault();toggleArray(config.progressions,label.dataset.value)}));
  $$('#borrowed-chord-options .check-option').forEach(label=>label.addEventListener('click',event=>{event.preventDefault();toggleArray(config.borrowedChords,label.dataset.value)}));
}

function checkOption(type,item){return `<label class="check-option" data-${type}="${item.id}" data-value="${item.id}"><input type="checkbox"/><span><strong>${item.name}</strong><small>${item.subtitle}</small></span></label>`}

function toggleArray(array,value){const index=array.indexOf(value);if(index>=0)array.splice(index,1);else array.push(value);syncConfigUI()}

function setDifficulty(value){
  config.difficulty=value;
  config.intervals=[...difficultyPresets[value].intervals];
  config.progressions=[...difficultyPresets[value].progressions];
  config.scales=[...difficultyPresets[value].scales];
  syncConfigUI();
}

function syncConfigUI(){
  $$('.mode-card').forEach(button=>{const selected=button.dataset.mode===config.mode;button.classList.toggle('is-selected',selected);button.setAttribute('aria-checked',String(selected))});
  $$('#difficulty-options button').forEach(button=>button.classList.toggle('is-selected',button.dataset.difficulty===config.difficulty));
  $$('#question-count-options button').forEach(button=>button.classList.toggle('is-selected',Number(button.dataset.count)===config.questionCount));
  $$('#instrument-options button').forEach(button=>button.classList.toggle('is-selected',button.dataset.instrument===config.instrument));
  $$('#key-options button').forEach(button=>button.classList.toggle('is-selected',config.keys.includes(Number(button.dataset.key))));
  $$('#interval-options button').forEach(button=>button.classList.toggle('is-selected',config.intervals.includes(button.dataset.interval)));
  $$('#chromatic-note-options button').forEach(button=>button.classList.toggle('is-selected',config.chromaticNotes.includes(Number(button.dataset.chromaticNote))));
  $$('#scale-options button').forEach(button=>button.classList.toggle('is-selected',config.scales.includes(button.dataset.scale)));
  $$('#progression-options .check-option').forEach(label=>{const selected=config.progressions.includes(label.dataset.value);label.classList.toggle('is-selected',selected);label.querySelector('input').checked=selected});
  $$('#borrowed-chord-options .check-option').forEach(label=>{const selected=config.borrowedChords.includes(label.dataset.value);label.classList.toggle('is-selected',selected);label.querySelector('input').checked=selected});
  $('#interval-content-section').classList.toggle('is-hidden',config.mode!=='interval');
  $('#progression-content-section').classList.toggle('is-hidden',config.mode!=='progression');
  $('#chromatic-note-panel').classList.toggle('is-hidden',config.mode!=='interval');
  $('#borrowed-chord-panel').classList.toggle('is-hidden',config.mode!=='progression');
  $('#chromatic-description').textContent=config.mode==='interval'?'允许起始音来自所选调性的调外音级':'把借用和弦与副属和弦加入题库';
  $('#allow-chromatic').checked=config.allowChromatic;
  $('#chromatic-options').classList.toggle('is-hidden',!config.allowChromatic);
  $('#key-count').textContent=`${config.keys.length} 个调性`;
  $('#interval-count').textContent=`${config.intervals.length} 音程 · ${config.scales.length} 音阶`;
  $('#progression-count').textContent=`已选 ${config.progressions.length}`;
  renderConfigSummary();
  renderProfilePreview();
}

function renderConfigSummary(){
  const materialCount=config.mode==='interval'?config.intervals.length:config.progressions.length+(config.allowChromatic?config.borrowedChords.length:0);
  const contentName=config.mode==='interval'?'音程辨认':'和弦进行';
  $('#config-summary').innerHTML=[
    ['内容',contentName],['难度',difficultyNames[config.difficulty]],['题库',config.mode==='interval'?`${materialCount} 项 · ${config.keys.length} 调性 · ${config.scales.length} 音阶`:`${materialCount} 项 · ${config.keys.length} 个调性`],
    ['离调',config.allowChromatic?'允许':'关闭'],['音色',instrumentNames[config.instrument]],['题量',`${config.questionCount} 题`]
  ].map(([term,value])=>`<div><dt>${term}</dt><dd>${value}</dd></div>`).join('');
}

function renderProfilePreview(){
  const records=historyData();
  if(!records.length){$('#profile-preview').textContent='完成训练后，这里会汇总进步趋势和能力报告。';return}
  const average=Math.round(records.reduce((sum,item)=>sum+item.score,0)/records.length);
  $('#profile-preview').textContent=`已完成 ${records.length} 轮训练，当前平均准确率 ${average}%。`;
}

function validateConfig(){
  if(!config.keys.length)return '请至少选择一个调性。';
  const baseCount=config.mode==='interval'?config.intervals.length:config.progressions.length;
  if(baseCount<2)return `请至少选择两个${config.mode==='interval'?'音程':'和弦进行'}，才能形成有效测试。`;
  if(config.mode==='interval'&&!config.scales.length)return '请至少选择一种音阶或调式。';
  if(config.allowChromatic&&config.mode==='interval'&&!config.chromaticNotes.length)return '已允许离调内容，请至少选择一个调外音级。';
  if(config.allowChromatic&&config.mode==='progression'&&!config.borrowedChords.length)return '已允许离调内容，请至少选择一个借用和弦进行。';
  return '';
}

function availableItems(session=state.sessionConfig){
  if(session.mode==='interval')return intervalBank.filter(item=>session.intervals.includes(item.id));
  const base=progressionBank.filter(item=>session.progressions.includes(item.id));
  const borrowed=session.allowChromatic?borrowedBank.filter(item=>session.borrowedChords.includes(item.id)):[];
  return [...base,...borrowed];
}

function startSession(){
  const error=validateConfig();$('#config-error').textContent=error;if(error)return;
  state.sessionConfig=clone(config);resetSessionState();switchView('train');newQuestion();renderSessionTags();updateLiveStats();
}

function resetSessionState(){
  clearInterval(state.timerId);
  Object.assign(state,{question:null,lastQuestionId:null,index:0,correct:0,streak:0,maxStreak:0,answers:[],startedAt:null,questionStartedAt:null,locked:false,timerId:null});
  $('#timer').textContent='00:00';$('#feedback-bar').className='feedback-bar';$('#feedback-text').textContent='播放题目后选择答案';
}

function restartSession(){resetSessionState();newQuestion();updateLiveStats()}

function newQuestion(){
  state.locked=false;
  const item=randomItem(availableItems(),state.lastQuestionId);
  state.lastQuestionId=item.id;
  const key=randomItem(keys.filter(key=>state.sessionConfig.keys.includes(key.value)));
  const all=availableItems();const max=state.sessionConfig.mode==='interval'?8:6;
  const distractors=shuffle(all.filter(option=>option.id!==item.id)).slice(0,max-1);
  const choiceIds=shuffle([item,...distractors]).map(option=>option.id);
  let rootMidi=48+key.value;
  let usedChromatic=false;
  if(state.sessionConfig.mode==='interval'){
    if(state.sessionConfig.allowChromatic&&Math.random()<.42){rootMidi=48+key.value+randomItem(state.sessionConfig.chromaticNotes.map(value=>({id:value,value}))).value;usedChromatic=true}
    else{const scale=randomItem(scaleTypes.filter(option=>state.sessionConfig.scales.includes(option.id)));rootMidi+=randomItem(scale.notes.map(value=>({id:value,value}))).value}
  }
  state.question={...item,keyName:key.name,rootMidi,choiceIds,usedChromatic};
  state.questionStartedAt=Date.now();
  renderQuestion();
}

function renderSessionTags(){
  const session=state.sessionConfig;
  $('#session-tags').innerHTML=[session.mode==='interval'?'音程辨认':'和弦进行',difficultyNames[session.difficulty],`${session.keys.length} 个调性`,...(session.mode==='interval'?[`${session.scales.length} 种音阶`]:[]),instrumentNames[session.instrument],session.allowChromatic?'含离调':'调内'].map(text=>`<span>${text}</span>`).join('');
}

function renderQuestion(){
  const interval=state.sessionConfig.mode==='interval';
  $('#question-kicker').textContent=`${interval?'INTERVAL':'CHORD PROGRESSION'} · ${String(state.index+1).padStart(2,'0')}`;
  $('#question-title').textContent=interval?'听辨这两个音的距离':'识别这段和弦进行';
  $('#question-note').textContent=`题目从所选的 ${state.sessionConfig.keys.length} 个调性中随机生成 · ${instrumentNames[state.sessionConfig.instrument]}音色`;
  $('#question-number').textContent=String(state.index+1);$('#question-total').textContent=`/ ${state.sessionConfig.questionCount}`;
  const bank=interval?intervalBank:[...progressionBank,...borrowedBank];
  $('#answer-grid').innerHTML=state.question.choiceIds.map((id,index)=>{
    const option=bank.find(item=>item.id===id);
    return `<button data-answer="${option.id}"><span>${option.name}${option.subtitle?`<small>${option.subtitle}</small>`:''}</span><kbd>${index+1}</kbd></button>`;
  }).join('');
  $$('#answer-grid button').forEach(button=>button.addEventListener('click',()=>submitAnswer(button.dataset.answer,button)));
}

async function getAudioContext(){
  if(!state.audioContext)state.audioContext=new (window.AudioContext||window.webkitAudioContext)();
  if(state.audioContext.state==='suspended')await state.audioContext.resume();
  return state.audioContext;
}

function midiToHz(midi){return 440*(2**((midi-69)/12))}

function synthTone(ctx,midi,start,duration,volume=.12){
  const instrument=state.sessionConfig.instrument;
  const presets={
    piano:{types:['triangle','sine'],attack:.008,release:.88,detune:[0,4]},
    guitar:{types:['triangle','sawtooth'],attack:.006,release:.72,detune:[0,-5]},
    sax:{types:['sawtooth','sine'],attack:.055,release:.92,detune:[0,7]},
    violin:{types:['sawtooth','triangle'],attack:.075,release:.96,detune:[0,-7]}
  };
  const preset=presets[instrument];
  const master=ctx.createGain();
  master.gain.setValueAtTime(.0001,start);
  master.gain.exponentialRampToValueAtTime(volume,start+preset.attack);
  if(instrument==='piano'||instrument==='guitar')master.gain.exponentialRampToValueAtTime(Math.max(.012,volume*.28),start+duration*.58);
  else master.gain.setValueAtTime(volume,start+duration*.72);
  master.gain.exponentialRampToValueAtTime(.0001,start+duration*preset.release);
  master.connect(ctx.destination);
  preset.types.forEach((type,index)=>{
    const osc=ctx.createOscillator();osc.type=type;osc.frequency.value=midiToHz(midi);osc.detune.value=preset.detune[index];
    const mix=ctx.createGain();mix.gain.value=index?0.26:0.74;osc.connect(mix).connect(master);osc.start(start);osc.stop(start+duration+.04);
  });
}

async function playQuestion(){
  if(!state.question)return;ensureSessionStarted();
  const ctx=await getAudioContext();const play=$('#play-question');const wave=$('.wave');play.classList.add('is-playing');wave.classList.add('is-playing');play.querySelector('span').textContent='■';
  if(state.sessionConfig.mode==='interval'){
    const now=ctx.currentTime+.04;synthTone(ctx,state.question.rootMidi,now,.68,.15);synthTone(ctx,state.question.rootMidi+state.question.semitones,now+.82,.76,.15);setTimeout(stopAnimation,1750);
  }else{
    const now=ctx.currentTime+.04;state.question.chords.forEach((notes,index)=>notes.forEach(note=>synthTone(ctx,state.question.rootMidi+note,now+index*.82,.72,.067)));setTimeout(stopAnimation,state.question.chords.length*820+140);
  }
  function stopAnimation(){play.classList.remove('is-playing');wave.classList.remove('is-playing');play.querySelector('span').textContent='▶'}
}

function ensureSessionStarted(){if(state.startedAt)return;state.startedAt=Date.now();state.questionStartedAt=Date.now();state.timerId=setInterval(updateTimer,1000)}

function submitAnswer(answerId,button){
  if(state.locked||!state.question)return;ensureSessionStarted();state.locked=true;
  const correct=answerId===state.question.id;const elapsed=Date.now()-state.questionStartedAt;
  if(correct)state.correct++;state.streak=correct?state.streak+1:0;state.maxStreak=Math.max(state.maxStreak,state.streak);
  state.answers.push({question:state.question.id,answer:answerId,correct,elapsed,key:state.question.keyName,chromatic:state.question.usedChromatic||borrowedBank.some(item=>item.id===state.question.id)});
  $$('#answer-grid button').forEach(item=>{item.disabled=true;if(item.dataset.answer===state.question.id)item.classList.add('correct')});
  if(!correct)button.classList.add('wrong');
  $('#feedback-bar').className=`feedback-bar ${correct?'is-correct':'is-wrong'}`;$('#feedback-text').textContent=correct?`正确 · ${state.question.name}`:`答案是 ${state.question.name}`;updateLiveStats();
  setTimeout(()=>{state.index++;if(state.index>=state.sessionConfig.questionCount)finishSession();else{$('#feedback-bar').className='feedback-bar';$('#feedback-text').textContent='下一题已准备好';newQuestion();updateLiveStats()}},1000);
}

function updateTimer(){if(!state.startedAt)return;const seconds=Math.floor((Date.now()-state.startedAt)/1000);$('#timer').textContent=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`}

function updateLiveStats(){
  const answered=state.answers.length;const total=state.sessionConfig?.questionCount||config.questionCount;const score=answered?Math.round(state.correct/answered*100):0;
  $('#live-score').textContent=answered?score:'—';$('.score-ring').style.setProperty('--score',score);$('#correct-count').textContent=state.correct;$('#streak-count').textContent=state.streak;$('#progress-copy').textContent=`${answered} / ${total}`;$('.session-progress i b').style.width=`${answered/total*100}%`;
}

function finishSession(){
  clearInterval(state.timerId);const endedAt=Date.now();const total=state.sessionConfig.questionCount;const score=Math.round(state.correct/total*100);
  const record={id:crypto.randomUUID?crypto.randomUUID():String(endedAt),mode:state.sessionConfig.mode,difficulty:state.sessionConfig.difficulty,score,correct:state.correct,total,maxStreak:state.maxStreak,averageResponseMs:Math.round(state.answers.reduce((sum,item)=>sum+item.elapsed,0)/state.answers.length),durationSeconds:Math.round((endedAt-state.startedAt)/1000),createdAt:new Date().toISOString(),instrument:state.sessionConfig.instrument,keys:state.sessionConfig.keys,scales:state.sessionConfig.scales,allowChromatic:state.sessionConfig.allowChromatic,answers:state.answers};
  saveHistory([record,...historyData()]);renderProfilePreview();renderProgress();$('#dialog-score').textContent=score;$('#dialog-summary').textContent=score>=80?`答对 ${state.correct} 题，音高关系辨认稳定。`:`答对 ${state.correct} 题，建议缩小题库后再建立稳定参照。`;$('#session-dialog').showModal();
}

function switchView(name){$$('.view').forEach(view=>view.classList.toggle('is-active',view.id===`${name}-view`));if(name==='progress')renderProgress();window.scrollTo({top:0,behavior:'smooth'})}
function formatDate(iso){return new Intl.DateTimeFormat('zh-CN',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(iso))}
function formatDuration(seconds){return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`}

function renderProgress(){
  const records=historyData();const average=items=>items.length?items.reduce((sum,item)=>sum+item.score,0)/items.length:0;
  const overallAccuracy=Math.round(average(records));const intervalRecords=records.filter(item=>item.mode==='interval');const progressionRecords=records.filter(item=>item.mode==='progression');
  const intervalScore=Math.round(average(intervalRecords));const progressionScore=Math.round(average(progressionRecords));const recent=records.slice(0,5).map(item=>item.score);
  const consistency=recent.length>1?Math.max(0,Math.round(100-Math.sqrt(recent.reduce((sum,value)=>sum+(value-average(recent))**2,0)/recent.length)*2.2)):(recent.length?70:0);
  const breadth=Math.min(100,records.length*6+(intervalRecords.length&&progressionRecords.length?20:0));const overall=records.length?Math.round(overallAccuracy*.67+consistency*.18+breadth*.15):0;
  const best=records.length?Math.max(...records.map(item=>item.score)):0;const latest=records.slice(0,3);const previous=records.slice(3,6);const change=previous.length?Math.round(average(latest)-average(previous)):0;
  $('#history-summary').innerHTML=[['训练轮次',records.length,'轮'],['平均准确率',records.length?`${overallAccuracy}%`:'—',change?`${change>0?'+':''}${change}% 近期变化`:'等待更多数据'],['最佳成绩',records.length?`${best}%`:'—','个人最高'],['累计答题',records.reduce((sum,item)=>sum+item.total,0),'题']].map(([label,value,note])=>`<div class="summary-card"><span>${label}</span><strong>${value}</strong><em>${note}</em></div>`).join('');
  const level=overall>=90?'敏锐听辨者':overall>=75?'稳定进阶者':overall>=60?'基础扎实':overall>0?'听感建立中':'等待首次测试';
  $('#ability-score').textContent=records.length?overall:'—';$('.ability-score').style.setProperty('--score',overall);$('#ability-level').textContent=level;$('#ability-summary').textContent=records.length?`总体准确率 ${overallAccuracy}%，近期稳定性 ${consistency} 分。评分会随着不同调性与内容的覆盖变得更准确。`:'完成一轮训练后，这里会给出你的能力概览。';$('#report-subtitle').textContent=records.length?`基于 ${records.length} 次训练、${records.reduce((sum,item)=>sum+item.total,0)} 道题动态生成。`:'完成测试后生成你的能力基线。';
  $('#skill-list').innerHTML=[['音程辨认',intervalScore,intervalRecords.length],['和弦进行',progressionScore,progressionRecords.length],['稳定性',consistency,records.length],['训练广度',breadth,records.length]].map(([name,score,count])=>`<div><div class="skill-head"><span>${name}${count?'':' · 暂无数据'}</span><strong>${count?score:'—'}</strong></div><div class="skill-track"><i style="width:${count?score:0}%"></i></div></div>`).join('');
  renderTrend(records.slice(0,12).reverse());renderInsights({records,intervalScore,progressionScore,consistency});renderRecords();
}

function renderTrend(records){
  const container=$('#trend-chart');if(!records.length){container.innerHTML='<div class="empty-state"><strong>趋势等待第一次训练</strong>完成测试后会生成准确率曲线。</div>';return}
  const w=850,h=210,pad=32;const x=i=>records.length===1?w/2:pad+i*((w-pad*2)/(records.length-1));const y=score=>h-pad-score/100*(h-pad*2);const points=records.map((item,index)=>`${x(index)},${y(item.score)}`).join(' ');const area=`${x(0)},${h-pad} ${points} ${x(records.length-1)},${h-pad}`;
  container.innerHTML=`<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="准确率趋势图"><defs><linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#caff58" stop-opacity=".2"/><stop offset="1" stop-color="#caff58" stop-opacity="0"/></linearGradient></defs>${[0,25,50,75,100].map(v=>`<line class="chart-gridline" x1="${pad}" y1="${y(v)}" x2="${w-pad}" y2="${y(v)}"/><text class="chart-label" x="0" y="${y(v)+4}">${v}</text>`).join('')}<polygon class="chart-area" points="${area}"/><polyline class="chart-line" points="${points}"/>${records.map((item,index)=>`<circle class="chart-point" cx="${x(index)}" cy="${y(item.score)}" r="5"><title>${item.score} 分 · ${formatDate(item.createdAt)}</title></circle>`).join('')}</svg>`;
}

function renderInsights({records,intervalScore,progressionScore,consistency}){
  let advice;if(!records.length)advice=[['先建立基线','从标准难度开始，选择 3 个熟悉调性完成第一轮训练。'],['逐步增加变量','准确率稳定后，再加入更多调性、离调内容与不同音色。']];
  else{const weaker=intervalScore&&progressionScore?(intervalScore<=progressionScore?'音程辨认':'和弦进行'):(!intervalScore?'音程辨认':'和弦进行');advice=[[`优先练习${weaker}`,'该分项当前提升空间更大。先缩小题库，连续完成 3 轮后再增加内容。'],['控制训练变量',consistency<70?'近期波动较大。每次只改变调性、音色或离调内容中的一项。':'稳定性良好，可以尝试增加离调内容或切换音色。'],['跨音色验证','同一组题库分别使用钢琴和小提琴，能减少对单一泛音特征的依赖。'],['保持短时高频','每次 5–10 分钟、每周至少 4 次，比一次长时间训练更利于形成听觉记忆。']]}
  $('#insight-list').innerHTML=advice.map(([title,text])=>`<div class="insight-item"><strong>${title}</strong><p>${text}</p></div>`).join('');
}

function renderRecords(){
  const filter=$('#history-filter').value;const records=historyData().filter(item=>filter==='all'||item.mode===filter);
  $('#records-list').innerHTML=records.length?records.map(record=>`<article class="record-row"><div class="record-mode"><span class="record-icon">${record.mode==='interval'?'↕':'♬'}</span><div>${record.mode==='interval'?'音程辨认':'和弦进行'}<div class="record-meta">${difficultyNames[record.difficulty]||'标准'} · ${instrumentNames[record.instrument]||'钢琴'} · ${record.allowChromatic?'含离调':'调内'}</div></div></div><div class="record-date">${formatDate(record.createdAt)}</div><div class="record-meta">${record.correct}/${record.total} · ${formatDuration(record.durationSeconds)}</div><div class="record-score">${record.score} 分</div></article>`).join(''):'<div class="empty-state"><strong>还没有训练记录</strong>完成一轮训练后，结果会自动保存在这里。</div>';
}

function registerWebMCPTools(){
  const context=document.modelContext;if(!context?.registerTool)return;
  const register=tool=>Promise.resolve(context.registerTool(tool)).catch(error=>console.warn('WebMCP registration failed',error));
  register({name:'configure_training',title:'配置练耳训练',description:'打开训练配置页并应用训练类型和难度预设。',inputSchema:{type:'object',properties:{mode:{type:'string',enum:['interval','progression']},difficulty:{type:'string',enum:['foundation','standard','advanced']}},required:['mode','difficulty'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(!['interval','progression'].includes(input?.mode)||!difficultyPresets[input?.difficulty])throw new Error('无效的训练配置');config.mode=input.mode;setDifficulty(input.difficulty);switchView('config');return{mode:config.mode,difficulty:config.difficulty,requiresConfirmation:true}}});
  register({name:'read_training_summary',title:'读取训练摘要',description:'读取本地训练次数与两项平均准确率。',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute(){const records=historyData();const avg=items=>items.length?Math.round(items.reduce((sum,item)=>sum+item.score,0)/items.length):null;return{sessions:records.length,overallAccuracy:avg(records),intervalAccuracy:avg(records.filter(item=>item.mode==='interval')),progressionAccuracy:avg(records.filter(item=>item.mode==='progression'))}}});
}

function bindEvents(){
  $$('.mode-card').forEach(button=>button.addEventListener('click',()=>{config.mode=button.dataset.mode;syncConfigUI()}));
  $$('#difficulty-options button').forEach(button=>button.addEventListener('click',()=>setDifficulty(button.dataset.difficulty)));
  $$('#question-count-options button').forEach(button=>button.addEventListener('click',()=>{config.questionCount=Number(button.dataset.count);syncConfigUI()}));
  $$('#instrument-options button').forEach(button=>button.addEventListener('click',()=>{config.instrument=button.dataset.instrument;syncConfigUI()}));
  $('#allow-chromatic').addEventListener('change',event=>{config.allowChromatic=event.target.checked;syncConfigUI()});
  $('#select-all-keys').addEventListener('click',()=>{config.keys=keys.map(item=>item.value);syncConfigUI()});
  $('#clear-keys').addEventListener('click',()=>{config.keys=[];syncConfigUI()});
  $('#start-session').addEventListener('click',startSession);$('#open-progress').addEventListener('click',()=>switchView('progress'));$$('[data-go]').forEach(button=>button.addEventListener('click',()=>switchView(button.dataset.go)));
  $('#play-question').addEventListener('click',playQuestion);$('#restart-session').addEventListener('click',restartSession);$('#history-filter').addEventListener('change',renderRecords);$('#print-report').addEventListener('click',()=>window.print());
  $('#dialog-close').addEventListener('click',()=>$('#session-dialog').close());$('#train-again').addEventListener('click',()=>{$('#session-dialog').close();restartSession()});$('#view-progress').addEventListener('click',()=>{$('#session-dialog').close();switchView('progress')});
  $('#export-history').addEventListener('click',()=>{const blob=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),sessions:historyData()},null,2)],{type:'application/json'});const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=`shengjie-history-${new Date().toISOString().slice(0,10)}.json`;link.click();URL.revokeObjectURL(link.href)});
  document.addEventListener('keydown',event=>{if(!$('#train-view').classList.contains('is-active')||$('#session-dialog').open)return;if(event.code==='Space'){event.preventDefault();playQuestion();return}const index=Number(event.key)-1;const buttons=$$('#answer-grid button');if(index>=0&&index<buttons.length)buttons[index].click()});
}

renderOptionControls();bindEvents();syncConfigUI();renderProgress();registerWebMCPTools();
