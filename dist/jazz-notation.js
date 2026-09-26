// Convert generated jazz voicings into VexFlow input and mount engraved SVG scores.
const JazzNotation=(()=>{
  const letters=['C','D','E','F','G','A','B'];
  const naturals=[0,2,4,5,7,9,11];
  const tones={
    maj:[[0,0],[4,2],[7,4]],
    min:[[0,0],[3,2],[7,4]],
    dim:[[0,0],[3,2],[6,4]],
    ger6:[[0,0],[4,2],[7,4],[10,5]],
    maj7:[[0,0],[4,2],[7,4],[11,6],[14,1],[21,5]],
    m7:[[0,0],[3,2],[7,4],[10,6],[14,1],[17,3],[21,5]],
    '7':[[0,0],[4,2],[7,4],[10,6],[14,1],[21,5]],
    'm7♭5':[[0,0],[3,2],[6,4],[10,6],[17,3]],
    '°7':[[0,0],[3,2],[6,4],[9,6]],
    m6:[[0,0],[3,2],[7,4],[9,5],[14,1]],
    '7♭9':[[0,0],[4,2],[7,4],[10,6],[13,1],[20,5]],
    '7♯9':[[0,0],[4,2],[7,4],[10,6],[15,1],[20,5]],
    '7♭13':[[0,0],[4,2],[7,4],[10,6],[14,1],[20,5]]
  };
  const notationStore=new Map();let notationId=0;

  function spell(chord,midi){
    const rootLetter=letters.indexOf(chord.rootLetter||chord.symbol[0]);
    const interval=(midi-chord.root+120)%12;
    const tone=tones[chord.quality].find(([semitones])=>semitones%12===interval);
    if(!tone)throw new Error(`Unexpected pitch ${midi} in ${chord.symbol}`);
    const letter=(rootLetter+tone[1])%7;
    const pitchOctave=Math.floor(midi/12)-1;
    let best;
    for(let octave=pitchOctave-1;octave<=pitchOctave+1;octave++){
      const accidental=midi-(12*(octave+1)+naturals[letter]);
      if(!best||Math.abs(accidental)<Math.abs(best.accidental))best={midi,index:octave*7+letter,accidental};
    }
    if(Math.abs(best.accidental)>2)throw new Error(`Unspellable pitch ${midi} in ${chord.symbol}`);
    return best;
  }

  function voiceEntries(chord){
    if(chord.voices)return [
      {midi:chord.voices.B,staff:'bass'},{midi:chord.voices.T,staff:'bass'},
      {midi:chord.voices.A,staff:'treble'},{midi:chord.voices.S,staff:'treble'}
    ];
    if(Array.isArray(chord.right))return [
      ...(chord.bass==null?[]:[{midi:chord.bass,staff:'bass'}]),
      ...chord.right.map(midi=>({midi,staff:'treble'}))
    ];
    return chord.notes.map((midi,index)=>({midi,staff:chord.bass!=null&&index===0?'bass':'treble'}));
  }

  function accidentalName(value){return ({'-2':'bb','-1':'b',1:'#',2:'##'})[value]||''}
  function vexKey(note){return `${letters[((note.index%7)+7)%7].toLowerCase()}${accidentalName(note.accidental)}/${Math.floor(note.index/7)}`}
  function vexVoicing(chord,clef){
    return voiceEntries(chord).filter(entry=>entry.staff===clef).map(entry=>{
      const note=spell(chord,entry.midi);
      return {midi:entry.midi,key:vexKey(note),accidental:accidentalName(note.accidental),clef};
    });
  }

  function labelWidth(symbol){return Math.max(120,28+Array.from(symbol||'').length*15)}
  function progressionLayout(chordRows){
    const count=Math.max(0,...chordRows.map(row=>row?.length||0));
    const widths=Array.from({length:count},(_,index)=>Math.max(...chordRows.map(row=>labelWidth(row?.[index]?.symbol))));
    const centers=[];
    widths.forEach((nodeWidth,index)=>centers.push(index===0?118:centers[index-1]+(widths[index-1]+nodeWidth)/2));
    const width=Math.max(560,Math.ceil((centers.at(-1)||118)+(widths.at(-1)||120)/2+18));
    return {width,widths,centers};
  }

  function chordHitBounds(layout,centers,index,minLeft=0){
    const center=centers[index],halfWidth=layout.widths[index]/2,gap=14;
    const left=Math.max(minLeft,center-halfWidth,index?((centers[index-1]+center)/2+gap/2):0);
    const right=Math.min(layout.width,center+halfWidth,index<centers.length-1?((center+centers[index+1])/2-gap/2):layout.width);
    return {left,width:Math.max(0,right-left)};
  }

  function harmonyRail(correctChords,mineChords,differences=[],providedLayout){
    const layout=providedLayout||progressionLayout([correctChords,mineChords]);
    const nodes=layout.centers.map((center,index)=>{
      const correct=correctChords[index]?.symbol||'缺少';
      const mine=mineChords[index]?.symbol||correct;
      const {left,width}=chordHitBounds(layout,layout.centers,index);
      if(!differences[index])return `<g class="jazz-harmony-choice" data-zone="shared" data-chord="${index}" role="button" tabindex="0" aria-label="试听第 ${index+1} 个和弦 ${correct}"><rect class="jazz-harmony-hit" x="${left}" y="8" width="${width}" height="48" rx="8"/><text class="jazz-harmony-symbol" x="${center}" y="40" text-anchor="middle">${correct}</text></g>`;
      return `<g class="jazz-harmony-node is-different" data-chord="${index}"><g class="jazz-harmony-choice is-correct" data-zone="correct" data-chord="${index}" role="button" tabindex="0" aria-label="试听正确答案第 ${index+1} 个和弦 ${correct}"><rect class="jazz-harmony-hit" x="${left}" y="2" width="${width}" height="29" rx="7"/><text class="jazz-harmony-symbol" x="${center}" y="23" text-anchor="middle">${correct}</text></g><g class="jazz-harmony-choice is-mine" data-zone="mine" data-chord="${index}" role="button" tabindex="0" aria-label="试听我的答案第 ${index+1} 个和弦 ${mine}"><rect class="jazz-harmony-hit" x="${left}" y="35" width="${width}" height="29" rx="7"/><text class="jazz-harmony-symbol" x="${center}" y="57" text-anchor="middle">${mine}</text></g></g>`;
    }).join('');
    return `<svg class="jazz-harmony-rail" viewBox="0 0 ${layout.width} 66" role="group" aria-label="和弦比较轨道">${nodes}</svg>`;
  }

  function reviewScore(correctChords,mineChords,differences=[],providedLayout){
    const layout=providedLayout||progressionLayout([correctChords,mineChords||[]]);
    const id=`jazz-vexflow-${++notationId}`;
    notationStore.set(id,{correctChords,mineChords,differences,layout});
    return `<div class="jazz-vexflow-review" data-jazz-vexflow-id="${id}" aria-label="和弦进行五线谱"></div>`;
  }

  function makeStaveNote(VF,chord,clef){
    const entries=vexVoicing(chord,clef);
    if(!entries.length)return new VF.GhostNote({duration:'q'});
    const note=new VF.StaveNote({clef,keys:entries.map(entry=>entry.key),duration:'q',auto_stem:true});
    entries.forEach((entry,index)=>{
      if(entry.accidental)note.addModifier(new VF.Accidental(entry.accidental),index);
    });
    return note;
  }

  function makeSatbNote(VF,chord,voice){
    const midi=chord.voices[voice],entry=spell(chord,midi);
    const clef=voice==='S'||voice==='A'?'treble':'bass';
    const note=new VF.StaveNote({clef,keys:[vexKey(entry)],duration:'q',stem_direction:voice==='S'||voice==='T'?1:-1});
    const accidental=accidentalName(entry.accidental);
    if(accidental)note.addModifier(new VF.Accidental(accidental),0);
    return note;
  }

  function overlayRow(zone,chords,differences,layout,centers,top,height,totalHeight,clefSafeLeft){
    const topPercent=top/totalHeight*100,heightPercent=height/totalHeight*100;
    const hitBounds=chords.map((_,index)=>chordHitBounds(layout,centers,index,index===0?clefSafeLeft:0));
    const commonWidth=Math.min(...hitBounds.map(bounds=>bounds.width));
    const buttons=chords.map((chord,index)=>{
      const bounds=hitBounds[index];
      const hitLeft=Math.max(bounds.left,Math.min(centers[index]-commonWidth/2,bounds.left+bounds.width-commonWidth));
      const left=hitLeft/layout.width*100;
      const width=commonWidth/layout.width*100;
      return `<button type="button" class="jazz-progression-chord ${differences[index]?'is-different':''}" data-zone="${zone}" data-chord="${index}" aria-label="试听${zone==='mine'?'我的答案':'正确答案'}第 ${index+1} 个和弦 ${chord.symbol}" style="--chord-left:${left}%;--chord-width:${width}%"></button>`;
    }).join('');
    return `<div class="jazz-score-row is-${zone}" data-zone="${zone}" role="button" tabindex="0" aria-label="点击播放${zone==='mine'?'我的答案':'正确答案'}整段进行" style="--score-row-top:${topPercent}%;--score-row-height:${heightPercent}%"><span class="jazz-score-hover-surface" aria-hidden="true"></span>${buttons}</div>`;
  }

  function drawScore(host,model){
    const VF=globalThis.VexFlow;
    if(!VF)throw new Error('VexFlow is unavailable');
    const hasMine=Array.isArray(model.mineChords)&&model.mineChords.length>0;
    // VexFlow places the first staff line 40.5 units below Stave.y. Leave room
    // for upward stems while keeping the lowest C2 (and its ledger lines) in view.
    const pairHeight=184,pairGap=0,staveLift=14;
    const totalHeight=hasMine?390:198;
    const canvas=document.createElement('div');canvas.className='jazz-vexflow-canvas';
    host.replaceChildren(canvas);
    host.style.setProperty('--vf-width',model.layout.width);
    host.style.setProperty('--vf-height',totalHeight);
    const renderer=new VF.Renderer(canvas,VF.Renderer.Backends.SVG);
    renderer.resize(model.layout.width,totalHeight);
    const context=renderer.getContext();
    const pairs=[{zone:'correct',chords:model.correctChords,top:0}];
    if(hasMine)pairs.push({zone:'mine',chords:model.mineChords,top:pairHeight+pairGap});
    const staves=[],voices=[],voiceStaves=[],noteRows=[];
    pairs.forEach(pair=>{
      const treble=new VF.Stave(44,pair.top+22-staveLift,model.layout.width-58)
        .setBegBarType(VF.Barline.type.NONE).setEndBarType(VF.Barline.type.NONE).addClef('treble');
      const bass=new VF.Stave(44,pair.top+100-staveLift,model.layout.width-58)
        .setBegBarType(VF.Barline.type.NONE).setEndBarType(VF.Barline.type.NONE).addClef('bass');
      staves.push(treble,bass);
      if(pair.chords.every(chord=>chord.voices)){
        const satbVoices=['S','A','T','B'];
        const rows=satbVoices.map(voice=>pair.chords.map(chord=>makeSatbNote(VF,chord,voice)));
        rows.forEach((notes,index)=>{
          const stave=index<2?treble:bass;
          notes.forEach(note=>note.setStave(stave));
          voices.push(new VF.Voice({num_beats:pair.chords.length,beat_value:4}).setMode(VF.Voice.Mode.SOFT).addTickables(notes));
          voiceStaves.push(stave);
        });
        noteRows.push({pair,trebleNotes:rows[0]});
        return;
      }
      const trebleNotes=pair.chords.map(chord=>makeStaveNote(VF,chord,'treble'));
      const bassNotes=pair.chords.map(chord=>makeStaveNote(VF,chord,'bass'));
      // Accidentals need each note's actual stave position before the shared formatter runs.
      trebleNotes.forEach(note=>note.setStave(treble));
      bassNotes.forEach(note=>note.setStave(bass));
      const trebleVoice=new VF.Voice({num_beats:pair.chords.length,beat_value:4}).setMode(VF.Voice.Mode.SOFT).addTickables(trebleNotes);
      const bassVoice=new VF.Voice({num_beats:pair.chords.length,beat_value:4}).setMode(VF.Voice.Mode.SOFT).addTickables(bassNotes);
      voices.push(trebleVoice,bassVoice);voiceStaves.push(treble,bass);noteRows.push({pair,trebleNotes});
    });
    staves.forEach(stave=>{
      stave.setContext(context).draw();
      stave.setNoteStartX(stave.getNoteStartX()+40);
    });
    pairs.forEach((pair,index)=>new VF.StaveConnector(staves[index*2],staves[index*2+1]).setType(VF.StaveConnector.type.BRACE).setContext(context).draw());
    new VF.Formatter().joinVoices(voices).formatToStave(voices,staves[0]);
    voices.forEach((voice,index)=>voice.draw(context,voiceStaves[index]));
    const centers=noteRows[0].trebleNotes.map((note,index)=>note.getAbsoluteX()||model.layout.centers[index]);
    const hostRect=host.getBoundingClientRect();
    const clefRight=Math.max(...[...canvas.querySelectorAll('.vf-clef')].map(clef=>clef.getBoundingClientRect().right));
    const clefSafeLeft=Math.max(86,hostRect.width?(clefRight-hostRect.left)/hostRect.width*model.layout.width+8:0);
    host.insertAdjacentHTML('beforeend',pairs.map((pair,index)=>overlayRow(pair.zone,pair.chords,model.differences,model.layout,centers,pair.top,index===pairs.length-1?totalHeight-pair.top:pairHeight,totalHeight,clefSafeLeft)).join(''));
    return {...model.layout,centers};
  }

  function mountReviewScores(root=document){
    let mountedLayout;
    root.querySelectorAll('.jazz-vexflow-review[data-jazz-vexflow-id]').forEach(host=>{
      const id=host.dataset.jazzVexflowId,model=notationStore.get(id);
      if(!model)return;
      mountedLayout=drawScore(host,model);
      notationStore.delete(id);
    });
    return mountedLayout;
  }

  return {spell,voiceEntries,vexVoicing,progressionLayout,harmonyRail,reviewScore,mountReviewScores};
})();
if(typeof window!=='undefined')window.JazzNotation=JazzNotation;
if(typeof module!=='undefined')module.exports=JazzNotation;
