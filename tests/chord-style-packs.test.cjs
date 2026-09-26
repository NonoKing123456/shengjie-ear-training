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
        assert.ok(B>=43&&B<=60);
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

test('pop optional packs contribute only selected grammar and their notes sound as marked',()=>{
  const packTokens={suspended:['Vsus4','V7sus4','IVsus4'],seventh:['Imaj7','V7','vi7'],
    add:['Iadd2','Iadd6','I6/9','iiadd2','viadd4'],inversions:['I6','IV6','vi6'],
    modalBorrowing:['iv','♭VI','♭VII','♭III'],secondaryDominant:['V7/V','V7/vi','V7/IV','V7/ii']};
  for(const tonality of ['major','minor']){
    const base=StylePacks.patterns('pop',tonality,[],['diatonic']).flat();
    assert.deepEqual(new Set(base),new Set(tonality==='major'?['I','ii','iii','IV','V','vi','vii°']:['i','ii°','III','iv','v','VI','VII']));
    for(const pack of Object.keys(packTokens)){
      const paths=StylePacks.patterns('pop',tonality,[],['diatonic',pack]);
      assert.ok(paths.length>6,`${tonality} ${pack}`);
      assert.ok(paths.some(path=>path.some(token=>!base.includes(token))),`${tonality} ${pack}`);
      if(pack==='suspended')assert.ok(paths.some(path=>path.includes('V7sus4')));
      if(pack==='seventh')assert.ok(paths.some(path=>path.includes('V7')));
      if(pack==='add')assert.ok(paths.some(path=>path.some(token=>token.endsWith('6/9'))));
      if(pack==='secondaryDominant')for(const path of paths)for(let index=0;index<path.length;index++){
        const target=path[index].match(/^V7\/(.+)$/)?.[1];
        if(target)assert.equal(path[index+1],target,`${tonality}: ${path.join(' – ')}`);
      }
      const extras=new Set(paths.flat().filter(token=>!base.includes(token)));
      for(const otherPack of Object.keys(packTokens).filter(item=>item!==pack)){
        const otherExtras=StylePacks.patterns('pop',tonality,[],['diatonic',otherPack]).flat().filter(token=>!base.includes(token));
        assert.ok(otherExtras.every(token=>!extras.has(token)),`${pack} 不应混入 ${otherPack} 的语汇`);
      }
      for(let key=0;key<12;key++){
        const question=StylePacks.chooseQuestion({stylePack:'pop',tonality,key,popPacks:['diatonic',pack],rng:()=>.84});
        assert.equal(question.options.length,4);
        for(const option of question.options)for(const chord of option.voicings){
          assert.ok(chord.notes.every(midi=>midi>=43));
          assert.deepEqual(['bass','treble'].flatMap(clef=>JazzNotation.vexVoicing(chord,clef).map(note=>note.midi)).sort((a,b)=>a-b),[...chord.notes].sort((a,b)=>a-b));
          if(chord.inversion)assert.ok(chord.symbol.includes('/'));
          if(chord.quality==='7sus4')assert.deepEqual(new Set(chord.notes.map(midi=>(midi-chord.root+120)%12)),new Set([0,5,7,10]));
          if(chord.quality==='majadd2')assert.deepEqual(new Set(chord.notes.map(midi=>(midi-chord.root+120)%12)),new Set([0,2,4,7]));
          if(chord.quality==='majadd6')assert.deepEqual(new Set(chord.notes.map(midi=>(midi-chord.root+120)%12)),new Set([0,4,7,9]));
          if(chord.quality==='maj69'){
            assert.equal(chord.notes.length,5);
            assert.deepEqual(new Set(chord.notes.map(midi=>(midi-chord.root+120)%12)),new Set([0,2,4,7,9]));
            assert.match(chord.symbol,/6\/9$/);
          }
          if(chord.quality==='minadd2')assert.deepEqual(new Set(chord.notes.map(midi=>(midi-chord.root+120)%12)),new Set([0,2,3,7]));
          if(chord.quality==='minadd4')assert.deepEqual(new Set(chord.notes.map(midi=>(midi-chord.root+120)%12)),new Set([0,3,5,7]));
        }
      }
    }
  }
  assert.ok(StylePacks.validate({stylePack:'pop',tonality:'major',popPacks:[]}));
  assert.ok(StylePacks.validate({stylePack:'pop',tonality:'major',popPacks:['diatonic','subdominant']}));
});

test('pop Roman inversions use Arabic bass degrees while classical keeps figured bass',()=>{
  const major={stylePack:'pop',key:0,keyName:'C',tonality:'major'};
  const classical={...major,stylePack:'classical'};
  for(const [token,symbol,inversion,bass,popRoman,classicalRoman] of [
    ['I6','C/E',1,52,'I/3','I⁶'],['I64','C/G',2,43,'I/5','I⁶₄'],
    ['IV6','F/A',1,45,'IV/6','IV⁶'],['V6','G/B',1,47,'V/7','V⁶']
  ]){
    const chord={token,symbol,inversion,bass};
    assert.equal(JazzNotation.chordDisplaySymbol(chord,'letters',major),symbol);
    assert.equal(JazzNotation.chordDisplaySymbol(chord,'roman',major),popRoman);
    assert.equal(JazzNotation.chordDisplaySymbol(chord,'roman',classical),classicalRoman);
  }
  const minor={stylePack:'pop',key:0,keyName:'C',tonality:'minor'};
  assert.equal(JazzNotation.chordDisplaySymbol({token:'Ger+6',symbol:'A♭+6'},'roman',classical),'Ger+6');
  assert.equal(JazzNotation.chordDisplaySymbol({token:'i6',symbol:'Cm6'},'roman',{stylePack:'jazz'}),'i6');
  assert.equal(JazzNotation.chordDisplaySymbol({token:'i6',symbol:'Cm/E♭',inversion:1,bass:51},'roman',minor),'i/3');
  assert.equal(JazzNotation.chordDisplaySymbol({token:'iv6',symbol:'Fm/A♭',inversion:1,bass:44},'roman',minor),'iv/6');
  assert.equal(JazzNotation.chordDisplaySymbol({token:'IV6',symbol:'F/A',inversion:1,bass:45},'roman',minor),'IV/♯6');
  assert.equal(JazzNotation.chordDisplaySymbol({token:'I6',symbol:'D/F♯',inversion:1,bass:54},'roman',
    {stylePack:'pop',key:2,keyName:'D',tonality:'major'}),'I/3');
  for(const tonality of ['major','minor'])for(let key=0;key<12;key++){
    const bank=StylePacks.patterns('pop',tonality,[],['diatonic','inversions']);
    const index=bank.findIndex(path=>path.some(token=>/64$|6$/.test(token)));
    const question=StylePacks.chooseQuestion({stylePack:'pop',tonality,key,popPacks:['diatonic','inversions'],rng:()=>(index+.5)/bank.length});
    const inverted=question.voicings.filter(chord=>chord.inversion);
    assert.ok(inverted.length);
    for(const chord of inverted){
      assert.ok(chord.symbol.includes('/'));
      const roman=JazzNotation.chordDisplaySymbol(chord,'roman',question);
      assert.match(roman,/\/[♭♯𝄫𝄪]?[1-7]$/);
      assert.ok(!roman.includes('⁶'));
    }
  }
});

test('every pop secondary dominant resolves by a fifth and every 6/9 voices all five tones',()=>{
  for(const tonality of ['major','minor'])for(let key=0;key<12;key++)for(const pack of ['secondaryDominant','add']){
    const bank=StylePacks.patterns('pop',tonality,[],['diatonic',pack]);
    const wanted=pack==='secondaryDominant'?path=>path.some(token=>token.startsWith('V7/')):path=>path.some(token=>token.endsWith('6/9'));
    const indices=bank.flatMap((path,index)=>wanted(path)?[index]:[]);
    assert.ok(indices.length,`${tonality} ${pack}`);
    for(const index of indices){
      const question=StylePacks.chooseQuestion({stylePack:'pop',tonality,key,popPacks:['diatonic',pack],rng:()=>(index+.5)/bank.length});
      for(let position=0;position<question.voicings.length;position++){
        const chord=question.voicings[position];
        if(chord.token.startsWith('V7/')){
          const target=question.voicings[position+1];
          assert.equal(chord.token.slice(3),target?.token);
          assert.equal(chord.quality,'7');
          assert.equal((chord.root-target.root+12)%12,7);
        }
        if(chord.token.endsWith('6/9')){
          assert.equal(chord.quality,'maj69');
          assert.equal(chord.notes.length,5);
          assert.equal(JazzNotation.vexVoicing(chord,'bass').length+JazzNotation.vexVoicing(chord,'treble').length,5);
        }
      }
    }
  }
});

test('jazz adapter keeps jazz vocabulary and produces playable notation',()=>{
  for(const tonality of ['major','minor'])for(let key=0;key<12;key++)for(const packs of [['basic'],['basic','secondary','advanced']])for(const voicingMode of ['training','shell','rootless']){
    const question=JazzTrainer.chooseQuestion({tonality,packs,key,voicingMode});
    assert.equal(question.options.length,4);
    question.options.forEach(option=>option.voicings.forEach(chord=>{
      assert.ok(chord.quality in JazzTrainer.intervals);
      assert.ok(chord.notes.every(midi=>midi>=43));
      assert.deepEqual(['bass','treble'].flatMap(clef=>JazzNotation.vexVoicing(chord,clef).map(note=>note.midi)).sort((a,b)=>a-b),[...chord.notes].sort((a,b)=>a-b));
    }));
  }
});
