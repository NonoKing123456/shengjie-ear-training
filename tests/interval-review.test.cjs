const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

const context={$:()=>({addEventListener(){}})};
const source=fs.readFileSync(path.join(__dirname,'../dist/review.js'),'utf8');
vm.runInNewContext(`${source}\nglobalThis.testSpelledPair=spelledPair;`,context);

test('interval review spells both VexFlow notes at the actual sounding MIDI pitch',()=>{
  const sizes={m2:1,M2:2,m3:3,M3:4,P4:5,TT:6,P5:7,m6:8,M6:9,m7:10,M7:11,P8:12,m9:13,M9:14,m10:15,M10:16,P11:17,A11:18,P12:19,m13:20,M13:21,m14:22,M14:23,P15:24};
  const naturals=[0,2,4,5,7,9,11];
  const sounding=note=>12*(Math.floor(note.index/7)+1)+naturals[((note.index%7)+7)%7]+note.accidental;
  for(let root=48;root<=80;root++)for(const direction of [-1,1])for(const [id,semitones] of Object.entries(sizes)){
    const [first,second]=context.testSpelledPair(root,root+direction*semitones,id,direction);
    assert.equal(sounding(first),root,`${id} ${root} first`);
    assert.equal(sounding(second),root+direction*semitones,`${id} ${root} second`);
    assert.ok(Math.abs(second.accidental)<=2,`${id} ${root} has a displayable accidental`);
  }
});
