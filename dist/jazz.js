// Traditional tonal jazz vocabulary, grammar and progression-wide piano voicing.
const JazzTrainer=(()=>{
  const roots=['C','D♭','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
  const vocabulary={
    major:{
      Imaj7:[0,'maj7','basic'],ii7:[2,'m7','basic'],iii7:[4,'m7','basic'],IVmaj7:[5,'maj7','basic'],
      V7:[7,'7','basic'],vi7:[9,'m7','basic'],'viiø7':[11,'m7♭5','basic'],
      'V7/ii':[9,'7','secondary'],'V7/iii':[11,'7','secondary'],'V7/IV':[0,'7','secondary'],
      'V7/V':[2,'7','secondary'],'V7/vi':[4,'7','secondary'],VI7:[9,'7','secondary'],
      subV7:[1,'7','advanced'],ivm7:[5,'m7','advanced'],'♭VII7':[10,'7','advanced'],
      '♯I°7':[1,'°7','advanced'],'♯IV°7':[6,'°7','advanced'],
      'V7♭9':[7,'7♭9','advanced'],'V7♯9':[7,'7♯9','advanced'],'V7♭13':[7,'7♭13','advanced']
    },
    minor:{
      i7:[0,'m7','basic'],i6:[0,'m6','basic'],'iiø7':[2,'m7♭5','basic'],'♭IIImaj7':[3,'maj7','basic'],
      iv7:[5,'m7','basic'],V7:[7,'7','basic'],'♭VImaj7':[8,'maj7','basic'],'♭VII7':[10,'7','basic'],
      'V7♭9':[7,'7♭9','secondary'],'V7/ii':[9,'7','secondary'],'V7/iv':[0,'7','secondary'],
      subV7:[1,'7','advanced'],'♯I°7':[1,'°7','advanced'],'V7♭13':[7,'7♭13','advanced']
    }
  };
  const grammar={
    major:{
      Imaj7:['vi7','iii7','ii7','IVmaj7','V7/ii','V7/iii','V7/IV','V7/V','V7/vi','VI7','♯I°7','ivm7'],
      vi7:['ii7','IVmaj7','V7'],iii7:['vi7','IVmaj7','ii7','V7'],IVmaj7:['iii7','ii7','V7','♯IV°7'],
      ii7:['V7','viiø7','subV7','V7♭9','V7♯9','V7♭13'],'viiø7':['Imaj7'],V7:['Imaj7','vi7'],
      'V7/ii':['ii7'],'V7/iii':['iii7'],'V7/IV':['IVmaj7'],'V7/V':['V7'],'V7/vi':['vi7','VI7'],
      VI7:['ii7','V7/V'],subV7:['Imaj7'],ivm7:['♭VII7','Imaj7'],'♭VII7':['Imaj7'],
      '♯I°7':['ii7'],'♯IV°7':['V7'],'V7♭9':['Imaj7'],'V7♯9':['Imaj7'],'V7♭13':['Imaj7']
    },
    minor:{
      i7:['iiø7','iv7','♭VImaj7','♭IIImaj7','V7/ii','V7/iv','♯I°7'],
      i6:['iiø7','iv7','♭VImaj7','V7/ii','♯I°7'],
      'iiø7':['V7','V7♭9','V7♭13','subV7'],'♭IIImaj7':['♭VImaj7','iv7'],
      iv7:['iiø7','V7','V7♭9','i7','i6'],V7:['i7','i6','♭VImaj7'],
      '♭VImaj7':['iiø7','iv7','♭VII7','V7'],'♭VII7':['♭IIImaj7','i7'],
      'V7♭9':['i7','i6'],'V7♭13':['i7','i6'],'V7/ii':['iiø7'],'V7/iv':['iv7'],
      subV7:['i7','i6'],'♯I°7':['iiø7']
    }
  };
  const starts={major:['Imaj7','vi7','IVmaj7','ii7','ivm7','V7/vi'],minor:['i7','i6','♭VImaj7','iv7','iiø7']};
  const ends={major:['Imaj7','V7'],minor:['i7','i6','V7']};
  const intervals={
    maj7:[0,4,7,11],m7:[0,3,7,10],'7':[0,4,7,10],'m7♭5':[0,3,6,10],
    '°7':[0,3,6,9],m6:[0,3,7,9],'7♭9':[0,4,7,10,13],'7♯9':[0,4,7,10,15],'7♭13':[0,4,7,10,20]
  };
  const rightHand={
    maj7:[4,11,14],m7:[3,10,14],'7':[4,10,14],'m7♭5':[3,10,17],
    '°7':[3,6,9],m6:[3,9,14],'7♭9':[4,10,13],'7♯9':[4,10,15],'7♭13':[4,10,20]
  };
  const rootless={
    maj7:[4,11,14,21],m7:[3,10,14,21],'7':[4,10,14,21],
    'm7♭5':[3,6,10,17],'°7':[3,6,9,15],m6:[3,9,14,19],'7♭9':[4,10,13,20],
    '7♯9':[4,10,15,20],'7♭13':[4,10,14,20]
  };
  const letters=['C','D','E','F','G','A','B'],natural=[0,2,4,5,7,9,11];
  const degrees={
    major:{Imaj7:0,ii7:1,iii7:2,IVmaj7:3,V7:4,vi7:5,'viiø7':6,
      'V7/ii':5,'V7/iii':6,'V7/IV':0,'V7/V':1,'V7/vi':2,VI7:5,
      ivm7:3,'♭VII7':6,'♯I°7':0,'♯IV°7':3,'V7♭9':4,'V7♯9':4,'V7♭13':4},
    minor:{i7:0,i6:0,'iiø7':1,'♭IIImaj7':2,iv7:3,V7:4,'♭VImaj7':5,'♭VII7':6,
      'V7♭9':4,'V7/ii':5,'V7/iv':0,'♯I°7':0,'V7♭13':4}
  };
  function allowed(token,tonality,packs){return Boolean(vocabulary[tonality][token]&&packs.includes(vocabulary[tonality][token][2]))}
  function colorCount(path,tonality){
    const colors=path.filter(token=>vocabulary[tonality][token][2]==='advanced');
    return colors.length===2&&colors.includes('ivm7')&&colors.includes('♭VII7')?1:colors.length;
  }
  function paths(tonality,packs){
    const result=[];
    function visit(path){
      if(path.length>=3){
        const repeated=path.some((token,index)=>index>0&&path.indexOf(token)<index&&!(index===3&&path[0]===token&&['Imaj7','i7','i6'].includes(token)));
        if(!repeated&&ends[tonality].includes(path.at(-1))&&colorCount(path,tonality)<=1)result.push(path);
        if(path.length===4)return;
      }
      for(const next of grammar[tonality][path.at(-1)]||[]){
        if(!allowed(next,tonality,packs)||path.at(-1)===next)continue;
        visit([...path,next]);
      }
    }
    for(const start of starts[tonality])if(allowed(start,tonality,packs))visit([start]);
    return result;
  }
  function distance(first,second){return first.reduce((count,token,index)=>count+(token!==second[index]),0)}
  function rootName(pc){return roots[(pc+120)%12]}
  function chordRootName(key,tonality,token,root){
    if(token==='subV7')return rootName(root);
    const tonicLetter=letters.indexOf(roots[key][0]);
    const letter=letters[(tonicLetter+degrees[tonality][token])%7];
    let offset=(root-natural[letters.indexOf(letter)]+12)%12;
    if(offset>6)offset-=12;
    const accidental={'-2':'𝄫','-1':'♭',0:'',1:'♯',2:'𝄪'}[offset];
    return accidental===undefined?rootName(root):letter+accidental;
  }
  function describe(tokens,key,tonality){
    const chords=tokens.map(token=>{
      const [degree,quality,pack]=vocabulary[tonality][token];
      const root=(key+degree)%12;
      return {token,quality,pack,root,symbol:`${chordRootName(key,tonality,token,root)}${quality}`};
    });
    return {id:tokens.join('|'),tokens,chords,name:chords.map(chord=>chord.symbol).join(' – '),subtitle:'传统爵士'};
  }
  function chooseQuestion({tonality,packs,key,voicingMode,previousId,rng=Math.random}){
    const bank=paths(tonality,packs);
    const candidates=bank.map(path=>{
      const near=bank.filter(other=>other.length===path.length&&other.at(-1)===path.at(-1)&&distance(path,other)>0&&distance(path,other)<=2);
      return {path,near};
    }).filter(item=>item.near.length>=3&&item.path.join('|')!==previousId);
    if(!candidates.length)throw new Error('当前爵士语汇不足以生成有效题目');
    const advanced=candidates.filter(item=>item.path.some(token=>vocabulary[tonality][token][2]==='advanced'));
    const secondary=candidates.filter(item=>item.path.some(token=>vocabulary[tonality][token][2]==='secondary'));
    let pool=advanced.length&&rng()<.34?advanced:secondary.length&&rng()<.48?secondary:candidates;
    const preferredLength=rng()<.3?3:4;
    const sized=pool.filter(item=>item.path.length===preferredLength);
    if(sized.length)pool=sized;
    const chosen=pool[Math.floor(rng()*pool.length)];
    const near=[...chosen.near].sort((a,b)=>Number(b[0]===chosen.path[0])-Number(a[0]===chosen.path[0])||distance(chosen.path,a)-distance(chosen.path,b)||rng()-.5).slice(0,3);
    const options=[chosen.path,...near].map(path=>{
      const item=describe(path,key,tonality);
      item.voicings=voiceProgression(item.chords,voicingMode);
      return item;
    }).sort(()=>rng()-.5);
    const correct=options.find(item=>item.id===chosen.path.join('|'));
    return {...correct,choiceOptions:options,options,keyName:rootName(key),key,tonality,
      voicingMode,packs:[...packs],jazz:true,usedChromatic:chosen.path.some(token=>vocabulary[tonality][token][2]!=='basic')};
  }
  function pitchChoices(pc){const result=[];for(let midi=55;midi<=81;midi++)if(midi%12===(pc+12)%12)result.push(midi);return result}
  function voicingCandidates(chord,mode){
    const shape=mode==='shell'?[intervals[chord.quality][1],intervals[chord.quality][3]]:
      mode==='rootless'?rootless[chord.quality]:rightHand[chord.quality];
    const targets=shape.map(interval=>pitchChoices(chord.root+interval));
    const results=[];
    function build(index,notes){
      if(index===targets.length){
        const sorted=[...notes].sort((a,b)=>a-b);
        if(new Set(sorted).size!==sorted.length||sorted.at(-1)-sorted[0]>19)return;
        if(sorted.some((note,i)=>i&&note-sorted[i-1]<2))return;
        results.push(sorted);return;
      }
      for(const midi of targets[index])build(index+1,[...notes,midi]);
    }
    build(0,[]);
    return results;
  }
  function voiceCost(a,b){
    return a.reduce((sum,note,index)=>{
      const move=Math.abs(note-b[index]);
      return sum+move+(move>5?(move-5)*2:0);
    },0);
  }
  function voiceProgression(chords,mode='training'){
    const candidates=chords.map(chord=>voicingCandidates(chord,mode));
    if(candidates.some(group=>!group.length))throw new Error('爵士配位超出可演奏范围');
    const costs=candidates[0].map(notes=>notes.reduce((sum,note)=>sum+Math.abs(note-67)*.08,0));
    const back=[];
    let previous=costs;
    for(let step=1;step<candidates.length;step++){
      const pointers=[];
      const current=candidates[step].map((notes,index)=>{
        let best=Infinity,bestIndex=0;
        candidates[step-1].forEach((last,lastIndex)=>{
          const cost=previous[lastIndex]+voiceCost(last,notes);
          if(cost<best){best=cost;bestIndex=lastIndex}
        });
        pointers[index]=bestIndex;return best;
      });
      back[step]=pointers;previous=current;
    }
    let index=previous.indexOf(Math.min(...previous));
    const voiced=new Array(chords.length);
    for(let step=chords.length-1;step>=0;step--){
      const chord=chords[step],right=[...candidates[step][index]];
      const bass=36+chord.root;
      voiced[step]={...chord,bass:mode==='rootless'?null:bass,right,
        notes:mode==='rootless'?right:[bass,...right]};
      index=back[step]?.[index]??index;
    }
    return voiced;
  }
  return {vocabulary,grammar,paths,chooseQuestion,voiceProgression,intervals,distance};
})();
if(typeof window!=='undefined')window.JazzTrainer=JazzTrainer;
if(typeof module!=='undefined')module.exports=JazzTrainer;
