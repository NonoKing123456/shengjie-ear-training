const test=require('node:test');
const assert=require('node:assert/strict');
const jazz=require('../dist/jazz.js');
const notation=require('../dist/jazz-notation.js');

test('every generated voicing is converted to VexFlow keys without losing MIDI pitches',()=>{
  for(const tonality of ['major','minor'])for(const mode of ['training','shell','rootless'])for(let trial=0;trial<80;trial++){
    const question=jazz.chooseQuestion({tonality,packs:['basic','secondary','advanced'],key:trial%12,voicingMode:mode});
    for(const option of question.options)for(const chord of option.voicings){
      const engraved=['treble','bass'].flatMap(clef=>notation.vexVoicing(chord,clef));
      assert.deepEqual(engraved.map(note=>note.midi).sort((a,b)=>a-b),[...chord.notes].sort((a,b)=>a-b));
      assert.ok(engraved.every(note=>/^[a-g](?:bb|b|#|##)?\/-?\d+$/.test(note.key)));
    }
  }
});

test('altered chord tones keep their correct letter names and VexFlow accidentals',()=>{
  const chord={symbol:'G7♭9',quality:'7♭9',root:7,bass:43,right:[59,65,68],notes:[43,59,65,68]};
  assert.deepEqual(notation.spell(chord,68),{midi:68,index:33,accidental:-1}); // A♭4
  assert.deepEqual(notation.spell(chord,71),{midi:71,index:34,accidental:0}); // B4
  assert.deepEqual(notation.vexVoicing(chord,'treble').find(note=>note.midi===68),{midi:68,key:'ab/4',accidental:'b',clef:'treble'});
  const diminished={symbol:'C♯°7',quality:'°7',root:1};
  assert.deepEqual(notation.spell(diminished,70),{midi:70,index:34,accidental:-1}); // B♭4
});

test('staff assignment follows the generated voicing hands instead of a MIDI cutoff',()=>{
  const chord={symbol:'Fm7',quality:'m7',root:5,bass:41,right:[56,67,75],notes:[41,56,67,75]};
  assert.deepEqual(notation.vexVoicing(chord,'bass').map(note=>note.midi),[41]);
  assert.deepEqual(notation.vexVoicing(chord,'treble').map(note=>note.midi),[56,67,75]);
});

test('rootless voicings leave the bass stave empty instead of moving right-hand notes down',()=>{
  const chord={symbol:'Cmaj7',quality:'maj7',root:0,right:[59,64,69],notes:[59,64,69]};
  assert.deepEqual(notation.vexVoicing(chord,'bass'),[]);
  assert.deepEqual(notation.vexVoicing(chord,'treble').map(note=>note.midi),[59,64,69]);
});

test('shared harmony rail renders one label for matches and two playable labels for differences',()=>{
  const correct=[
    {symbol:'Dmaj7',quality:'maj7',root:2},
    {symbol:'Em7',quality:'m7',root:4},
    {symbol:'A7',quality:'7',root:9}
  ];
  const mine=[{symbol:'Bm7',quality:'m7',root:11},correct[1],correct[2]];
  const layout=notation.progressionLayout([correct,mine]);
  const rail=notation.harmonyRail(correct,mine,[true,false,false],layout);
  assert.equal(layout.width,560);
  assert.equal((rail.match(/class="jazz-harmony-choice/g)||[]).length,4);
  assert.match(rail,/data-zone="correct" data-chord="0"/);
  assert.match(rail,/data-zone="mine" data-chord="0"/);
  assert.match(rail,/data-zone="shared" data-chord="1"/);
});

test('adjacent chord hover targets keep a visible gap even when note centers are close',()=>{
  const chords=Array.from({length:3},(_,index)=>({symbol:`C${index}maj7`}));
  const layout={width:400,widths:[120,120,120],centers:[100,188,276]};
  const rail=notation.harmonyRail(chords,chords,[],layout);
  const targets=[...rail.matchAll(/<rect class="jazz-harmony-hit" x="([\d.]+)" y="8" width="([\d.]+)"/g)]
    .map(([,left,width])=>({left:Number(left),right:Number(left)+Number(width)}));
  assert.equal(targets.length,3);
  for(let index=1;index<targets.length;index++)assert.ok(targets[index].left-targets[index-1].right>=14);
});

test('the review score mounts a VexFlow host and keeps per-chord playback controls',()=>{
  const chords=[
    {symbol:'Cmaj7',quality:'maj7',root:0,bass:36,right:[59,64,69],notes:[36,59,64,69]},
    {symbol:'Dm7',quality:'m7',root:2,bass:38,right:[60,65,69],notes:[38,60,65,69]}
  ];
  const host=notation.reviewScore(chords,chords,[false,true],notation.progressionLayout([chords]));
  assert.match(host,/class="jazz-vexflow-review"/);
  assert.match(host,/data-jazz-vexflow-id="jazz-vexflow-\d+"/);
});
