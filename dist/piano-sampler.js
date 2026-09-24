// A small sampler for the bundled Salamander piano recordings. Notes are decoded on demand.
window.GrandPianoSampler=class GrandPianoSampler{
  constructor(preset,context,bus){
    this.zones=preset.zones;this.context=context;this.bus=bus;this.pending=new Map();this.voices=new Set();
  }

  zoneFor(midi){return this.zones.find(zone=>midi>=zone.keyRangeLow&&midi<=zone.keyRangeHigh)}

  async prepare(pitches){
    await Promise.all([...new Set(pitches)].map(async midi=>{
      const zone=this.zoneFor(midi);
      if(!zone)throw new Error(`钢琴采样未覆盖 MIDI ${midi}`);
      if(zone.buffer)return;
      const key=zone.originalPitch;
      if(!this.pending.has(key)){
        const decode=(async()=>{
          const binary=atob(zone.file),bytes=new Uint8Array(binary.length);
          for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
          zone.buffer=await this.context.decodeAudioData(bytes.buffer);
        })();
        this.pending.set(key,decode);
        void decode.finally(()=>this.pending.delete(key)).catch(()=>{});
      }
      await this.pending.get(key);
    }));
  }

  queueWaveTable(start,midi,duration,volume){
    const zone=this.zoneFor(midi);
    if(!zone?.buffer)throw new Error(`钢琴采样尚未解码：MIDI ${midi}`);
    const when=Math.max(start,this.context.currentTime),rate=2**((midi-zone.originalPitch/100)/12);
    const length=Math.min(duration+.32,zone.buffer.duration/rate);
    const source=this.context.createBufferSource(),gain=this.context.createGain();
    source.buffer=zone.buffer;source.playbackRate.setValueAtTime(rate,when);
    gain.gain.setValueAtTime(.0001,when);
    gain.gain.linearRampToValueAtTime(Math.min(.8,volume),when+.008);
    gain.gain.setValueAtTime(Math.min(.8,volume),when+Math.min(duration,length-.02));
    gain.gain.exponentialRampToValueAtTime(.0001,when+length);
    source.connect(gain).connect(this.bus.input);
    const voice={source,gain};this.voices.add(voice);
    source.onended=()=>{this.voices.delete(voice);source.disconnect();gain.disconnect()};
    source.start(when);source.stop(when+length+.01);
    return voice;
  }

  async cancelQueue(){
    for(const {source,gain} of this.voices){
      gain.disconnect();
      try{source.stop(this.context.currentTime)}catch{}
    }
    this.voices.clear();
  }
};
