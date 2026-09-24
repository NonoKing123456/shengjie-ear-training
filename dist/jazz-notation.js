// Spell the MIDI notes of an already generated voicing on a readable staff.
const JazzNotation=(()=>{
  const letters=['C','D','E','F','G','A','B'];
  const naturals=[0,2,4,5,7,9,11];
  const signs={'-2':'𝄫','-1':'♭',0:'',1:'♯',2:'𝄪'};
  const tones={
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
  function spell(chord,midi){
    const rootLetter=letters.indexOf(chord.symbol[0]);
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
  function svg(chord){
    const grand=chord.notes.some(midi=>midi<60);
    const height=grand?202:142;
    const staves=grand?[{clef:'treble',top:28,bottom:76,base:30},{clef:'bass',top:112,bottom:160,base:18}]:
      [{clef:'treble',top:35,bottom:83,base:30}];
    const staff=staves.map(item=>`<g class="score-staff">${Array.from({length:5},(_,index)=>`<line x1="24" y1="${item.top+index*12}" x2="306" y2="${item.top+index*12}"/>`).join('')}<text class="score-clef" x="35" y="${item.top+44}">${item.clef==='treble'?'𝄞':'𝄢'}</text></g>`).join('');
    const positions=chord.notes.map(midi=>{
      const item=grand&&midi<60?staves[1]:staves[0];
      const note=spell(chord,midi);
      return {...note,staff:item,y:item.bottom-(note.index-item.base)*6};
    }).sort((a,b)=>a.y-b.y);
    const accidentalColumns=[];
    const notes=positions.map((note,index)=>{
      const previous=positions.slice(0,index).reverse().find(item=>item.staff===note.staff);
      const x=previous&&Math.abs(previous.y-note.y)<=6?196:183;
      const ledgers=[];
      for(let y=note.staff.top-12;y>=note.y;y-=12)ledgers.push(y);
      for(let y=note.staff.bottom+12;y<=note.y;y+=12)ledgers.push(y);
      let accidental='';
      if(note.accidental){
        let column=0;
        while(accidentalColumns[column]?.some(y=>Math.abs(y-note.y)<20))column++;
        (accidentalColumns[column]??=[]).push(note.y);
        accidental=`<text class="score-accidental" x="${x-27-column*19}" y="${note.y+7}">${signs[note.accidental]}</text>`;
      }
      return `<g class="jazz-notated-note" data-midi="${note.midi}">${ledgers.map(y=>`<line class="score-ledger" x1="${x-18}" y1="${y}" x2="${x+18}" y2="${y}"/>`).join('')}${accidental}<ellipse class="jazz-note-head" cx="${x}" cy="${note.y}" rx="11" ry="7" transform="rotate(-18 ${x} ${note.y})"/></g>`;
    }).join('');
    const stems=staves.map(item=>{
      const placed=positions.filter(note=>note.staff===item);
      if(!placed.length)return '';
      const y=Math.min(...placed.map(note=>note.y));
      const bottom=Math.max(...placed.map(note=>note.y));
      if(item.clef==='bass')return `<line class="score-stem" x1="172" y1="${y+2}" x2="172" y2="${bottom+30}"/>`;
      return `<line class="score-stem" x1="194" y1="${bottom-2}" x2="194" y2="${y-34}"/>`;
    }).join('');
    return `<svg class="jazz-score" viewBox="0 0 330 ${height}" role="img" aria-label="${chord.symbol} 实际配位五线谱">${staff}${stems}${notes}</svg>`;
  }
  return {spell,svg};
})();
if(typeof window!=='undefined')window.JazzNotation=JazzNotation;
if(typeof module!=='undefined')module.exports=JazzNotation;
