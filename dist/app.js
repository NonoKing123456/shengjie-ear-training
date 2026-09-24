const STORAGE_KEY = 'shengjie-ear-training-history-v1';

const intervalBank = [
  { id:'m2', name:'小二度', semitones:1 }, { id:'M2', name:'大二度', semitones:2 },
  { id:'m3', name:'小三度', semitones:3 }, { id:'M3', name:'大三度', semitones:4 },
  { id:'P4', name:'纯四度', semitones:5 }, { id:'TT', name:'增四 / 减五度', semitones:6 },
  { id:'P5', name:'纯五度', semitones:7 }, { id:'m6', name:'小六度', semitones:8 },
  { id:'M6', name:'大六度', semitones:9 }, { id:'m7', name:'小七度', semitones:10 },
  { id:'M7', name:'大七度', semitones:11 }, { id:'P8', name:'纯八度', semitones:12 },
  { id:'m9', name:'小九度', semitones:13 }, { id:'M9', name:'大九度', semitones:14 },
  { id:'m10', name:'小十度', semitones:15 }, { id:'M10', name:'大十度', semitones:16 },
  { id:'P11', name:'纯十一度', semitones:17 }, { id:'A11', name:'增十一度', semitones:18 },
  { id:'P12', name:'纯十二度', semitones:19 }, { id:'m13', name:'小十三度', semitones:20 },
  { id:'M13', name:'大十三度', semitones:21 }, { id:'m14', name:'小十四度', semitones:22 },
  { id:'M14', name:'大十四度', semitones:23 }, { id:'P15', name:'双八度', semitones:24 }
];

const intervalRangePresets = {
  fifth:intervalBank.filter(item=>item.semitones<=7).map(item=>item.id),
  octave:intervalBank.filter(item=>item.semitones<=12).map(item=>item.id),
  all:intervalBank.map(item=>item.id)
};

const keys = [
  { value:0, name:'C' }, { value:1, name:'D♭' }, { value:2, name:'D' }, { value:3, name:'E♭' },
  { value:4, name:'E' }, { value:5, name:'F' }, { value:6, name:'F♯' }, { value:7, name:'G' },
  { value:8, name:'A♭' }, { value:9, name:'A' }, { value:10, name:'B♭' }, { value:11, name:'B' }
];

const diatonicChords = {
  major:{ I:[0,4,7], ii:[2,5,9], iii:[4,7,11], IV:[5,9,12], V:[7,11,14], vi:[9,12,16], 'vii°':[11,14,17] },
  minor:{ i:[0,3,7], 'ii°':[2,5,8], III:[3,7,10], iv:[5,8,12], V:[7,11,14], VI:[8,12,15], VII:[10,14,17] }
};

const transitionMap = {
  major:{ I:['ii','iii','IV','V','vi'], ii:['V','vii°'], iii:['vi','IV'], IV:['I','ii','V'], V:['I','vi'], vi:['ii','IV','V'], 'vii°':['I'] },
  minor:{ i:['ii°','III','iv','V','VI','VII'], 'ii°':['V','i'], III:['VI','iv'], iv:['i','ii°','V'], V:['i','VI'], VI:['ii°','iv','VII'], VII:['III','i'] }
};

const chromaticHarmonyBank = [
  { id:'V3', major:'V/iii', minor:'V/III', subtitle:'三级属 · 导向三级', majorNotes:[11,15,18], minorNotes:[10,14,17], majorResolution:'iii', minorResolution:'III' },
  { id:'V5', major:'V/V', minor:'V/V', subtitle:'重属和弦 · 导向属和弦', majorNotes:[2,6,9], minorNotes:[2,6,9], majorResolution:'V', minorResolution:'V' },
  { id:'V6', major:'V/vi', minor:'V/VI', subtitle:'六级属 · 导向六级', majorNotes:[4,8,11], minorNotes:[3,7,10], majorResolution:'vi', minorResolution:'VI' },
  { id:'V4', major:'V/IV', minor:'V/iv', subtitle:'四级属 · 导向下属和弦', majorNotes:[0,4,7], minorNotes:[0,4,7], majorResolution:'IV', minorResolution:'iv' },
  { id:'Vb2', major:'V/♭II', minor:'V/♭II', subtitle:'降二级属 · 导向降二级', majorNotes:[8,12,15], minorNotes:[8,12,15], majorResolution:'♭II', minorResolution:'♭II' },
  { id:'N6', major:'♭II6', minor:'♭II6', subtitle:'那不勒斯六和弦', majorNotes:[5,8,13], minorNotes:[5,8,13], majorResolution:'V', minorResolution:'V' },
  { id:'borrowed4', major:'iv', minor:'IV', subtitle:'大小调交替的下属和弦', majorNotes:[5,8,12], minorNotes:[5,9,12], majorResolution:'I', minorResolution:'i' },
  { id:'ger6', major:'Ger+6', minor:'Ger+6', subtitle:'德国增六和弦 · 导向属和弦', majorNotes:[8,12,15,18], minorNotes:[8,12,15,18], majorResolution:'V', minorResolution:'V' }
];

const warmupBank = {
  major:[
    { id:'maj-pop', name:'I–V–vi–IV', subtitle:'流行循环', tokens:['I','V','vi','IV'] },
    { id:'maj-50s', name:'I–vi–IV–V', subtitle:'50 年代进行', tokens:['I','vi','IV','V'] },
    { id:'maj-cadence', name:'I–IV–V–I', subtitle:'正格终止', tokens:['I','IV','V','I'] },
    { id:'maj-axis', name:'vi–IV–I–V', subtitle:'小调起始流行循环', tokens:['vi','IV','I','V'] },
    { id:'maj-lift', name:'I–iii–IV–V', subtitle:'上行色彩进行', tokens:['I','iii','IV','V'] },
    { id:'maj-251', name:'I–ii–V–I', subtitle:'二五一终止', tokens:['I','ii','V','I'] }
  ],
  minor:[
    { id:'min-pop', name:'i–VI–III–VII', subtitle:'小调流行循环', tokens:['i','VI','III','VII'] },
    { id:'min-cadence', name:'i–iv–V–i', subtitle:'小调正格终止', tokens:['i','iv','V','i'] },
    { id:'min-descend', name:'i–VII–VI–VII', subtitle:'自然小调下行', tokens:['i','VII','VI','VII'] },
    { id:'min-color', name:'i–III–VI–iv', subtitle:'小调色彩进行', tokens:['i','III','VI','iv'] },
    { id:'min-drive', name:'i–VI–iv–V', subtitle:'属和弦推进', tokens:['i','VI','iv','V'] },
    { id:'min-journey', name:'i–iv–VII–III', subtitle:'自然小调循环', tokens:['i','iv','VII','III'] }
  ]
};

const difficultyPresets = {
  foundation:{ intervals:['M2','m3','M3','P4','P5','P8'] },
  standard:{ intervals:['m2','M2','m3','M3','P4','TT','P5','m6','M6','m7','M7','P8'] },
  advanced:{ intervals:intervalBank.map(item=>item.id) }
};

const instrumentNames = { piano:'钢琴', guitar:'吉他', sax:'萨克斯', violin:'小提琴' };
const difficultyNames = { foundation:'基础', standard:'标准', advanced:'进阶' };
const tonalityNames = { major:'大调', minor:'小调' };
const chordModeNames = { generated:'随机和声', warmup:'常见进行热身' };
const intervalDirectionNames = { ascending:'上行', descending:'下行', mixed:'交替出现' };
const soundfontPresets = {
  piano:()=>window._tone_0000_FluidR3_GM_sf2_file,
  guitar:()=>window._tone_0250_FluidR3_GM_sf2_file,
  sax:()=>window._tone_0650_FluidR3_GM_sf2_file,
  violin:()=>window._tone_0400_FluidR3_GM_sf2_file
};
const soundfontPlayback = {
  piano:{singleVolume:.58,chordVolume:.2,noteDuration:1.05,chordDuration:.78,strum:0},
  guitar:{singleVolume:.64,chordVolume:.24,noteDuration:.95,chordDuration:.72,strum:.022},
  sax:{singleVolume:.46,chordVolume:.16,noteDuration:1.05,chordDuration:.78,strum:0},
  violin:{singleVolume:.42,chordVolume:.15,noteDuration:1.1,chordDuration:.82,strum:0}
};
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

const config = {
  mode:'interval', difficulty:'standard', questionCount:10, instrument:'piano',
  startMode:'random', fixedPitch:0, fixedOctave:4,
  intervalDirection:'ascending', intervalPlayback:'sequential',
  intervals:[...difficultyPresets.standard.intervals],
  chordMode:'generated', tonality:'major', keys:[0,2,7],
  chromaticHarmonies:['V3','V5','N6']
};

const state = {
  sessionConfig:null, question:null, lastQuestionId:null, index:0, correct:0, streak:0,
  maxStreak:0, answers:[], startedAt:null, questionStartedAt:null, locked:false,
  timerId:null, audioContext:null, audioBus:null, audioBusy:false,
  soundfontPlayers:{}, soundfontPromises:{}
};

function historyData(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||[]}catch{return[]}}
function saveHistory(records){localStorage.setItem(STORAGE_KEY,JSON.stringify(records.slice(0,200)))}
function shuffle(items){return [...items].sort(()=>Math.random()-.5)}
function randomFrom(items){return items[Math.floor(Math.random()*items.length)]}
function randomItem(items,exclude){const pool=items.filter(item=>item.id!==exclude);return randomFrom(pool.length?pool:items)}
function clone(value){return JSON.parse(JSON.stringify(value))}
function toggleArray(array,value){const index=array.indexOf(value);if(index>=0)array.splice(index,1);else array.push(value);syncConfigUI()}
function hasSameItems(first,second){return first.length===second.length&&first.every(item=>second.includes(item))}
function intervalRangeLabel(intervals){const selected=intervalBank.filter(item=>intervals.includes(item.id));return selected.length?`最远${selected[selected.length-1].name}`:'未选择'}
function harmonyToken(item,tonality){return item[tonality]}
function harmonyNotes(item,tonality){return item[`${tonality}Notes`]}
function harmonyResolution(item,tonality){return item[`${tonality}Resolution`]}

function chordNotes(token,tonality){
  if(diatonicChords[tonality][token])return diatonicChords[tonality][token];
  if(token==='♭II')return [1,5,8];
  const harmony=chromaticHarmonyBank.find(item=>harmonyToken(item,tonality)===token);
  return harmony?harmonyNotes(harmony,tonality):diatonicChords[tonality][tonality==='major'?'I':'i'];
}

function checkOption(item){
  return `<label class="check-option" data-harmony="${item.id}"><input type="checkbox"/><span><strong data-harmony-name>${harmonyToken(item,config.tonality)}</strong><small>${item.subtitle}</small></span></label>`;
}

function renderOptionControls(){
  $('#key-options').innerHTML=keys.map(item=>`<button data-key="${item.value}">${item.name}</button>`).join('');
  $('#fixed-note-options').innerHTML=keys.map(item=>`<button data-fixed-pitch="${item.value}">${item.name}</button>`).join('');
  $('#interval-options').innerHTML=intervalBank.map(item=>`<button data-interval="${item.id}">${item.name}</button>`).join('');
  $('#chromatic-harmony-options').innerHTML=chromaticHarmonyBank.map(checkOption).join('');

  $$('#key-options button').forEach(button=>button.addEventListener('click',()=>toggleArray(config.keys,Number(button.dataset.key))));
  $$('#fixed-note-options button').forEach(button=>button.addEventListener('click',()=>{config.fixedPitch=Number(button.dataset.fixedPitch);syncConfigUI()}));
  $$('#interval-options button').forEach(button=>button.addEventListener('click',()=>toggleArray(config.intervals,button.dataset.interval)));
  $$('#chromatic-harmony-options .check-option').forEach(label=>label.addEventListener('click',event=>{event.preventDefault();toggleArray(config.chromaticHarmonies,label.dataset.harmony)}));
}

function setDifficulty(value){
  config.difficulty=value;
  config.intervals=[...difficultyPresets[value].intervals];
  syncConfigUI();
}

function setIntervalDirection(value){
  config.intervalDirection=value;
  syncConfigUI();
}

function syncConfigUI(){
  const isInterval=config.mode==='interval';
  $$('.mode-card').forEach(button=>{const selected=button.dataset.mode===config.mode;button.classList.toggle('is-selected',selected);button.setAttribute('aria-checked',String(selected))});
  $$('#difficulty-options button').forEach(button=>button.classList.toggle('is-selected',button.dataset.difficulty===config.difficulty));
  $$('#question-count-options button').forEach(button=>button.classList.toggle('is-selected',Number(button.dataset.count)===config.questionCount));
  $$('#instrument-options button').forEach(button=>button.classList.toggle('is-selected',button.dataset.instrument===config.instrument));
  $$('#start-mode-options button').forEach(button=>button.classList.toggle('is-selected',button.dataset.startMode===config.startMode));
  $$('#fixed-note-options button').forEach(button=>button.classList.toggle('is-selected',Number(button.dataset.fixedPitch)===config.fixedPitch));
  $$('#fixed-octave-options button').forEach(button=>button.classList.toggle('is-selected',Number(button.dataset.octave)===config.fixedOctave));
  const directionDisabled=config.intervalPlayback==='simultaneous';
  $('#interval-direction-row').classList.toggle('is-disabled',directionDisabled);
  $('#interval-direction-row').setAttribute('aria-disabled',String(directionDisabled));
  $$('#interval-direction-options button').forEach(button=>{const selected=button.dataset.intervalDirection===config.intervalDirection;button.classList.toggle('is-selected',selected);button.setAttribute('aria-checked',String(selected));button.disabled=directionDisabled});
  $$('#interval-playback-options button').forEach(button=>{const selected=button.dataset.intervalPlayback===config.intervalPlayback;button.classList.toggle('is-selected',selected);button.setAttribute('aria-checked',String(selected))});
  $$('#interval-options button').forEach(button=>button.classList.toggle('is-selected',config.intervals.includes(button.dataset.interval)));
  $$('#interval-preset-options button').forEach(button=>button.classList.toggle('is-selected',hasSameItems(config.intervals,intervalRangePresets[button.dataset.intervalPreset])));
  $$('#chord-mode-options button').forEach(button=>button.classList.toggle('is-selected',button.dataset.chordMode===config.chordMode));
  $$('#tonality-options button').forEach(button=>button.classList.toggle('is-selected',button.dataset.tonality===config.tonality));
  $$('#key-options button').forEach(button=>button.classList.toggle('is-selected',config.keys.includes(Number(button.dataset.key))));
  $$('#chromatic-harmony-options .check-option').forEach(label=>{
    const item=chromaticHarmonyBank.find(option=>option.id===label.dataset.harmony);
    const selected=config.chromaticHarmonies.includes(item.id);
    label.classList.toggle('is-selected',selected);label.querySelector('input').checked=selected;
    label.querySelector('[data-harmony-name]').textContent=harmonyToken(item,config.tonality);
  });
  $('#interval-settings').classList.toggle('is-hidden',!isInterval);
  $('#chord-settings').classList.toggle('is-hidden',isInterval);
  $('#fixed-start-panel').classList.toggle('is-hidden',config.startMode!=='fixed');
  $('#generated-harmony-section').classList.toggle('is-hidden',config.chordMode!=='generated');
  $('#warmup-explanation').classList.toggle('is-hidden',config.chordMode!=='warmup');
  $('#instrument-step').textContent=isInterval?'06':'07';
  $('#interval-count').textContent=`已选 ${config.intervals.length} 个`;
  $('#key-count').textContent=`${config.keys.length} 个调性`;
  $('#chromatic-count').textContent=`已选 ${config.chromaticHarmonies.length} 个`;
  renderConfigSummary();renderProfilePreview();
}

function renderConfigSummary(){
  const rows=config.mode==='interval'?
    [['内容','音程辨认'],['难度',difficultyNames[config.difficulty]],['起始音',config.startMode==='random'?'系统随机':`${keys.find(item=>item.value===config.fixedPitch).name}${config.fixedOctave}`],['方向',config.intervalPlayback==='simultaneous'?'同时发声时不适用':intervalDirectionNames[config.intervalDirection]],['发声',config.intervalPlayback==='simultaneous'?'同时发声':'依次发声'],['范围',`${config.intervals.length} 个音程 · ${intervalRangeLabel(config.intervals)}`],['音色',instrumentNames[config.instrument]],['题量',`${config.questionCount} 题`]]:
    [['内容','和弦进行'],['方式',chordModeNames[config.chordMode]],['调式',tonalityNames[config.tonality]],['调性中心',`${config.keys.length} 个`],['调外和声',config.chordMode==='generated'?`${config.chromaticHarmonies.length} 个可用`:'热身模式不使用'],['音色',instrumentNames[config.instrument]],['题量',`${config.questionCount} 题`]];
  $('#config-summary').innerHTML=rows.map(([term,value])=>`<div><dt>${term}</dt><dd>${value}</dd></div>`).join('');
}

function renderProfilePreview(){
  const records=historyData();
  if(!records.length){$('#profile-preview').textContent='完成训练后，这里会汇总进步趋势和能力报告。';return}
  const average=Math.round(records.reduce((sum,item)=>sum+item.score,0)/records.length);
  $('#profile-preview').textContent=`已完成 ${records.length} 轮训练，当前平均准确率 ${average}%。`;
}

function validateConfig(){
  if(config.mode==='interval'&&config.intervals.length<2)return '请至少选择两个音程，才能形成有效测试。';
  if(config.mode==='progression'&&!config.keys.length)return '请至少选择一个调性中心。';
  return '';
}

function generatedProgression(session){
  const tonality=session.tonality;const tonic=tonality==='major'?'I':'i';let tokens;
  const selected=chromaticHarmonyBank.filter(item=>session.chromaticHarmonies.includes(item.id));
  if(selected.length&&Math.random()<.68){
    const harmony=randomFrom(selected);const resolution=harmonyResolution(harmony,tonality);
    const possible=transitionMap[tonality][resolution]||[tonic];
    tokens=[tonic,harmonyToken(harmony,tonality),resolution,randomFrom(possible)];
  }else{
    tokens=[tonic];
    while(tokens.length<4){const previous=tokens[tokens.length-1];tokens.push(randomFrom(transitionMap[tonality][previous]||[tonic]))}
  }
  const name=tokens.join('–');
  return {id:name,name,subtitle:'系统逐和弦生成',tokens,chords:tokens.map(token=>chordNotes(token,tonality)),usedChromatic:tokens.some(token=>!diatonicChords[tonality][token])};
}

function progressionChoices(correct,session){
  const count={foundation:4,standard:5,advanced:6}[session.difficulty];
  const pool=[...Object.keys(diatonicChords[session.tonality]),...chromaticHarmonyBank.filter(item=>session.chromaticHarmonies.includes(item.id)).map(item=>harmonyToken(item,session.tonality))];
  const choices=[{id:correct.id,name:correct.name,subtitle:correct.subtitle}];const seen=new Set([correct.name]);let attempts=0;
  while(choices.length<count&&attempts<80){
    attempts++;const tokens=[...correct.tokens];const index=1+Math.floor(Math.random()*(tokens.length-1));tokens[index]=randomFrom(pool);
    if(Math.random()<.25){const a=1,b=2;[tokens[a],tokens[b]]=[tokens[b],tokens[a]]}
    const name=tokens.join('–');if(seen.has(name))continue;seen.add(name);choices.push({id:name,name,subtitle:'相近和声路径'});
  }
  return shuffle(choices);
}

function intervalQuestion(session){
  const items=intervalBank.filter(item=>session.intervals.includes(item.id));
  const item=randomItem(items,state.lastQuestionId);state.lastQuestionId=item.id;
  const choices=items.map(option=>({id:option.id,name:option.name}));
  const direction=session.intervalPlayback==='simultaneous'?1:session.intervalDirection==='descending'?-1:session.intervalDirection==='mixed'&&Math.random()<.5?-1:1;
  const rootMidi=session.startMode==='fixed'?12*(session.fixedOctave+1)+session.fixedPitch:(direction===1?48:64)+Math.floor(Math.random()*17);
  const targetMidi=rootMidi+direction*item.semitones;
  return {...item,rootMidi,targetMidi,direction,choiceOptions:choices,keyName:null,usedChromatic:false};
}

function chordQuestion(session){
  const key=randomFrom(keys.filter(item=>session.keys.includes(item.value)));let item;let choices;
  if(session.chordMode==='warmup'){
    const bank=warmupBank[session.tonality];item=randomItem(bank,state.lastQuestionId);state.lastQuestionId=item.id;
    item={...item,chords:item.tokens.map(token=>chordNotes(token,session.tonality)),usedChromatic:false};
    const count={foundation:4,standard:5,advanced:6}[session.difficulty];
    choices=shuffle([item,...shuffle(bank.filter(option=>option.id!==item.id)).slice(0,count-1)]).map(option=>({id:option.id,name:option.name,subtitle:option.subtitle}));
  }else{
    item=generatedProgression(session);state.lastQuestionId=item.id;choices=progressionChoices(item,session);
  }
  return {...item,rootMidi:48+key.value,keyName:key.name,choiceOptions:choices};
}

function startSession(){
  const error=validateConfig();$('#config-error').textContent=error;if(error)return;
  state.sessionConfig=clone(config);resetSessionState();switchView('train');newQuestion();renderSessionTags();updateLiveStats();
  void prepareInstrument(state.sessionConfig.instrument).catch(()=>{});
}

function resetSessionState(){
  clearInterval(state.timerId);
  cancelSamplePlayback();
  Object.assign(state,{question:null,lastQuestionId:null,index:0,correct:0,streak:0,maxStreak:0,answers:[],startedAt:null,questionStartedAt:null,locked:false,timerId:null,audioBusy:false});
  $('#timer').textContent='00:00';$('#feedback-bar').className='feedback-bar';$('#feedback-text').textContent='播放题目后选择答案';
}

function restartSession(){resetSessionState();newQuestion();renderSessionTags();updateLiveStats()}

function newQuestion(){
  cancelSamplePlayback();state.audioBusy=false;state.locked=false;state.question=state.sessionConfig.mode==='interval'?intervalQuestion(state.sessionConfig):chordQuestion(state.sessionConfig);
  state.questionStartedAt=Date.now();renderQuestion();
}

function renderSessionTags(){
  const session=state.sessionConfig;const tags=session.mode==='interval'?
    ['音程辨认',difficultyNames[session.difficulty],session.startMode==='random'?'随机起始音':`固定 ${keys.find(item=>item.value===session.fixedPitch).name}${session.fixedOctave}`,session.intervalPlayback==='simultaneous'?'方向不适用':intervalDirectionNames[session.intervalDirection],session.intervalPlayback==='simultaneous'?'同时发声':'依次发声',intervalRangeLabel(session.intervals),instrumentNames[session.instrument]]:
    ['和弦进行',chordModeNames[session.chordMode],tonalityNames[session.tonality],`${session.keys.length} 个调性中心`,instrumentNames[session.instrument]];
  $('#session-tags').innerHTML=tags.map(text=>`<span>${text}</span>`).join('');
}

function renderQuestion(){
  const interval=state.sessionConfig.mode==='interval';
  $('#question-kicker').textContent=`${interval?'INTERVAL':'CHORD PROGRESSION'} · ${String(state.index+1).padStart(2,'0')}`;
  $('#question-title').textContent=interval?'听辨这两个音的距离':state.sessionConfig.chordMode==='warmup'?'识别这段常见和弦进行':'找出最符合音响的和声进行';
  const directionNote=state.sessionConfig.intervalPlayback==='simultaneous'?'无方向':state.sessionConfig.intervalDirection==='mixed'?'上行或下行随机':intervalDirectionNames[state.sessionConfig.intervalDirection];
  $('#question-note').textContent=interval?`${state.sessionConfig.startMode==='random'?'起始音每题随机':'本轮使用固定起始音'} · ${directionNote} · ${state.sessionConfig.intervalPlayback==='simultaneous'?'两音同时发声':'两音依次发声'} · ${state.sessionConfig.intervals.length} 个音程按距离排列 · ${instrumentNames[state.sessionConfig.instrument]}音色`:`${tonalityNames[state.sessionConfig.tonality]} · 从 ${state.sessionConfig.keys.length} 个调性中心随机移调 · ${instrumentNames[state.sessionConfig.instrument]}音色`;
  $('#question-number').textContent=String(state.index+1);$('#question-total').textContent=`/ ${state.sessionConfig.questionCount}`;
  $('#answer-grid').classList.toggle('is-interval',interval);
  $('#answer-grid').innerHTML=state.question.choiceOptions.map((option,index)=>`<button data-answer="${option.id}"><span>${option.name}${option.subtitle?`<small>${option.subtitle}</small>`:''}</span>${interval?'':`<kbd>${index+1}</kbd>`}</button>`).join('');
  $$('#answer-grid button').forEach(button=>button.addEventListener('click',()=>submitAnswer(button.dataset.answer,button)));
}

async function getAudioContext(){
  if(!state.audioContext){
    state.audioContext=new (window.AudioContext||window.webkitAudioContext)();
    const compressor=state.audioContext.createDynamicsCompressor();
    compressor.threshold.value=-18;compressor.knee.value=16;compressor.ratio.value=4;
    compressor.attack.value=.004;compressor.release.value=.2;compressor.connect(state.audioContext.destination);
    state.audioBus={input:compressor};
  }
  if(state.audioContext.state==='suspended')await state.audioContext.resume();
  return state.audioContext;
}

function setSoundfontStatus(kind,text){
  const status=$('#soundfont-status');if(!status)return;
  status.classList.toggle('is-loading',kind==='loading');status.classList.toggle('is-error',kind==='error');
  status.querySelector('span').textContent=text;
}

async function prepareInstrument(instrument){
  const ctx=await getAudioContext();
  if(state.soundfontPlayers[instrument]){
    if(config.instrument===instrument)setSoundfontStatus('ready',`${instrumentNames[instrument]}真实采样已就绪，可离线播放。`);
    return state.soundfontPlayers[instrument];
  }
  if(!state.soundfontPromises[instrument]){
    const preset=soundfontPresets[instrument]?.();
    if(!window.WebAudioFontPlayer||!preset)throw new Error(`缺少 ${instrumentNames[instrument]} SoundFont 资源`);
    setSoundfontStatus('loading',`正在解码${instrumentNames[instrument]}真实采样…`);
    state.soundfontPromises[instrument]=window.WebAudioFontPlayer.load(preset,ctx,state.audioBus).then(player=>{
      state.soundfontPlayers[instrument]=player;
      if(config.instrument===instrument)setSoundfontStatus('ready',`${instrumentNames[instrument]}真实采样已就绪，可离线播放。`);
      return player;
    }).catch(error=>{
      delete state.soundfontPromises[instrument];
      setSoundfontStatus('error',`${instrumentNames[instrument]}采样加载失败，将使用备用合成音。`);
      throw error;
    });
  }
  return state.soundfontPromises[instrument];
}

function cancelSamplePlayback(){
  Object.values(state.soundfontPlayers).forEach(player=>player.cancelQueue().catch(()=>{}));
  const play=$('#play-question');const wave=$('.wave');
  if(play){play.disabled=false;play.classList.remove('is-playing');play.querySelector('span').textContent='▶'}
  if(wave)wave.classList.remove('is-playing');
}

function midiToHz(midi){return 440*(2**((midi-69)/12))}

function fallbackSynthTone(ctx,midi,start,duration,volume=.12){
  const instrument=state.sessionConfig.instrument;
  const presets={
    piano:{types:['triangle','sine'],attack:.008,release:.88,detune:[0,4]},
    guitar:{types:['triangle','sawtooth'],attack:.006,release:.72,detune:[0,-5]},
    sax:{types:['sawtooth','sine'],attack:.055,release:.92,detune:[0,7]},
    violin:{types:['sawtooth','triangle'],attack:.075,release:.96,detune:[0,-7]}
  };
  const preset=presets[instrument];const master=ctx.createGain();
  master.gain.setValueAtTime(.0001,start);master.gain.exponentialRampToValueAtTime(volume,start+preset.attack);
  if(instrument==='piano'||instrument==='guitar')master.gain.exponentialRampToValueAtTime(Math.max(.012,volume*.28),start+duration*.58);
  else master.gain.setValueAtTime(volume,start+duration*.72);
  master.gain.exponentialRampToValueAtTime(.0001,start+duration*preset.release);master.connect(ctx.destination);
  preset.types.forEach((type,index)=>{const osc=ctx.createOscillator();osc.type=type;osc.frequency.value=midiToHz(midi);osc.detune.value=preset.detune[index];const mix=ctx.createGain();mix.gain.value=index ? .26 : .74;osc.connect(mix).connect(master);osc.start(start);osc.stop(start+duration+.04)});
}

async function playQuestion(){
  if(!state.question||state.locked||state.audioBusy)return;ensureSessionStarted();state.audioBusy=true;
  const question=state.question;const session=state.sessionConfig;const play=$('#play-question');const wave=$('.wave');
  play.disabled=true;$('#feedback-text').textContent=`正在准备${instrumentNames[session.instrument]}真实采样…`;
  let player;let ctx;let usedFallback=false;
  try{ctx=await getAudioContext();player=await prepareInstrument(session.instrument);await player.cancelQueue()}
  catch(error){console.warn('SoundFont playback unavailable, using fallback synth.',error);ctx=await getAudioContext();usedFallback=true}
  if(question!==state.question){state.audioBusy=false;play.disabled=false;return}
  play.classList.add('is-playing');wave.classList.add('is-playing');play.querySelector('span').textContent='■';
  $('#feedback-text').textContent=usedFallback?'采样暂不可用，正在使用备用音色':'正在播放真实乐器采样';
  const settings=soundfontPlayback[session.instrument];const now=ctx.currentTime+.05;let animationMs;
  if(session.mode==='interval'){
    const simultaneous=session.intervalPlayback==='simultaneous';const targetStart=simultaneous?now:now+.92;const volume=simultaneous?settings.singleVolume*.82:settings.singleVolume;
    if(usedFallback){fallbackSynthTone(ctx,question.rootMidi,now,.76,simultaneous?.12:.15);fallbackSynthTone(ctx,question.targetMidi,targetStart,.82,simultaneous?.12:.15)}
    else{player.queueWaveTable(now,question.rootMidi,settings.noteDuration,volume);player.queueWaveTable(targetStart,question.targetMidi,settings.noteDuration,volume)}
    animationMs=simultaneous?1450:2150;
  }else{
    question.chords.forEach((notes,chordIndex)=>{
      const chordStart=now+chordIndex*.9;
      notes.forEach((note,noteIndex)=>{
        const start=chordStart+noteIndex*settings.strum;const midi=question.rootMidi+note;
        if(usedFallback)fallbackSynthTone(ctx,midi,start,settings.chordDuration,.062);
        else player.queueWaveTable(start,midi,settings.chordDuration,settings.chordVolume);
      });
    });
    animationMs=question.chords.length*900+160;
  }
  setTimeout(stopAnimation,animationMs);
  function stopAnimation(){
    if(question!==state.question)return;
    state.audioBusy=false;play.disabled=false;play.classList.remove('is-playing');wave.classList.remove('is-playing');play.querySelector('span').textContent='▶';
    if(!state.locked)$('#feedback-text').textContent='请选择答案';
  }
}

function ensureSessionStarted(){if(state.startedAt)return;state.startedAt=Date.now();state.questionStartedAt=Date.now();state.timerId=setInterval(updateTimer,1000)}

function submitAnswer(answerId,button){
  if(state.locked||!state.question)return;ensureSessionStarted();state.locked=true;
  const correct=answerId===state.question.id;const elapsed=Date.now()-state.questionStartedAt;
  if(correct)state.correct++;state.streak=correct?state.streak+1:0;state.maxStreak=Math.max(state.maxStreak,state.streak);
  state.answers.push({question:state.question.id,answer:answerId,correct,elapsed,key:state.question.keyName,chromatic:Boolean(state.question.usedChromatic)});
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
  const record={
    id:crypto.randomUUID?crypto.randomUUID():String(endedAt),mode:state.sessionConfig.mode,difficulty:state.sessionConfig.difficulty,
    score,correct:state.correct,total,maxStreak:state.maxStreak,
    averageResponseMs:Math.round(state.answers.reduce((sum,item)=>sum+item.elapsed,0)/state.answers.length),
    durationSeconds:Math.round((endedAt-state.startedAt)/1000),createdAt:new Date().toISOString(),instrument:state.sessionConfig.instrument,
    startMode:state.sessionConfig.startMode,fixedPitch:state.sessionConfig.fixedPitch,fixedOctave:state.sessionConfig.fixedOctave,
    intervalDirection:state.sessionConfig.intervalDirection,intervalPlayback:state.sessionConfig.intervalPlayback,
    chordMode:state.sessionConfig.chordMode,tonality:state.sessionConfig.tonality,keys:state.sessionConfig.keys,
    intervals:state.sessionConfig.intervals,chromaticHarmonies:state.sessionConfig.chromaticHarmonies,
    allowChromatic:state.sessionConfig.mode==='progression'&&state.sessionConfig.chordMode==='generated'&&state.sessionConfig.chromaticHarmonies.length>0,
    answers:state.answers
  };
  saveHistory([record,...historyData()]);renderProfilePreview();renderProgress();$('#dialog-score').textContent=score;
  const focus=state.sessionConfig.mode==='interval'?'音程距离':'和声功能';
  $('#dialog-summary').textContent=score>=80?`答对 ${state.correct} 题，${focus}辨认稳定。`:`答对 ${state.correct} 题，建议缩小范围后再建立稳定参照。`;
  $('#session-dialog').showModal();
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
  $('#ability-score').textContent=records.length?overall:'—';$('.ability-score').style.setProperty('--score',overall);$('#ability-level').textContent=level;$('#ability-summary').textContent=records.length?`总体准确率 ${overallAccuracy}%，近期稳定性 ${consistency} 分。评分会随着两类训练内容的覆盖变得更准确。`:'完成一轮训练后，这里会给出你的能力概览。';$('#report-subtitle').textContent=records.length?`基于 ${records.length} 次训练、${records.reduce((sum,item)=>sum+item.total,0)} 道题动态生成。`:'完成测试后生成你的能力基线。';
  $('#skill-list').innerHTML=[['音程辨认',intervalScore,intervalRecords.length],['和弦进行',progressionScore,progressionRecords.length],['稳定性',consistency,records.length],['训练广度',breadth,records.length]].map(([name,score,count])=>`<div><div class="skill-head"><span>${name}${count?'':' · 暂无数据'}</span><strong>${count?score:'—'}</strong></div><div class="skill-track"><i style="width:${count?score:0}%"></i></div></div>`).join('');
  renderTrend(records.slice(0,12).reverse());renderInsights({records,intervalScore,progressionScore,consistency});renderRecords();
}

function renderTrend(records){
  const container=$('#trend-chart');if(!records.length){container.innerHTML='<div class="empty-state"><strong>趋势等待第一次训练</strong>完成测试后会生成准确率曲线。</div>';return}
  const w=850,h=210,pad=32;const x=i=>records.length===1?w/2:pad+i*((w-pad*2)/(records.length-1));const y=score=>h-pad-score/100*(h-pad*2);const points=records.map((item,index)=>`${x(index)},${y(item.score)}`).join(' ');const area=`${x(0)},${h-pad} ${points} ${x(records.length-1)},${h-pad}`;
  container.innerHTML=`<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="准确率趋势图"><defs><linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#caff58" stop-opacity=".2"/><stop offset="1" stop-color="#caff58" stop-opacity="0"/></linearGradient></defs>${[0,25,50,75,100].map(v=>`<line class="chart-gridline" x1="${pad}" y1="${y(v)}" x2="${w-pad}" y2="${y(v)}"/><text class="chart-label" x="0" y="${y(v)+4}">${v}</text>`).join('')}<polygon class="chart-area" points="${area}"/><polyline class="chart-line" points="${points}"/>${records.map((item,index)=>`<circle class="chart-point" cx="${x(index)}" cy="${y(item.score)}" r="5"><title>${item.score} 分 · ${formatDate(item.createdAt)}</title></circle>`).join('')}</svg>`;
}

function renderInsights({records,intervalScore,progressionScore,consistency}){
  let advice;
  if(!records.length)advice=[['先建立基线','从音程标准难度或和弦常见进行热身开始，完成第一轮训练。'],['一次只加一个变量','准确率稳定后，再扩大音程范围或加入一种调外和声。']];
  else{const weaker=intervalScore&&progressionScore?(intervalScore<=progressionScore?'音程辨认':'和弦进行'):(!intervalScore?'音程辨认':'和弦进行');advice=[[`优先练习${weaker}`,'该分项当前提升空间更大。先缩小范围，连续完成 3 轮后再增加内容。'],['控制训练变量',consistency<70?'近期波动较大。每次只改变音程范围、调式或音色中的一项。':'稳定性良好，可以增加复音程或一种调外和声。'],['跨音色验证','同一组设置分别使用钢琴和小提琴，能减少对单一泛音特征的依赖。'],['保持短时高频','每次 5–10 分钟、每周至少 4 次，比一次长时间训练更利于形成听觉记忆。']]}
  $('#insight-list').innerHTML=advice.map(([title,text])=>`<div class="insight-item"><strong>${title}</strong><p>${text}</p></div>`).join('');
}

function recordDetail(record){
  if(record.mode==='interval'){const direction=record.intervalDirection||(record.includeDescending?'mixed':'ascending');return `${record.startMode==='fixed'?'固定起始音':'随机起始音'} · ${record.intervalPlayback==='simultaneous'?'方向不适用':intervalDirectionNames[direction]} · ${record.intervalPlayback==='simultaneous'?'同时发声':'依次发声'}`}
  if(record.chordMode)return `${chordModeNames[record.chordMode]||'和弦训练'} · ${tonalityNames[record.tonality]||'大调'}`;
  return record.allowChromatic?'含离调':'调内';
}

function renderRecords(){
  const filter=$('#history-filter').value;const records=historyData().filter(item=>filter==='all'||item.mode===filter);
  $('#records-list').innerHTML=records.length?records.map(record=>`<article class="record-row"><div class="record-mode"><span class="record-icon">${record.mode==='interval'?'↕':'♬'}</span><div>${record.mode==='interval'?'音程辨认':'和弦进行'}<div class="record-meta">${difficultyNames[record.difficulty]||'标准'} · ${instrumentNames[record.instrument]||'钢琴'} · ${recordDetail(record)}</div></div></div><div class="record-date">${formatDate(record.createdAt)}</div><div class="record-meta">${record.correct}/${record.total} · ${formatDuration(record.durationSeconds)}</div><div class="record-score">${record.score} 分</div></article>`).join(''):'<div class="empty-state"><strong>还没有训练记录</strong>完成一轮训练后，结果会自动保存在这里。</div>';
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
  $$('#instrument-options button').forEach(button=>button.addEventListener('click',()=>{config.instrument=button.dataset.instrument;syncConfigUI();void prepareInstrument(config.instrument).catch(()=>{})}));
  $$('#start-mode-options button').forEach(button=>button.addEventListener('click',()=>{config.startMode=button.dataset.startMode;syncConfigUI()}));
  $$('#fixed-octave-options button').forEach(button=>button.addEventListener('click',()=>{config.fixedOctave=Number(button.dataset.octave);syncConfigUI()}));
  $$('#interval-direction-options button').forEach(button=>button.addEventListener('click',()=>setIntervalDirection(button.dataset.intervalDirection)));
  $$('#interval-playback-options button').forEach(button=>button.addEventListener('click',()=>{config.intervalPlayback=button.dataset.intervalPlayback;syncConfigUI()}));
  $$('#interval-preset-options button').forEach(button=>button.addEventListener('click',()=>{config.intervals=[...intervalRangePresets[button.dataset.intervalPreset]];syncConfigUI()}));
  $$('#chord-mode-options button').forEach(button=>button.addEventListener('click',()=>{config.chordMode=button.dataset.chordMode;syncConfigUI()}));
  $$('#tonality-options button').forEach(button=>button.addEventListener('click',()=>{config.tonality=button.dataset.tonality;syncConfigUI()}));
  $('#select-all-keys').addEventListener('click',()=>{config.keys=keys.map(item=>item.value);syncConfigUI()});
  $('#clear-keys').addEventListener('click',()=>{config.keys=[];syncConfigUI()});
  $('#start-session').addEventListener('click',startSession);$('#open-progress').addEventListener('click',()=>switchView('progress'));$$('[data-go]').forEach(button=>button.addEventListener('click',()=>switchView(button.dataset.go)));
  $('#play-question').addEventListener('click',playQuestion);$('#restart-session').addEventListener('click',restartSession);$('#history-filter').addEventListener('change',renderRecords);$('#print-report').addEventListener('click',()=>window.print());
  $('#dialog-close').addEventListener('click',()=>$('#session-dialog').close());$('#train-again').addEventListener('click',()=>{$('#session-dialog').close();restartSession()});$('#view-progress').addEventListener('click',()=>{$('#session-dialog').close();switchView('progress')});
  $('#export-history').addEventListener('click',()=>{const blob=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),sessions:historyData()},null,2)],{type:'application/json'});const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=`shengjie-history-${new Date().toISOString().slice(0,10)}.json`;link.click();URL.revokeObjectURL(link.href)});
  document.addEventListener('keydown',event=>{if(!$('#train-view').classList.contains('is-active')||$('#session-dialog').open)return;if(event.code==='Space'){event.preventDefault();playQuestion();return}const index=Number(event.key)-1;const buttons=$$('#answer-grid button');if(index>=0&&index<buttons.length)buttons[index].click()});
}

renderOptionControls();bindEvents();syncConfigUI();renderProgress();registerWebMCPTools();
