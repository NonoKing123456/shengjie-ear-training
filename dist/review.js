// The notation and all replay actions are derived from the MIDI pitches used by the question.
const STAFF_LETTERS=['C','D','E','F','G','A','B'];
const NATURAL_PITCHES=[0,2,4,5,7,9,11];
const VEX_ACCIDENTALS={'-2':'bb','-1':'b',1:'#',2:'##'};

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

function renderIntervalScore(host,notes,intervalId,direction){
  const VF=window.VexFlow;
  if(!VF)throw new Error('VexFlow is unavailable');
  const simultaneous=state.sessionConfig.intervalPlayback==='simultaneous';
  const spelled=spelledPair(notes[0],notes[1],intervalId,direction);
  const layout=Math.min(...notes)>=60?'treble':Math.max(...notes)<60?'bass':'grand';
  const clefs=layout==='grand'?['treble','bass']:[layout];
  const width=Math.max(320,Math.min(680,Math.floor(host.clientWidth||680)));
  const baseHeight=layout==='grand'?224:158;
  const staveTop=clef=>layout==='grand'?(clef==='treble'?12:104):28;
  const clefFor=midi=>layout==='grand'?(midi>=60?'treble':'bass'):layout;
  const noteY=spelled.map((spec,index)=>staveTop(clefFor(notes[index]))+40.5-(spec.index-(clefFor(notes[index])==='treble'?38:26))*5);
  const topPad=Math.max(0,Math.ceil(18-Math.min(...noteY)));
  const bottomPad=Math.max(0,Math.ceil(Math.max(...noteY)+18-baseHeight));
  const height=baseHeight+topPad+bottomPad;
  const canvas=document.createElement('div');canvas.className='interval-score-canvas';host.replaceChildren(canvas);
  const renderer=new VF.Renderer(canvas,VF.Renderer.Backends.SVG);renderer.resize(width,height);
  const context=renderer.getContext(),staves=new Map(),voices=[];
  clefs.forEach(clef=>{
    const stave=new VF.Stave(18,staveTop(clef)+topPad,width-36)
      .setBegBarType(VF.Barline.type.NONE).setEndBarType(VF.Barline.type.NONE).addClef(clef);
    stave.setContext(context).draw();stave.setNoteStartX(stave.getNoteStartX()+28);staves.set(clef,stave);
  });
  const makeNote=(specs,clef)=>{
    const sorted=[...specs].sort((a,b)=>a.index-b.index);
    const note=new VF.StaveNote({clef,keys:sorted.map(spec=>`${STAFF_LETTERS[((spec.index%7)+7)%7].toLowerCase()}/${Math.floor(spec.index/7)}`),duration:'q',auto_stem:true});
    sorted.forEach((spec,index)=>{const mark=VEX_ACCIDENTALS[spec.accidental];if(mark)note.addModifier(new VF.Accidental(mark),index)});
    note.setStave(staves.get(clef));return note;
  };
  const noteObjects=Array(2);
  clefs.forEach(clef=>{
    const tickables=[];
    if(simultaneous){
      const entries=spelled.map((spec,index)=>({spec,index})).filter(({index})=>clefFor(notes[index])===clef);
      if(entries.length){const note=makeNote(entries.map(entry=>entry.spec),clef);entries.forEach(entry=>noteObjects[entry.index]=note);tickables.push(note)}
      else tickables.push(new VF.GhostNote({duration:'q'}));
    }else spelled.forEach((spec,index)=>{
      if(clefFor(notes[index])===clef){const note=makeNote([spec],clef);noteObjects[index]=note;tickables.push(note)}
      else tickables.push(new VF.GhostNote({duration:'q'}));
    });
    voices.push({stave:staves.get(clef),voice:new VF.Voice({num_beats:simultaneous?1:2,beat_value:4}).setMode(VF.Voice.Mode.SOFT).addTickables(tickables)});
  });
  new VF.Formatter().joinVoices(voices.map(item=>item.voice)).formatToStave(voices.map(item=>item.voice),voices[0].stave);
  voices.forEach(item=>item.voice.draw(context,item.stave));
  const svg=canvas.querySelector('svg');svg.setAttribute('viewBox',`0 0 ${width} ${height}`);svg.setAttribute('role','group');svg.setAttribute('aria-label',`${simultaneous?'同时发声':'依次发声'}的音程五线谱`);
  if(!simultaneous){
    const centers=noteObjects.map(note=>note.getAbsoluteX());
    const NS='http://www.w3.org/2000/svg';
    centers.forEach((center,index)=>{
      const left=index===0?Math.max(80,center-65):(centers[0]+center)/2+5;
      const right=index===0?(center+centers[1])/2-5:Math.min(width-16,center+65);
      const hit=document.createElementNS(NS,'rect');
      for(const [name,value] of Object.entries({x:left,y:10,width:Math.max(28,right-left),height:height-20,rx:9,class:'interval-note-hit','data-note':index,role:'button',tabindex:0,'aria-label':`试听第 ${index+1} 个音`}))hit.setAttribute(name,String(value));
      svg.append(hit);
    });
  }
}

function reviewZone(zone,label,interval,notes,direction){
  const correct=zone==='correct';
  return `<section class="review-zone interval-review-row ${correct?'is-correct':'is-mine'}" data-zone="${zone}" aria-label="${label}">
    <div class="review-zone-title"><strong>${label}：${interval.name}</strong><span>${interval.semitones} 个半音</span></div>
    <div class="interval-score-host" data-zone="${zone}" role="button" tabindex="0" aria-label="点击播放${label}整段音程"></div>
  </section>`;
}

function renderJazzReview(correct){
  const panel=$('#review-content'),question=state.question;
  const actual=question.options.find(option=>option.id===question.id);
  const mine=question.options.find(option=>option.id===state.selectedAnswer)||actual;
  const differences=Array.from({length:Math.max(actual.voicings.length,mine.voicings.length)},(_,index)=>{
    const a=actual.voicings[index]?.symbol,m=mine?.voicings?.[index]?.symbol;
    return a===m?null:{index,correct:a||'缺少',mine:m||'多出'};
  }).filter(Boolean);
  const differenceMap=Array.from({length:actual.voicings.length},(_,index)=>differences.some(item=>item.index===index));
  const layout=JazzNotation.progressionLayout([actual.voicings,mine.voicings]);
  const nextLabel=state.index===state.sessionConfig.questionCount-1?'查看本轮结果 →':'下一题 →';
  const firstDifference=differences[0];
  const score=JazzNotation.reviewScore(actual.voicings,correct?null:mine.voicings,differenceMap,layout);
  panel.innerHTML=`<div class="review-heading ${correct?'is-correct':'is-wrong'}"><strong>${correct?'✓ 答对了':`✕ 答错了 · 第 ${firstDifference.index+1} 个和弦不同`}</strong></div>
    <div class="jazz-review-score-scroll"><div class="jazz-review-score-canvas" style="--jazz-score-width:${layout.width}px"><div class="jazz-harmony-rail-host"></div>${score}</div></div>
    <div class="review-footer"><button type="button" class="review-next" data-next>${nextLabel}</button></div>
    <span class="sr-only" id="review-playback-status" role="status" aria-live="polite"></span>`;
  const engravedLayout=JazzNotation.mountReviewScores(panel)||layout;
  panel.querySelector('.jazz-harmony-rail-host').innerHTML=JazzNotation.harmonyRail(actual.voicings,mine.voicings,differenceMap,engravedLayout);
}

function renderReview(correct){
  const panel=$('#review-content'),question=state.question,interval=state.sessionConfig.mode==='interval';
  $('#sound-stage').classList.add('is-review');$('#play-question').classList.add('is-hidden');panel.classList.remove('is-hidden');
  const nextLabel=state.index===state.sessionConfig.questionCount-1?'查看本轮结果 →':'下一题 →';
  if(state.sessionConfig.mode==='chordProgression'){renderJazzReview(correct)}
  else if(interval){
    const selected=intervalBank.find(item=>item.id===state.selectedAnswer);
    const correctNotes=[question.rootMidi,question.targetMidi];
    const mineNotes=[question.rootMidi,question.rootMidi+question.direction*selected.semitones];
    const heading=correct?`<div class="review-heading is-correct"><strong>✓ 答对了</strong><span>${question.name} · ${question.semitones} 个半音</span></div>`:
      `<div class="review-heading is-wrong"><strong>✕ 答错了</strong><span>你的答案：${selected.name}　正确答案：${question.name}　相差 ${Math.abs(selected.semitones-question.semitones)} 个半音</span></div>`;
    panel.innerHTML=`${heading}<div class="review-zones">${reviewZone('correct','正确答案',question,correctNotes,question.direction)}${correct?'':reviewZone('mine','我的答案',selected,mineNotes,question.direction)}</div>
      <div class="review-footer"><button type="button" class="review-next" data-next>${nextLabel}</button></div><span class="sr-only" id="review-playback-status" role="status" aria-live="polite"></span>`;
    renderIntervalScore(panel.querySelector('.interval-score-host[data-zone="correct"]'),correctNotes,question.id,question.direction);
    if(!correct)renderIntervalScore(panel.querySelector('.interval-score-host[data-zone="mine"]'),mineNotes,selected.id,question.direction);
  }else throw new Error('Unsupported review mode');
}

$('#review-content').addEventListener('click',event=>{
  const target=event.target.closest('[data-next],.interval-note-hit,.interval-score-host,.jazz-harmony-choice,.jazz-progression-chord,.jazz-score-row');if(!target)return;
  if(target.hasAttribute('data-next')){nextQuestion();return}
  if(target.classList.contains('interval-note-hit')){void startPlayback('single',target.closest('.interval-score-host').dataset.zone,Number(target.dataset.note));return}
  if(target.classList.contains('interval-score-host')){void startPlayback(target.dataset.zone,target.dataset.zone);return}
  if(target.classList.contains('jazz-harmony-choice')){void startPlayback('single',target.dataset.zone==='shared'?'correct':target.dataset.zone,Number(target.dataset.chord));return}
  if(target.classList.contains('jazz-progression-chord')){void startPlayback('single',target.dataset.zone,Number(target.dataset.chord));return}
  if(target.classList.contains('jazz-score-row')){void startPlayback(target.dataset.zone,target.dataset.zone);return}
});
$('#review-content').addEventListener('keydown',event=>{
  const note=event.target.closest('.interval-note-hit');if(!note||!['Enter','Space'].includes(event.code))return;
  event.preventDefault();event.stopPropagation();void startPlayback('single',note.closest('.interval-score-host').dataset.zone,Number(note.dataset.note));
});
$('#review-content').addEventListener('keydown',event=>{
  const score=event.target.closest('.interval-score-host');if(!score||event.target!==score||!['Enter','Space'].includes(event.code))return;
  event.preventDefault();event.stopPropagation();void startPlayback(score.dataset.zone,score.dataset.zone);
});
$('#review-content').addEventListener('keydown',event=>{
  const chord=event.target.closest('.jazz-harmony-choice');if(!chord||!['Enter','Space'].includes(event.code))return;
  event.preventDefault();event.stopPropagation();void startPlayback('single',chord.dataset.zone==='shared'?'correct':chord.dataset.zone,Number(chord.dataset.chord));
});
$('#review-content').addEventListener('keydown',event=>{
  const chord=event.target.closest('.jazz-progression-chord');if(!chord||!['Enter','Space'].includes(event.code))return;
  event.preventDefault();event.stopPropagation();void startPlayback('single',chord.dataset.zone,Number(chord.dataset.chord));
});
$('#review-content').addEventListener('keydown',event=>{
  const row=event.target.closest('.jazz-score-row');if(!row||event.target!==row||!['Enter','Space'].includes(event.code))return;
  event.preventDefault();event.stopPropagation();void startPlayback(row.dataset.zone,row.dataset.zone);
});
