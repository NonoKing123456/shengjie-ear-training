// The notation and all replay actions are derived from the MIDI pitches used by the question.
const STAFF_LETTERS=['C','D','E','F','G','A','B'];
const NATURAL_PITCHES=[0,2,4,5,7,9,11];
const ACCIDENTALS={'-2':'𝄫','-1':'♭',0:'',1:'♯',2:'𝄪'};

function spelledRoot(midi){
  const preferred=['C','D','D','E','E','F','F','G','A','A','B','B'];
  const letter=preferred[midi%12],degree=STAFF_LETTERS.indexOf(letter);
  const octave=Math.floor(midi/12)-1;
  const natural=12*(octave+1)+NATURAL_PITCHES[degree];
  return {index:octave*7+degree,accidental:midi-natural};
}

function spelledPair(rootMidi,targetMidi,intervalId,direction){
  const root=spelledRoot(rootMidi);
  const number=intervalId==='TT'?4:Number(intervalId.match(/\d+/)?.[0]||2);
  const targetIndex=root.index+direction*(number-1);
  const octave=Math.floor(targetIndex/7),degree=((targetIndex%7)+7)%7;
  const natural=12*(octave+1)+NATURAL_PITCHES[degree];
  return [root,{index:targetIndex,accidental:targetMidi-natural}];
}

function scoreSvg(notes,intervalId,direction,zone){
  const spelled=spelledPair(notes[0],notes[1],intervalId,direction);
  const simultaneous=state.sessionConfig.intervalPlayback==='simultaneous';
  const min=Math.min(...notes),max=Math.max(...notes);
  const layout=min<42||max>90?'grand':min>=55?'treble':max<=65?'bass':'grand';
  const height=layout==='grand'?230:158;
  const staves=layout==='grand'?[{clef:'treble',top:42,bottom:90},{clef:'bass',top:144,bottom:192}]:[{clef:layout,top:54,bottom:102}];
  const staffLines=staves.map(staff=>{
    const lines=Array.from({length:5},(_,i)=>`<line x1="46" y1="${staff.top+i*12}" x2="438" y2="${staff.top+i*12}"/>`).join('');
    const symbol=staff.clef==='treble'?'𝄞':'𝄢';
    return `<g class="score-staff">${lines}<text class="score-clef" x="60" y="${staff.top+44}">${symbol}</text></g>`;
  }).join('');
  const positions=spelled.map((note,index)=>{
    const clef=layout==='grand'?(notes[index]>=60?'treble':'bass'):layout;
    const staff=staves.find(item=>item.clef===clef);
    const base=clef==='treble'?30:18; // E4 and G2, the bottom staff lines.
    let shownIndex=note.index;
    let y=staff.bottom-(shownIndex-base)*6;
    let octaveShift=0;
    while(y<staff.top-24){shownIndex-=7;y+=42;octaveShift++}
    while(y>staff.bottom+24){shownIndex+=7;y-=42;octaveShift--}
    const x=simultaneous?240:index===0?159:340;
    return {...note,staff,x,y,octaveShift,index};
  });
  if(simultaneous&&Math.abs(positions[0].y-positions[1].y)<=7&&positions[0].staff===positions[1].staff)positions[1].x+=21;
  const marks=positions.map(note=>{
    const {x,y,staff,index,octaveShift}=note;
    const ledgers=[];
    for(let ly=staff.top-12;ly>=y-1;ly-=12)ledgers.push(ly);
    for(let ly=staff.bottom+12;ly<=y+1;ly+=12)ledgers.push(ly);
    const ledger=ledgers.map(ly=>`<line class="score-ledger" x1="${x-18}" y1="${ly}" x2="${x+18}" y2="${ly}"/>`).join('');
    const accidental=ACCIDENTALS[note.accidental]??(note.accidental>0?'♯':'♭');
    const octaveLabel=octaveShift?`${Math.abs(octaveShift)===1?'8':Math.abs(octaveShift)===2?'15':'22'}${Math.abs(octaveShift)===1?(octaveShift>0?'va':'vb'):(octaveShift>0?'ma':'mb')}`:'';
    const annotation=octaveLabel?`<text class="score-octave" x="${x}" y="${octaveShift>0?Math.max(23,y-29):Math.min(height-8,y+38)}">${octaveLabel}</text>`:'';
    const order=simultaneous?'':`<text class="score-order" x="${x+25}" y="${y-14}">${index===0?'①':'②'}</text>`;
    return `<g class="score-note" role="button" tabindex="0" data-zone="${zone}" data-note="${index}" aria-label="单独听${zone==='mine'?'我的答案':'正确答案'}第${index===0?'一':'二'}个音"><title>单独听第${index===0?'一':'二'}个音</title>${ledger}${annotation}<text class="score-accidental" x="${x-29}" y="${y+7}">${accidental}</text><ellipse class="score-head" cx="${x}" cy="${y}" rx="12" ry="8" transform="rotate(-18 ${x} ${y})"/><line class="score-stem" x1="${x+11}" y1="${y-2}" x2="${x+11}" y2="${y-42}"/>${order}<circle class="score-hit" cx="${x}" cy="${y}" r="13"/></g>`;
  }).join('');
  const arrow=simultaneous?'':`<path class="score-arrow" d="M 203 ${Math.max(28,Math.min(height-20,positions[0].y))} Q 250 18 298 ${Math.max(28,Math.min(height-20,positions[1].y))}"/><path class="score-arrow-head" d="M 291 ${Math.max(28,Math.min(height-20,positions[1].y))-5} L 300 ${Math.max(28,Math.min(height-20,positions[1].y))} L 291 ${Math.max(28,Math.min(height-20,positions[1].y))+5}"/>`;
  return `<svg class="interval-score" viewBox="0 0 480 ${height}" role="group" aria-label="${simultaneous?'同时发声':'依次发声'}的音程五线谱">${staffLines}${arrow}${marks}</svg>`;
}

function reviewZone(zone,label,interval,notes,direction){
  const correct=zone==='correct';
  return `<section class="review-zone ${correct?'is-correct':'is-mine'}" data-zone="${zone}" aria-label="${label}">
    <div class="review-zone-title"><strong>${correct?'✓':'○'} ${label}：${interval.name}</strong><span>${interval.semitones} 个半音</span></div>
    ${scoreSvg(notes,interval.id,direction,zone)}
    <div class="review-zone-actions"><button type="button" data-play="${zone}">重听${correct?'正确音程':'我的答案'}</button><button type="button" data-play="single" data-zone="${zone}" data-note="0">单独听${correct?'第一个音':'音 ①'}</button><button type="button" data-play="single" data-zone="${zone}" data-note="1">单独听${correct?'第二个音':'音 ②'}</button></div>
  </section>`;
}

function jazzZone(zone,item){
  const correct=zone==='correct';
  return `<section class="jazz-zone ${correct?'is-correct':'is-mine'}" data-zone="${zone}" aria-label="${correct?'正确答案':'我的答案'}">
    <div class="review-zone-title"><strong>${correct?'✓ 正确答案':'○ 我的答案'}</strong><span>${item.name}</span></div>
    <div class="jazz-chord-list">${item.voicings.map((chord,index)=>`<button type="button" class="jazz-chord" data-zone="${zone}" data-chord="${index}" aria-label="单独听第 ${index+1} 个和弦 ${chord.symbol}"><span class="jazz-chord-order">${String(index+1).padStart(2,'0')}</span><strong>${chord.symbol}</strong>${JazzNotation.svg(chord)}</button>`).join('')}</div>
    <div class="review-zone-actions"><button type="button" data-play="${zone}">重听${correct?'正确进行':'我的答案'}</button></div>
  </section>`;
}

function renderJazzReview(correct){
  const panel=$('#review-content'),question=state.question;
  const actual=question.options.find(option=>option.id===question.id);
  const mine=question.options.find(option=>option.id===state.selectedAnswer);
  const nextLabel=state.index===state.sessionConfig.questionCount-1?'查看本轮结果 →':'下一题 →';
  panel.innerHTML=`<div class="review-heading ${correct?'is-correct':'is-wrong'}"><strong>${correct?'✓ 回答正确':'✕ 这题答错了'}</strong><span>${question.keyName} ${tonalityNames[question.tonality]} · ${correct?actual.name:`我的答案：${mine.name}`}</span></div>
    <div class="jazz-zones">${jazzZone('correct',actual)}${correct?'':jazzZone('mine',mine)}</div>
    <div class="review-footer"><div class="review-footer-actions"><button type="button" data-play="question">再听一次题目</button>${correct?'':'<button type="button" data-play="ab">AB 对比播放</button>'}</div><button type="button" class="review-next" data-next>${nextLabel}</button></div>
    <p class="review-playback-status" id="review-playback-status" role="status" aria-live="polite">点击任意和弦单独试听 · 空格键重听原题</p>`;
}

function renderReview(correct){
  const panel=$('#review-content'),question=state.question,interval=state.sessionConfig.mode==='interval';
  $('#sound-stage').classList.add('is-review');$('#play-question').classList.add('is-hidden');panel.classList.remove('is-hidden');
  const nextLabel=state.index===state.sessionConfig.questionCount-1?'查看本轮结果 →':'下一题 →';
  if(state.sessionConfig.mode==='jazz'){renderJazzReview(correct)}
  else if(interval){
    const selected=intervalBank.find(item=>item.id===state.selectedAnswer);
    const correctNotes=[question.rootMidi,question.targetMidi];
    const mineNotes=[question.rootMidi,question.rootMidi+question.direction*selected.semitones];
    const heading=correct?`<div class="review-heading is-correct"><strong>✓ 回答正确</strong><span>${question.name} · ${question.semitones} 个半音</span></div>`:
      `<div class="review-heading is-wrong"><strong>✕ 这题答错了</strong><span>你的答案：${selected.name}　正确答案：${question.name}　相差 ${Math.abs(selected.semitones-question.semitones)} 个半音</span></div>`;
    panel.innerHTML=`${heading}<div class="review-zones">${reviewZone('correct','正确答案',question,correctNotes,question.direction)}${correct?'':reviewZone('mine','我的答案',selected,mineNotes,question.direction)}</div>
      <div class="review-footer"><div class="review-footer-actions"><button type="button" data-play="question">再听一次题目</button>${correct?'':'<button type="button" data-play="ab">AB 对比播放</button>'}</div><button type="button" class="review-next" data-next>${nextLabel}</button></div><p class="review-playback-status" id="review-playback-status" role="status" aria-live="polite">点击谱面音符可单独试听 · 空格键重听题目</p>`;
  }else{
    panel.innerHTML=`<div class="review-heading ${correct?'is-correct':'is-wrong'}"><strong>${correct?'✓ 回答正确':'✕ 这题答错了'}</strong><span>正确答案：${question.name}</span></div><div class="review-footer"><button type="button" data-play="question">再听一次题目</button><button type="button" class="review-next" data-next>${nextLabel}</button></div><p class="review-playback-status" id="review-playback-status" role="status" aria-live="polite">空格键重听题目</p>`;
  }
}

$('#review-content').addEventListener('click',event=>{
  const target=event.target.closest('[data-next],[data-play],.score-note,.jazz-chord');if(!target)return;
  if(target.hasAttribute('data-next')){nextQuestion();return}
  if(target.classList.contains('score-note')){void startPlayback('single',target.dataset.zone,Number(target.dataset.note));return}
  if(target.classList.contains('jazz-chord')){void startPlayback('single',target.dataset.zone,Number(target.dataset.chord));return}
  void startPlayback(target.dataset.play,target.dataset.zone||'correct',Number(target.dataset.note||0));
});
$('#review-content').addEventListener('keydown',event=>{
  const note=event.target.closest('.score-note');if(!note||event.code!=='Enter')return;
  event.preventDefault();event.stopPropagation();void startPlayback('single',note.dataset.zone,Number(note.dataset.note));
});
