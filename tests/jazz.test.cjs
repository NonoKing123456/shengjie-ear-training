const test=require('node:test');
const assert=require('node:assert/strict');
const jazz=require('../dist/jazz.js');

const packages=[['basic'],['basic','secondary'],['basic','secondary','advanced']];

test('generated answers obey the selected tonal jazz grammar and stay close',()=>{
  for(const tonality of ['major','minor'])for(const packs of packages)for(let trial=0;trial<150;trial++){
    const question=jazz.chooseQuestion({tonality,packs,key:trial%12,voicingMode:'training'});
    assert.ok(question.tokens.length===3||question.tokens.length===4);
    assert.equal(question.options.length,4);
    assert.equal(new Set(question.options.map(option=>option.id)).size,4);
    assert.ok(question.options.some(option=>option.id===question.id));
    for(const option of question.options){
      assert.equal(option.tokens.length,question.tokens.length);
      assert.equal(option.tokens.at(-1),question.tokens.at(-1));
      if(option.id!==question.id)assert.ok(jazz.distance(option.tokens,question.tokens)<=2);
      const advanced=option.tokens.filter(token=>jazz.vocabulary[tonality][token][2]==='advanced');
      assert.ok(advanced.length<=1||advanced.length===2&&advanced.includes('ivm7')&&advanced.includes('♭VII7'));
      for(const token of option.tokens)assert.ok(packs.includes(jazz.vocabulary[tonality][token][2]));
      for(let index=1;index<option.tokens.length;index++){
        if(option.tokens.indexOf(option.tokens[index])!==index)assert.ok(index===option.tokens.length-1&&option.tokens[index]===option.tokens[0]);
      }
      for(let index=1;index<option.tokens.length;index++)assert.ok(jazz.grammar[tonality][option.tokens[index-1]].includes(option.tokens[index]));
    }
  }
});

test('voicings retain guide tones and make the requested rootless choice',()=>{
  for(const mode of ['training','shell','rootless'])for(const tonality of ['major','minor']){
    const question=jazz.chooseQuestion({tonality,packs:packages[2],key:0,voicingMode:mode});
    for(const option of question.options)for(const chord of option.voicings){
      const tones=jazz.intervals[chord.quality];
      const guide=chord.quality==='°7'||chord.quality==='m6'?[tones[1],tones[3]]:[tones[1],tones[3]];
      for(const interval of guide)assert.ok(chord.right.some(note=>(note-chord.root-interval)%12===0));
      if(mode==='rootless')assert.equal(chord.bass,null);
      else{
        assert.equal(chord.notes[0]%12,chord.root);
        assert.ok(chord.notes[0]>=43);
      }
      assert.ok(chord.right.every(note=>note>=55&&note<=81));
    }
  }
});

test('both major ii–V–I and minor iiø–V7♭9–i exist in the generated grammar',()=>{
  const major=jazz.paths('major',['basic']);
  const minor=jazz.paths('minor',['basic','secondary']);
  assert.ok(major.some(path=>path.join('|')==='ii7|V7|Imaj7'));
  assert.ok(minor.some(path=>path.join('|')==='iiø7|V7♭9|i7'));
  assert.ok(jazz.paths('major',['basic','secondary']).some(path=>path.join('|')==='V7/vi|VI7|V7/V|V7'));
});

test('chord symbols follow the selected key spelling',()=>{
  const major=jazz.chooseQuestion({tonality:'major',packs:['basic'],key:6,voicingMode:'training'});
  for(const option of major.options){
    for(const chord of option.chords){
      if(chord.token==='ii7')assert.equal(chord.symbol,'G♯m7');
      if(chord.token==='Imaj7')assert.equal(chord.symbol,'F♯maj7');
    }
  }
});

test('a new question does not repeat the previous chord sequence',()=>{
  const first=jazz.chooseQuestion({tonality:'major',packs:['basic'],key:0,voicingMode:'training'});
  for(let trial=0;trial<30;trial++){
    const next=jazz.chooseQuestion({tonality:'major',packs:['basic'],key:0,voicingMode:'training',previousId:first.id});
    assert.notEqual(next.id,first.id);
  }
});
