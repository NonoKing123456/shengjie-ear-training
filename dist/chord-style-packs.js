// Pop and classical progressions share a question shape with the jazz generator.
const ChordStylePacks=(()=>{
  const letters=['C','D','E','F','G','A','B'];
  const naturals=[0,2,4,5,7,9,11];
  const keyNames=['C','D♭','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
  const names={pop:'流行',jazz:'爵士',classical:'古典'};
  const popPatterns={
    major:[['I','V','vi','IV'],['I','vi','IV','V'],['vi','IV','I','V'],['IV','I','V','vi'],['I','IV','vi','V'],['vi','V','IV','I']],
    minor:[['i','VI','III','VII'],['i','VII','VI','VII'],['i','III','VI','VII'],['VI','III','VII','i'],['i','VI','iv','VII'],['III','VII','i','VI']]
  };
  const classicalFamilies={
    major:{
      authentic:[['I','IV','V','I'],['I','ii6','V','I'],['IV','ii6','V','I'],['vi','ii6','V','I'],['I6','IV','V','I'],['I','I64','V','I'],['IV','I64','V','I'],['I','N6','V','I'],['IV','N6','V','I'],['I','V/V','V','I'],['I','Ger+6','V','I']],
      half:[['I','IV','I64','V'],['vi','ii6','I64','V'],['IV','I6','ii6','V'],['I','ii6','I64','V'],['I','IV','V/V','V'],['vi','ii6','V/V','V'],['I','IV','N6','V'],['I','IV','Ger+6','V']],
      deceptive:[['I','IV','V','vi'],['I6','ii6','V','vi'],['IV','ii6','V','vi']],
      plagal:[['I','I6','IV','I'],['vi','I6','IV','I'],['I','ii6','IV','I']]
    },
    minor:{
      authentic:[['i','iv','V','i'],['i','ii°6','V','i'],['VI','iv','V','i'],['iv','ii°6','V','i'],['i6','iv','V','i'],['i','i64','V','i'],['iv','i64','V','i'],['i','N6','V','i'],['VI','N6','V','i'],['i','V/V','V','i'],['i','Ger+6','V','i']],
      half:[['i','iv','i64','V'],['VI','ii°6','i64','V'],['iv','i6','ii°6','V'],['i','ii°6','i64','V'],['i','iv','V/V','V'],['VI','ii°6','V/V','V'],['i','iv','N6','V'],['i','iv','Ger+6','V']],
      deceptive:[['i','iv','V','VI'],['i6','ii°6','V','VI'],['iv','ii°6','V','VI']],
      plagal:[['i','i6','iv','i'],['VI','i6','iv','i'],['i','ii°6','iv','i']]
    }
  };
  const popChords={
    major:{I:[0,'maj',0],ii:[2,'min',1],iii:[4,'min',2],IV:[5,'maj',3],V:[7,'maj',4],vi:[9,'min',5]},
    minor:{i:[0,'min',0],III:[3,'maj',2],iv:[5,'min',3],VI:[8,'maj',5],VII:[10,'maj',6]}
  };
  const classicalChords={
    major:{I:[0,'maj',0],I6:[0,'maj',0,1],I64:[0,'maj',0,2],ii:[2,'min',1],ii6:[2,'min',1,1],IV:[5,'maj',3],IV6:[5,'maj',3,1],V:[7,'maj',4],vi:[9,'min',5],N6:[1,'maj',1,1], 'V/V':[2,'maj',1], 'Ger+6':[8,'ger6',5]},
    minor:{i:[0,'min',0],i6:[0,'min',0,1],i64:[0,'min',0,2],'ii°6':[2,'dim',1,1],iv:[5,'min',3],iv6:[5,'min',3,1],V:[7,'maj',4],VI:[8,'maj',5],N6:[1,'maj',1,1], 'V/V':[2,'maj',1], 'Ger+6':[8,'ger6',5]}
  };
  const intervals={maj:[0,4,7],min:[0,3,7],dim:[0,3,6],ger6:[0,4,7,10]};
  const colors={'N6':'N6','V/V':'V5','Ger+6':'ger6'};
  const mod=value=>(value%12+12)%12;
  function rootName(key,degree,root){
    const letter=letters[(letters.indexOf(keyNames[key][0])+degree)%7];
    let alteration=mod(root-naturals[letters.indexOf(letter)]);
    if(alteration>6)alteration-=12;
    const sign=({'-2':'𝄫','-1':'♭',0:'',1:'♯',2:'𝄪'})[alteration];
    if(sign===undefined)throw new Error('无法拼写当前调性的和弦根音');
    return letter+sign;
  }
  function chord(token,key,tonality,stylePack){
    const definition=(stylePack==='pop'?popChords:classicalChords)[tonality][token];
    if(!definition)throw new Error(`风格包不支持和弦 ${token}`);
    const [offset,quality,degree,inversion=0]=definition;
    const root=mod(key+offset),tones=intervals[quality];
    const bass=36+mod(root+tones[inversion]);
    const name=rootName(key,degree,root);
    return {token,quality,root,rootLetter:name[0],symbol:stylePack==='classical'?token:`${name}${quality==='min'?'m':quality==='dim'?'°':''}`,
      bass,inversion,tones};
  }
  function rightCandidates(item){
    const pitchClasses=(item.quality==='ger6'?item.tones.slice(1):item.tones).map(tone=>mod(item.root+tone));
    const slots=pitchClasses.map(pc=>Array.from({length:24},(_,index)=>index+58).filter(midi=>midi%12===pc));
    const candidates=[];
    for(const a of slots[0])for(const b of slots[1])for(const c of slots[2]){
      const notes=[a,b,c].sort((x,y)=>x-y);
      if(notes[2]-notes[0]<=16&&notes[0]>=60&&notes[2]<=79)candidates.push(notes);
    }
    return candidates;
  }
  function voice(chords,stylePack){
    let previous=null;
    return chords.map(item=>{
      const choices=rightCandidates(item);
      if(!choices.length)throw new Error('当前和弦无法生成有效配位');
      choices.sort((a,b)=>{
        const cost=notes=>previous?notes.reduce((sum,midi,index)=>sum+Math.abs(midi-previous[index]),0):notes.reduce((sum,midi)=>sum+Math.abs(midi-67),0);
        return cost(a)-cost(b);
      });
      const right=choices[0];previous=right;
      return {...item,right,notes:[item.bass,...right],stylePack};
    });
  }
  const satbRanges={S:[60,81],A:[55,74],T:[48,67]};
  function satbCandidates(item,key){
    const B=item.bass<40?item.bass+12:item.bass;
    const pitchClasses=new Set(item.tones.map(tone=>mod(item.root+tone)));
    const forbiddenDouble=new Set(item.token==='V'?[mod(key+11)]:item.token==='V/V'||item.token==='Ger+6'?[mod(key+6)]:[]);
    const notesFor=voice=>Array.from({length:satbRanges[voice][1]-satbRanges[voice][0]+1},(_,index)=>satbRanges[voice][0]+index)
      .filter(midi=>pitchClasses.has(midi%12));
    const result=[];
    for(const T of notesFor('T'))for(const A of notesFor('A'))for(const S of notesFor('S')){
      if(!(B<T&&T<A&&A<S)||A-T>12||S-A>12)continue;
      const voices={B,T,A,S},values=[B,T,A,S];
      if([...pitchClasses].some(pc=>!values.some(midi=>midi%12===pc)))continue;
      if([...forbiddenDouble].some(pc=>values.filter(midi=>midi%12===pc).length>1))continue;
      result.push({...item,bass:B,voices,right:[T,A,S],notes:values,stylePack:'classical',voiceMode:'satb'});
    }
    return result;
  }
  function satbTransition(previous,next,key){
    const before=previous.notes,after=next.notes;
    const movement=before.map((midi,index)=>after[index]-midi);
    for(let a=0;a<4;a++)for(let b=a+1;b<4;b++){
      const prior=mod(before[b]-before[a]),later=mod(after[b]-after[a]);
      if((prior===0||prior===7)&&later===prior&&movement[a]*movement[b]>0)return Infinity;
    }
    if([0,7].includes(mod(after[3]-after[0]))&&movement[0]*movement[3]>0&&Math.abs(movement[3])>2&&
      ![0,7].includes(mod(before[3]-before[0])))return Infinity;
    const tendency=previous.token==='V/V'&&next.token==='V'?mod(key+6):
      previous.token==='Ger+6'&&next.token==='V'?mod(key+6):
      previous.token==='V'&&['I','i','vi','VI'].includes(next.token)?mod(key+11):null;
    if(tendency!==null&&before.some((midi,index)=>midi%12===tendency&&movement[index]!==1))return Infinity;
    return movement.reduce((cost,delta,index)=>cost+Math.abs(delta)*(index===0?.65:1)+Math.max(0,Math.abs(delta)-5)*2,0);
  }
  function voiceSatb(chords,key){
    const groups=chords.map(item=>satbCandidates(item,key));
    if(groups.some(group=>!group.length))throw new Error('当前古典进行无法生成符合音域的 SATB 配位');
    let beam=groups[0].map(chord=>({chord,path:[chord],cost:Math.abs(chord.voices.S-72)+Math.abs(chord.voices.A-65)+Math.abs(chord.voices.T-57)}))
      .sort((a,b)=>a.cost-b.cost).slice(0,120);
    for(let index=1;index<groups.length;index++){
      const next=[];
      for(const chord of groups[index]){
        let best=null;
        for(const state of beam){
          const transition=satbTransition(state.chord,chord,key);
          if(!Number.isFinite(transition))continue;
          const cost=state.cost+transition;
          if(!best||cost<best.cost)best={chord,path:[...state.path,chord],cost};
        }
        if(best)next.push(best);
      }
      beam=next.sort((a,b)=>a.cost-b.cost).slice(0,120);
      if(!beam.length)throw new Error('当前古典进行无法生成符合声部连接规则的 SATB 配位');
    }
    return beam[0].path;
  }
  function patterns(stylePack,tonality,selectedColors=[]){
    if(stylePack==='pop')return popPatterns[tonality];
    return Object.values(classicalFamilies[tonality]).flat().filter(path=>path.every(token=>!colors[token]||selectedColors.includes(colors[token])));
  }
  function validate({stylePack,tonality,selectedColors=[]}){
    if(!['pop','classical'].includes(stylePack)||!['major','minor'].includes(tonality))return '请选择有效的风格包与调式。';
    if(patterns(stylePack,tonality,selectedColors).length<4)return '当前风格可用进行不足，请调整语汇设置。';
    return '';
  }
  function chooseQuestion({stylePack,tonality,key,selectedColors=[],voiceMode='keyboard',previousId,rng=Math.random}){
    const error=validate({stylePack,tonality,selectedColors});if(error)throw new Error(error);
    const bank=patterns(stylePack,tonality,selectedColors);
    const eligible=bank.filter(path=>path.join('|')!==previousId);
    let candidatePool=eligible.length?eligible:bank;
    if(stylePack==='classical'){
      const families=Object.values(classicalFamilies[tonality]).map(paths=>paths.filter(path=>candidatePool.includes(path))).filter(paths=>paths.length);
      candidatePool=families[Math.floor(rng()*families.length)];
    }
    const picked=candidatePool[Math.floor(rng()*candidatePool.length)];
    const others=bank.filter(path=>path!==picked).sort((a,b)=>{
      const distance=path=>path.reduce((sum,token,index)=>sum+(token!==picked[index]),0);
      return distance(a)-distance(b)||rng()-.5;
    }).slice(0,3);
    const describe=path=>{
      const chords=path.map(token=>chord(token,key,tonality,stylePack));
      const voicings=stylePack==='classical'&&voiceMode==='satb'?voiceSatb(chords,key):voice(chords,stylePack);
      return {id:path.join('|'),tokens:[...path],chords,voicings,
        name:voicings.map(item=>item.symbol).join(' – '),subtitle:names[stylePack]};
    };
    const options=[picked,...others].map(describe).sort(()=>rng()-.5);
    const correct=options.find(option=>option.id===picked.join('|'));
    return {...correct,stylePack,voiceMode,options,choiceOptions:options,key,keyName:keyNames[key],tonality,
      usedChromatic:picked.some(token=>Boolean(colors[token])),replays:{question:0,correct:0,mine:0,ab:0}};
  }
  return {names,patterns,validate,chooseQuestion,voiceSatb,satbTransition,intervals};
})();
if(typeof window!=='undefined')window.ChordStylePacks=ChordStylePacks;
if(typeof module!=='undefined')module.exports=ChordStylePacks;
