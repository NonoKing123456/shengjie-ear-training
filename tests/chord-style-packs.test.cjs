const test=require('node:test');
const assert=require('node:assert/strict');
const StylePacks=require('../dist/chord-style-packs.js');
const JazzNotation=require('../dist/jazz-notation.js');
const JazzTrainer=require('../dist/jazz.js');

test('pop and classical options stay inside their own grammars and preserve voiced pitches in notation',()=>{
  for(const stylePack of ['pop','classical'])for(const tonality of ['major','minor'])for(let key=0;key<12;key++){
    const selectedColors=['V5','N6','ger6'];
    const bank=StylePacks.patterns(stylePack,tonality,selectedColors).map(path=>path.join('|'));
    for(let n=0;n<6;n++){
      const question=StylePacks.chooseQuestion({stylePack,tonality,key,selectedColors,rng:()=>Math.random()});
      assert.equal(question.stylePack,stylePack);
      assert.equal(question.options.length,4);
      assert.equal(new Set(question.options.map(option=>option.id)).size,4);
      assert.ok(question.options.some(option=>option.id===question.id));
      for(const option of question.options){
        assert.ok(bank.includes(option.id));
        assert.equal(option.voicings.length,option.tokens.length);
        for(const chord of option.voicings){
          assert.deepEqual(chord.notes,[chord.bass,...chord.right]);
          assert.deepEqual(['bass','treble'].flatMap(clef=>JazzNotation.vexVoicing(chord,clef).map(note=>note.midi)).sort((a,b)=>a-b),[...chord.notes].sort((a,b)=>a-b));
        }
      }
    }
  }
});

test('classical color settings gate chromatic functions without changing pop material',()=>{
  for(const tonality of ['major','minor']){
    const plain=StylePacks.patterns('classical',tonality,[]).flat();
    assert.ok(!plain.includes('N6')&&!plain.includes('V/V')&&!plain.includes('Ger+6'));
    const withNeapolitan=StylePacks.patterns('classical',tonality,['N6']).flat();
    assert.ok(withNeapolitan.includes('N6'));
    assert.ok(!withNeapolitan.includes('Ger+6'));
    const pop=StylePacks.patterns('pop',tonality,['V5','N6','ger6']).flat();
    assert.ok(!pop.includes('N6')&&!pop.includes('Ger+6'));
  }
});

test('classical Neapolitan and German sixth use the required inversion and augmented-sixth pitch',()=>{
  const pick=(family,path)=>{const values=[family,path];return ()=>values.shift()??.5};
  const question=StylePacks.chooseQuestion({stylePack:'classical',tonality:'major',key:0,selectedColors:['V5','N6','ger6'],rng:pick(0,.999)});
  const german=question.voicings.find(chord=>chord.token==='Ger+6');
  assert.ok(german);
  assert.deepEqual(german.notes.map(midi=>midi%12).sort((a,b)=>a-b),[0,3,6,8]);
  const neapolitanQuestion=StylePacks.chooseQuestion({stylePack:'classical',tonality:'major',key:0,selectedColors:['V5','N6','ger6'],rng:pick(0,.69)});
  const neapolitan=neapolitanQuestion.voicings.find(chord=>chord.token==='N6');
  assert.ok(neapolitan);
  assert.equal(neapolitan.bass%12,5);
});

test('classical grammar offers varied starts and four distinct endings in both tonalities',()=>{
  for(const tonality of ['major','minor']){
    const tonic=tonality==='major'?'I':'i',sixth=tonality==='major'?'vi':'VI',subdominant=tonality==='major'?'IV':'iv';
    const bank=StylePacks.patterns('classical',tonality,[]);
    const ending=path=>path.at(-1)==='V'?'half':path.at(-2)==='V'&&path.at(-1)===tonic?'authentic':
      path.at(-2)==='V'&&path.at(-1)===sixth?'deceptive':path.at(-2)===subdominant&&path.at(-1)===tonic?'plagal':'unknown';
    assert.deepEqual(new Set(bank.map(ending)),new Set(['authentic','half','deceptive','plagal']));
    assert.ok(bank.some(path=>path[0]!==tonic));
    for(const path of bank){
      for(let index=0;index<path.length-1;index++)if(['I64','i64','N6','Ger+6','V/V'].includes(path[index]))assert.equal(path[index+1],'V');
    }
    for(const [firstDraw,expectedEnding] of [[0,'authentic'],[.3,'half'],[.55,'deceptive'],[.8,'plagal']]){
      const draws=[firstDraw,.5];
      const question=StylePacks.chooseQuestion({stylePack:'classical',tonality,key:0,rng:()=>draws.shift()??.5});
      assert.equal(ending(question.tokens),expectedEnding);
    }
  }
});

test('classical SATB keeps four ordered voices, complete harmony and legal connections in every key',()=>{
  for(const tonality of ['major','minor'])for(let key=0;key<12;key++)for(const draw of [0,.27,.53,.78]){
    const draws=[draw,.5];
    const question=StylePacks.chooseQuestion({stylePack:'classical',tonality,key,
      selectedColors:['V5','N6','ger6'],voiceMode:'satb',rng:()=>draws.shift()??.5});
    assert.equal(question.voiceMode,'satb');
    for(const option of question.options){
      assert.equal(option.voicings.length,4);
      option.voicings.forEach((chord,index)=>{
        const {B,T,A,S}=chord.voices;
        assert.deepEqual(chord.notes,[B,T,A,S]);
        assert.equal(B,chord.bass);
        assert.ok(B>=40&&B<=60);
        assert.ok(B<T&&T<A&&A<S);
        assert.ok(T>=48&&T<=67&&A>=55&&A<=74&&S>=60&&S<=81);
        assert.ok(A-T<=12&&S-A<=12);
        const tones=chord.tones.map(tone=>(chord.root+tone)%12);
        assert.ok(chord.notes.every(midi=>tones.includes(midi%12)));
        assert.ok(tones.every(tone=>chord.notes.some(midi=>midi%12===tone)));
        assert.deepEqual(['bass','treble'].flatMap(clef=>JazzNotation.vexVoicing(chord,clef).map(note=>note.midi)),chord.notes);
        if(index)assert.ok(Number.isFinite(StylePacks.satbTransition(option.voicings[index-1],chord,key)));
      });
    }
  }
});

test('jazz adapter keeps jazz vocabulary and produces playable notation',()=>{
  for(const tonality of ['major','minor'])for(let key=0;key<12;key++)for(const packs of [['basic'],['basic','secondary','advanced']]){
    const question=JazzTrainer.chooseQuestion({tonality,packs,key,voicingMode:'training'});
    assert.equal(question.options.length,4);
    question.options.forEach(option=>option.voicings.forEach(chord=>{
      assert.ok(chord.quality in JazzTrainer.intervals);
      assert.deepEqual(['bass','treble'].flatMap(clef=>JazzNotation.vexVoicing(chord,clef).map(note=>note.midi)).sort((a,b)=>a-b),[...chord.notes].sort((a,b)=>a-b));
    }));
  }
});
