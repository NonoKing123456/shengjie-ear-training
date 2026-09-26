// Pop and classical progressions share a question shape with the jazz generator.
const ChordStylePacks=(()=>{
  const letters=['C','D','E','F','G','A','B'];
  const naturals=[0,2,4,5,7,9,11];
  const keyNames=['C','D♭','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
  const names={pop:'流行',jazz:'爵士',classical:'古典'};
  const popPatterns={
    major:[['I','V','vi','IV'],['I','vi','IV','V'],['vi','IV','I','V'],['IV','I','V','vi'],['I','IV','vi','V'],['vi','V','IV','I'],
      ['I','iii','vi','IV'],['I','ii','V','I'],['I','IV','vii°','I']],
    minor:[['i','VI','III','VII'],['i','VII','VI','VII'],['i','III','VI','VII'],['VI','III','VII','i'],['i','VI','iv','VII'],['III','VII','i','VI'],
      ['i','iv','v','i'],['i','ii°','v','i'],['III','VII','v','i']]
  };
  const popPackNames={diatonic:'调内三和弦',suspended:'挂留和弦',seventh:'七和弦',add:'Add／6·9 和弦',inversions:'转位和弦',modalBorrowing:'调式借用',secondaryDominant:'副属和弦'};
  const popVariants={
    major:{
      suspended:[['V','Vsus4'],['V','V7sus4'],['IV','IVsus4']],
      seventh:[['I','Imaj7'],['ii','ii7'],['iii','iii7'],['IV','IVmaj7'],['V','V7'],['vi','vi7'],['vii°','viiø7']],
      add:[['I','Iadd2'],['I','Iadd6'],['I','I6/9'],['IV','IVadd2'],['IV','IVadd6'],['IV','IV6/9'],['ii','iiadd2'],['vi','viadd2'],['vi','viadd4']],
      inversions:[['I','I6'],['IV','IV6'],['V','V6'],['vi','vi6']],
      modalBorrowing:[['IV','iv'],['vi','♭VI'],['V','♭VII'],['iii','♭III']],
      secondaryDominant:[['V','V7/V'],['vi','V7/vi'],['IV','V7/IV'],['ii','V7/ii']]
    },
    minor:{
      suspended:[['v','Vsus4'],['v','V7sus4'],['VII','VIIsus4'],['VII','VII7sus4'],['iv','ivsus4']],
      seventh:[['i','i7'],['ii°','iiø7'],['III','IIImaj7'],['iv','iv7'],['v','v7'],['v','V7'],['VI','VImaj7'],['VII','VII7']],
      add:[['i','iadd2'],['i','iadd4'],['iv','ivadd2'],['iv','ivadd4'],['III','IIIadd6'],['III','III6/9'],['VI','VIadd2'],['VI','VIadd6'],['VI','VI6/9']],
      inversions:[['i','i6'],['iv','iv6'],['VI','VI6'],['VII','VII6']],
      modalBorrowing:[['iv','IV'],['i','I'],['ii°','ii'],['v','V']],
      secondaryDominant:[['III','V7/III'],['VI','V7/VI'],['iv','V7/iv'],['v','V7/v']]
    }
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
    major:{I:[0,'maj',0],ii:[2,'min',1],iii:[4,'min',2],IV:[5,'maj',3],V:[7,'maj',4],vi:[9,'min',5],'vii°':[11,'dim',6],
      Vsus4:[7,'sus4',4],V7sus4:[7,'7sus4',4],IVsus4:[5,'sus4',3],Imaj7:[0,'maj7',0],ii7:[2,'m7',1],iii7:[4,'m7',2],IVmaj7:[5,'maj7',3],V7:[7,'7',4],vi7:[9,'m7',5],'viiø7':[11,'m7♭5',6],
      Iadd2:[0,'majadd2',0],Iadd6:[0,'majadd6',0],'I6/9':[0,'maj69',0],IVadd2:[5,'majadd2',3],IVadd6:[5,'majadd6',3],'IV6/9':[5,'maj69',3],iiadd2:[2,'minadd2',1],viadd2:[9,'minadd2',5],viadd4:[9,'minadd4',5],
      I6:[0,'maj',0,1],IV6:[5,'maj',3,1],V6:[7,'maj',4,1],vi6:[9,'min',5,1],
      iv:[5,'min',3],'♭VI':[8,'maj',5],'♭VII':[10,'maj',6],'♭III':[3,'maj',2],
      'V7/V':[2,'7',1],'V7/vi':[4,'7',2],'V7/IV':[0,'7',0],'V7/ii':[9,'7',5]},
    minor:{i:[0,'min',0],'ii°':[2,'dim',1],III:[3,'maj',2],iv:[5,'min',3],v:[7,'min',4],VI:[8,'maj',5],VII:[10,'maj',6],
      Vsus4:[7,'sus4',4],V7sus4:[7,'7sus4',4],VIIsus4:[10,'sus4',6],VII7sus4:[10,'7sus4',6],ivsus4:[5,'sus4',3],i7:[0,'m7',0],'iiø7':[2,'m7♭5',1],IIImaj7:[3,'maj7',2],iv7:[5,'m7',3],v7:[7,'m7',4],V7:[7,'7',4],VImaj7:[8,'maj7',5],VII7:[10,'7',6],
      iadd2:[0,'minadd2',0],iadd4:[0,'minadd4',0],ivadd2:[5,'minadd2',3],ivadd4:[5,'minadd4',3],IIIadd6:[3,'majadd6',2],'III6/9':[3,'maj69',2],VIadd2:[8,'majadd2',5],VIadd6:[8,'majadd6',5],'VI6/9':[8,'maj69',5],
      i6:[0,'min',0,1],iv6:[5,'min',3,1],VI6:[8,'maj',5,1],VII6:[10,'maj',6,1],
      IV:[5,'maj',3],I:[0,'maj',0],ii:[2,'min',1],V:[7,'maj',4],
      'V7/III':[10,'7',6],'V7/VI':[3,'7',2],'V7/iv':[0,'7',0],'V7/v':[2,'7',1]}
  };
  const classicalChords={
    major:{I:[0,'maj',0],I6:[0,'maj',0,1],I64:[0,'maj',0,2],ii:[2,'min',1],ii6:[2,'min',1,1],IV:[5,'maj',3],IV6:[5,'maj',3,1],V:[7,'maj',4],vi:[9,'min',5],N6:[1,'maj',1,1], 'V/V':[2,'maj',1], 'Ger+6':[8,'ger6',5]},
    minor:{i:[0,'min',0],i6:[0,'min',0,1],i64:[0,'min',0,2],'ii°6':[2,'dim',1,1],iv:[5,'min',3],iv6:[5,'min',3,1],V:[7,'maj',4],VI:[8,'maj',5],N6:[1,'maj',1,1], 'V/V':[2,'maj',1], 'Ger+6':[8,'ger6',5]}
  };
  const intervals={maj:[0,4,7],min:[0,3,7],dim:[0,3,6],ger6:[0,4,7,10],sus4:[0,5,7],'7sus4':[0,5,7,10],
    maj7:[0,4,7,11],m7:[0,3,7,10],'m7♭5':[0,3,6,10],'7':[0,4,7,10],majadd2:[0,2,4,7],majadd6:[0,4,7,9],maj69:[0,2,4,7,9],minadd2:[0,2,3,7],minadd4:[0,3,5,7]};
  const rightIntervals={
    '7sus4':[5,7,10],maj7:[4,7,11],m7:[3,7,10],'m7♭5':[3,6,10],'7':[4,7,10],
    majadd2:[2,4,7],majadd6:[4,7,9],maj69:[2,4,7,9],minadd2:[2,3,7],minadd4:[3,5,7]
  };
  const suffix={maj:'',min:'m',dim:'°',sus4:'sus4','7sus4':'7sus4',maj7:'maj7',m7:'m7','m7♭5':'m7♭5','7':'7',majadd2:'add2',majadd6:'add6',maj69:'6/9',minadd2:'madd2',minadd4:'madd4'};
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
  function bassName(rootNameValue,quality,inversion,bassPc){
    if(!inversion)return '';
    const step=inversion===1?2:4;
    const letter=letters[(letters.indexOf(rootNameValue[0])+step)%7];
    let alteration=mod(bassPc-naturals[letters.indexOf(letter)]);
    if(alteration>6)alteration-=12;
    const sign=({'-2':'𝄫','-1':'♭',0:'',1:'♯',2:'𝄪'})[alteration];
    if(sign===undefined)throw new Error(`无法拼写 ${quality} 的转位低音`);
    return `/${letter}${sign}`;
  }
  function chord(token,key,tonality,stylePack){
    const definition=(stylePack==='pop'?popChords:classicalChords)[tonality][token];
    if(!definition)throw new Error(`风格包不支持和弦 ${token}`);
    const [offset,quality,degree,inversion=0]=definition;
    const root=mod(key+offset),tones=intervals[quality];
    const bassPc=mod(root+tones[inversion]);
    const bass=36+bassPc+(36+bassPc<43?12:0);
    const name=rootName(key,degree,root);
    return {token,quality,root,rootLetter:name[0],symbol:quality==='ger6'?`${name}+6`:`${name}${suffix[quality]}${bassName(name,quality,inversion,bassPc)}`,
      bass,inversion,tones};
  }
  function rightCandidates(item){
    const pitchClasses=(rightIntervals[item.quality]|| (item.quality==='ger6'?item.tones.slice(1):item.tones)).map(tone=>mod(item.root+tone));
    const slots=pitchClasses.map(pc=>Array.from({length:24},(_,index)=>index+58).filter(midi=>midi%12===pc));
    const candidates=[];
    const collect=(index,notes)=>{
      if(index<slots.length){for(const midi of slots[index])collect(index+1,[...notes,midi]);return}
      const ordered=notes.sort((a,b)=>a-b);
      if(ordered.at(-1)-ordered[0]<=16&&ordered[0]>=60&&ordered.at(-1)<=79)candidates.push(ordered);
    };
    collect(0,[]);
    return candidates;
  }
  function voice(chords,stylePack){
    let previous=null;
    return chords.map(item=>{
      const choices=rightCandidates(item);
      if(!choices.length)throw new Error('当前和弦无法生成有效配位');
      choices.sort((a,b)=>{
        const cost=notes=>previous?notes.reduce((sum,midi,index)=>sum+Math.abs(midi-previous[Math.min(index,previous.length-1)]),0):notes.reduce((sum,midi)=>sum+Math.abs(midi-67),0);
        return cost(a)-cost(b);
      });
      const right=choices[0];previous=right;
      return {...item,right,notes:[item.bass,...right],stylePack};
    });
  }
  const satbRanges={S:[60,81],A:[55,74],T:[48,67]};
  function satbCandidates(item,key){
    const B=item.bass;
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
  function patterns(stylePack,tonality,selectedColors=[],popPacks=['diatonic']){
    if(stylePack==='pop'){
      const base=popPatterns[tonality];
      const result=[...base];
      for(const pack of popPacks){
        if(pack==='diatonic')continue;
        for(const [from,to] of popVariants[tonality][pack]||[])for(const path of base){
          path.forEach((token,index)=>{
            if(token!==from||pack==='secondaryDominant'&&index===0)return;
            const replacement=pack==='secondaryDominant'?index-1:index;
            result.push(path.map((item,i)=>i===replacement?to:item));
          });
        }
      }
      return [...new Map(result.map(path=>[path.join('|'),path])).values()];
    }
    return Object.values(classicalFamilies[tonality]).flat().filter(path=>path.every(token=>!colors[token]||selectedColors.includes(colors[token])));
  }
  function validate({stylePack,tonality,selectedColors=[],popPacks=['diatonic']}){
    if(!['pop','classical'].includes(stylePack)||!['major','minor'].includes(tonality))return '请选择有效的风格包与调式。';
    if(stylePack==='pop'&&(!popPacks.includes('diatonic')||popPacks.some(pack=>!popPackNames[pack])))return '流行语汇必须包含调内三和弦。';
    if(patterns(stylePack,tonality,selectedColors,popPacks).length<4)return '当前风格可用进行不足，请调整语汇设置。';
    return '';
  }
  function chooseQuestion({stylePack,tonality,key,selectedColors=[],popPacks=['diatonic'],voiceMode='keyboard',previousId,rng=Math.random}){
    const error=validate({stylePack,tonality,selectedColors,popPacks});if(error)throw new Error(error);
    const bank=patterns(stylePack,tonality,selectedColors,popPacks);
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
    return {...correct,stylePack,voiceMode,popPacks:[...popPacks],options,choiceOptions:options,key,keyName:keyNames[key],tonality,
      usedChromatic:picked.some(token=>Boolean(colors[token])||stylePack==='pop'&&
        [...popVariants[tonality].modalBorrowing,...popVariants[tonality].secondaryDominant].some(([,extra])=>extra===token)),
      replays:{question:0,correct:0,mine:0,ab:0}};
  }
  return {names,popPackNames,patterns,validate,chooseQuestion,voiceSatb,satbTransition,intervals};
})();
if(typeof window!=='undefined')window.ChordStylePacks=ChordStylePacks;
if(typeof module!=='undefined')module.exports=ChordStylePacks;
