const test=require('node:test');
const assert=require('node:assert/strict');
const jazz=require('../dist/jazz.js');
const notation=require('../dist/jazz-notation.js');

test('the review staff contains every MIDI pitch used by each actual voicing',()=>{
  for(const tonality of ['major','minor'])for(const mode of ['training','shell','rootless'])for(let trial=0;trial<80;trial++){
    const question=jazz.chooseQuestion({tonality,packs:['basic','secondary','advanced'],key:trial%12,voicingMode:mode});
    for(const option of question.options)for(const chord of option.voicings){
      const score=notation.svg(chord);
      assert.equal((score.match(/class="jazz-notated-note"/g)||[]).length,chord.notes.length);
      for(const midi of chord.notes)assert.ok(score.includes(`data-midi="${midi}"`));
      assert.ok(score.includes('五线谱'));
      assert.ok(!score.includes('jazz-keyboard'));
      assert.ok((score.match(/<line x1="24"/g)||[]).length===5||(score.match(/<line x1="24"/g)||[]).length===10);
    }
  }
});

test('altered chord tones use the correct letter and accidental',()=>{
  const chord={symbol:'G7♭9',quality:'7♭9',root:7};
  assert.deepEqual(notation.spell(chord,68),{midi:68,index:33,accidental:-1}); // A♭4
  assert.deepEqual(notation.spell(chord,71),{midi:71,index:34,accidental:0}); // B4
  const diminished={symbol:'C♯°7',quality:'°7',root:1};
  assert.deepEqual(notation.spell(diminished,70),{midi:70,index:34,accidental:-1}); // B♭4
});
