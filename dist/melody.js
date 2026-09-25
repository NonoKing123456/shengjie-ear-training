// Fixed-rhythm melodic dictation: pitch model and VexFlow presentation.
(function (global) {
  'use strict';
  const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const NATURAL = [0, 2, 4, 5, 7, 9, 11];
  const MAJOR = [
    ['C', 0], ['Db', -5], ['D', 2], ['Eb', -3], ['E', 4], ['F', -1],
    ['F#', 6], ['G', 1], ['Ab', -4], ['A', 3], ['Bb', -2], ['B', 5]
  ];
  const MINOR = [
    ['C', -3], ['C#', 4], ['D', -1], ['Eb', -6], ['E', 1], ['F', -4],
    ['F#', 3], ['G', -2], ['G#', 5], ['A', 0], ['Bb', -5], ['B', 2]
  ];
  const FIFTH_SHARPS = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
  const FIFTH_FLATS = ['B', 'E', 'A', 'D', 'G', 'C', 'F'];
  const ENV_NAMES = {major:'大调', minor:'小调', majorChromatic:'大调 · 含调外音', minorChromatic:'小调 · 含调外音', atonal:'无调性'};

  function signatureFor(environment, pitchClass) {
    if (environment === 'atonal') return null;
    const [name, fifths] = (environment.startsWith('major') ? MAJOR : MINOR)[pitchClass];
    const alterations = Object.fromEntries(LETTERS.map(letter => [letter, 0]));
    if (fifths > 0) FIFTH_SHARPS.slice(0, fifths).forEach(letter => { alterations[letter] = 1; });
    if (fifths < 0) FIFTH_FLATS.slice(0, -fifths).forEach(letter => { alterations[letter] = -1; });
    return {name, fifths, alterations, vexKey: name + (environment.startsWith('minor') ? 'm' : ''), pitchClass};
  }

  function pitchAt(staffIndex, signature, change = 0) {
    const letterIndex = ((staffIndex % 7) + 7) % 7;
    const octave = Math.floor(staffIndex / 7);
    return 12 * (octave + 1) + NATURAL[letterIndex] + (signature?.alterations[LETTERS[letterIndex]] || 0) + change;
  }

  function spellingFor(midi, signature, direction = 0) {
    const choices = [];
    for (let staffIndex = 24; staffIndex <= 44; staffIndex++) {
      for (const change of [-1, 0, 1]) {
        if (pitchAt(staffIndex, signature, change) === midi) {
          choices.push({staffIndex, change});
        }
      }
    }
    choices.sort((a, b) => Math.abs(a.change) - Math.abs(b.change) ||
      (direction >= 0 ? b.change - a.change : a.change - b.change));
    return choices[0] || {staffIndex: 30, change: 0};
  }

  function noteLabel(midi, signature, direction = 0) {
    const {staffIndex, change} = spellingFor(midi, signature, direction);
    const letter = LETTERS[((staffIndex % 7) + 7) % 7];
    const alteration = (signature?.alterations[letter] || 0) + change;
    return `${letter}${alteration === 1 ? '♯' : alteration === -1 ? '♭' : ''}${Math.floor(staffIndex / 7)}`;
  }

  function keyName(environment, signature) {
    return environment === 'atonal' ? '无调性' : `${signature.name.replaceAll('b', '♭').replaceAll('#', '♯')} ${ENV_NAMES[environment]}`;
  }

  function degreeLabel(midi, signature) {
    if (!signature) return null;
    const names = ['1', '♭2', '2', '♭3', '3', '4', '♯4', '5', '♭6', '6', '♭7', '7'];
    return names[((midi - signature.pitchClass) % 12 + 12) % 12];
  }

  function allowedPitch(midi, firstMidi, range) {
    return Number.isInteger(midi) && midi >= 53 && midi <= 84 && Math.abs(midi - firstMidi) <= range;
  }

  function keyAccidental(staffIndex, signature) {
    return signature?.alterations[LETTERS[((staffIndex % 7) + 7) % 7]] || 0;
  }

  function accidentalsBefore(notes, spellings, until, signature) {
    const active = new Map();
    for (let index = 0; index < until; index++) {
      const midi = notes[index];
      if (!Number.isInteger(midi)) continue;
      const staffIndex = spellings?.[index]?.staffIndex ?? spellingFor(midi, signature).staffIndex;
      active.set(staffIndex, midi - pitchAt(staffIndex, null));
    }
    return active;
  }

  function accidentalMarks(notes, spellings, signature) {
    const active = new Map();
    return notes.map((midi, index) => {
      if (!Number.isInteger(midi)) return null;
      const staffIndex = spellings?.[index]?.staffIndex ?? spellingFor(midi, signature).staffIndex;
      const alteration = midi - pitchAt(staffIndex, null);
      const previous = active.get(staffIndex) ?? keyAccidental(staffIndex, signature);
      active.set(staffIndex, alteration);
      if (alteration === previous) return null;
      return ({[-2]:'bb',[-1]:'b',[0]:'n',[1]:'#',[2]:'##'})[alteration] || null;
    });
  }

  function reflowInheritedAccidentals(notes, spellings, signature, firstMidi, range) {
    const updatedNotes = [...notes], updatedSpellings = [...spellings], active = new Map();
    updatedNotes.forEach((midi, index) => {
      if (!Number.isInteger(midi)) return;
      const original = updatedSpellings[index] || spellingFor(midi, signature);
      const staffIndex = original.staffIndex;
      if (index > 0 && !original.explicit) {
        const alteration = active.get(staffIndex) ?? keyAccidental(staffIndex, signature);
        const inheritedMidi = pitchAt(staffIndex, null, alteration);
        if (allowedPitch(inheritedMidi, firstMidi, range)) {
          updatedNotes[index] = inheritedMidi;
          updatedSpellings[index] = {...original, change:inheritedMidi - pitchAt(staffIndex, signature)};
        } else updatedSpellings[index] = {...original, explicit:true};
      }
      active.set(staffIndex, updatedNotes[index] - pitchAt(staffIndex, null));
    });
    return {notes:updatedNotes, spellings:updatedSpellings};
  }

  function nearestInputPitch(staffIndex, signature, firstMidi, range, accidental = null, previous = null) {
    let nearest = null;
    for (let index = 24; index <= 44; index++) {
      const alteration = accidental === null ? previous?.get(index) ?? keyAccidental(index, signature) : accidental;
      const midi = pitchAt(index, null, alteration);
      if (!allowedPitch(midi, firstMidi, range)) continue;
      if (!nearest || Math.abs(index - staffIndex) < Math.abs(nearest.staffIndex - staffIndex)) {
        nearest = {staffIndex:index, midi, change:midi - pitchAt(index, signature)};
      }
    }
    return nearest;
  }

  function scalePitches(signature, firstMidi, range) {
    const result = [];
    for (let index = 24; index <= 44; index++) {
      const midi = pitchAt(index, signature);
      if (allowedPitch(midi, firstMidi, range)) result.push(midi);
    }
    return [...new Set(result)].sort((a, b) => a - b);
  }

  function stablePitch(midi, tonic, minor) {
    const degree = ((midi - tonic) % 12 + 12) % 12;
    return [0, minor ? 3 : 4, 7].includes(degree);
  }

  function weightedPick(items, weight) {
    const scores = items.map(item => Math.max(.01, weight(item)));
    let pick = Math.random() * scores.reduce((a, b) => a + b, 0);
    for (let i = 0; i < items.length; i++) if ((pick -= scores[i]) <= 0) return items[i];
    return items[items.length - 1];
  }

  function makeTonal(signature, length, range) {
    const minor = signature.vexKey.endsWith('m');
    const tonic = 60 + signature.pitchClass;
    const first = weightedPick([0, minor ? 3 : 4, 7].map(degree => tonic + degree).filter(midi => midi >= 64 && midi <= 74), () => 1);
    const scale = scalePitches(signature, first, range);
    const notes = [first], openingDirection = Math.random() < .5 ? -1 : 1;
    while (notes.length < length) {
      const last = notes[notes.length - 1], ending = notes.length === length - 1;
      let candidates = scale.filter(midi => midi !== last && Math.abs(midi - last) <= (ending ? 5 : 7));
      if (ending) candidates = candidates.filter(midi => stablePitch(midi, tonic, minor));
      if (!candidates.length) candidates = scale.filter(midi => midi !== last && (!ending || stablePitch(midi, tonic, minor)));
      const previous = notes[notes.length - 2];
      notes.push(weightedPick(candidates, midi => {
        const leap = Math.abs(midi - last);
        let score = leap <= 2 ? 5 : leap <= 4 ? 4 : leap <= 5 ? 2 : .4;
        if (previous !== undefined && midi === previous) score *= .46;
        if (previous !== undefined && Math.abs(last - previous) >= 5 && leap >= 5) score *= .18;
        if (!ending && Math.sign(midi - last) === openingDirection) score *= notes.length < 3 ? 1.6 : 1.2;
        if (ending && ((midi - tonic) % 12 + 12) % 12 === 0) score *= 2;
        return score;
      }));
    }
    return notes;
  }

  function addChromatic(notes, signature, range) {
    const scale = new Set(scalePitches(signature, notes[0], range));
    const choices = [];
    for (let index = 1; index < notes.length - 1; index++) {
      const previous = notes[index - 1], target = notes[index + 1];
      for (const candidate of [target - 1, target + 1]) {
        if (!allowedPitch(candidate, notes[0], range) || scale.has(candidate)) continue;
        if (candidate === previous || Math.abs(candidate - previous) > 4) continue;
        if (Math.abs(target - previous) < 2 && Math.abs(candidate - previous) === 1) continue;
        choices.push({index, candidate});
      }
    }
    if (!choices.length) return null;
    const {index, candidate} = weightedPick(choices, item => Math.abs(item.candidate - notes[item.index - 1]) <= 2 ? 2 : 1);
    const colored = [...notes]; colored[index] = candidate;
    return colored;
  }

  function makeAtonal(length, range) {
    const first = 64 + Math.floor(Math.random() * 9);
    const notes = [first], openingDirection = Math.random() < .5 ? -1 : 1;
    while (notes.length < length) {
      const last = notes[notes.length - 1], previous = notes[notes.length - 2];
      const ending = notes.length === length - 1;
      const candidates = [];
      for (let midi = first - range; midi <= first + range; midi++) {
        const leap = Math.abs(midi - last);
        if (!allowedPitch(midi, first, range) || !leap || leap > 7) continue;
        if (ending && Math.abs(midi - first) > 4) continue;
        if (previous !== undefined && midi === previous) continue;
        if (previous !== undefined && Math.abs(previous - last) === 1 && leap === 1) continue;
        candidates.push(midi);
      }
      if (!candidates.length) {
        for (let midi = first - range; midi <= first + range; midi++) {
          if (allowedPitch(midi, first, range) && midi !== last && Math.abs(midi - last) <= 7) candidates.push(midi);
        }
      }
      notes.push(weightedPick(candidates, midi => {
        const leap = Math.abs(midi - last);
        let weight = leap <= 2 ? 3 : leap <= 5 ? 4 : 1;
        if (!ending && Math.sign(midi - last) === openingDirection) weight *= notes.length < 3 ? 1.5 : 1.15;
        if (ending) weight *= 1 + (range - Math.abs(midi - first)) / (range * 2);
        return weight;
      }));
    }
    return notes;
  }

  function chooseQuestion(settings) {
    const {environment, length, range, keys = [0], previousId} = settings;
    for (let attempt = 0; attempt < 200; attempt++) {
      const pitchClass = environment === 'atonal' ? null : keys[Math.floor(Math.random() * keys.length)];
      const signature = signatureFor(environment, pitchClass);
      const base = environment === 'atonal' ? makeAtonal(length, range) : makeTonal(signature, length, range);
      const notes = environment.endsWith('Chromatic') ? addChromatic(base, signature, range) : base;
      if (!notes) continue;
      const id = `${environment}:${pitchClass ?? 'none'}:${notes.join(',')}`;
      if (id === previousId) continue;
      const spellings = notes.map((midi, index) => spellingFor(midi, signature, index ? midi - notes[index - 1] : 0));
      return {id, environment, pitchClass, signature, keyName:keyName(environment, signature), length, range, notes, spellings};
    }
    throw new Error('无法生成满足当前设置的旋律');
  }

  function differences(correct, mine) {
    return correct.flatMap((midi, index) => midi === mine[index] ? [] : [{index, correct:midi, mine:mine[index]}]);
  }

  function noteSpec(midi, signature, provided) {
    const {staffIndex} = provided || spellingFor(midi, signature);
    const letter = LETTERS[((staffIndex % 7) + 7) % 7];
    const octave = Math.floor(staffIndex / 7);
    return {key:`${letter.toLowerCase()}/${octave}`, staffIndex};
  }

  function renderScore(host, options) {
    const VF = global.VexFlow;
    if (!VF) throw new Error('VexFlow is unavailable');
    const {notes, signature, spellings, activeIndex = -1, errors = [], zone = 'input', onCell, onNote, compact = false} = options;
    const count = notes.length;
    const width = Math.max(320, Math.min(760, Math.floor(host.clientWidth || 760))), height = compact ? 184 : 220;
    host.replaceChildren();
    const canvas = document.createElement('div'); canvas.className = 'melody-score-canvas'; host.append(canvas);
    const renderer = new VF.Renderer(canvas, VF.Renderer.Backends.SVG);
    renderer.resize(width, height);
    const context = renderer.getContext();
    const stave = new VF.Stave(20, compact ? 38 : 50, width - 40).addClef('treble');
    if (signature) stave.addKeySignature(signature.vexKey);
    stave.setContext(context).draw();
    stave.setNoteStartX(stave.getNoteStartX() + 22);
    const marks = accidentalMarks(notes, spellings, signature);
    const tickables = notes.map((midi, index) => {
      if (midi == null) return new VF.GhostNote({duration:'q'});
      const spec = noteSpec(midi, signature, spellings?.[index]);
      const note = new VF.StaveNote({clef:'treble', keys:[spec.key], duration:'q', auto_stem:true});
      if (marks[index]) note.addModifier(new VF.Accidental(marks[index]), 0);
      note.setStave(stave);
      return note;
    });
    const voice = new VF.Voice({num_beats:count, beat_value:4}).setMode(VF.Voice.Mode.SOFT).addTickables(tickables);
    new VF.Formatter().joinVoices([voice]).formatToStave([voice], stave);
    voice.draw(context, stave);
    const svg = canvas.querySelector('svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('role', 'group');
    svg.setAttribute('aria-label', options.label || '旋律五线谱');
    const centers = tickables.map(note => note.getAbsoluteX());
    const staffBottom = stave.getYForLine(4);
    const NS = 'http://www.w3.org/2000/svg';
    const element = (tag, attributes) => {
      const node = document.createElementNS(NS, tag);
      Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, String(value)));
      svg.append(node); return node;
    };
    centers.forEach((center, index) => {
      const left = index ? (centers[index - 1] + center) / 2 + 4 : Math.max(stave.getNoteStartX() - 5, center - (centers[1] - center) / 2);
      const right = index === count - 1 ? width - 24 : (center + centers[index + 1]) / 2 - 4;
      if (errors.includes(index)) element('rect', {x:left, y:compact ? 12 : 25, width:right-left, height:compact ? 148 : 168, rx:9, class:`melody-error-highlight is-${zone}`});
      const candidate = event => {
        const box = svg.getBoundingClientRect();
        const y = (event.clientY - box.top) * height / box.height;
        const x = (event.clientX - box.left) * width / box.width;
        const staffIndex = Math.max(24, Math.min(44, Math.round(30 + (staffBottom - y) / 5)));
        return {staffIndex, midi:pitchAt(staffIndex, signature), x};
      };
      if (onCell && index > 0) {
        const rect = element('rect', {x:left, y:14, width:right-left, height:186, rx:8,
          class:`melody-cell-hit${index === activeIndex ? ' is-active' : ''}`, 'data-note-index':index, tabindex:0, role:'button',
          'aria-label':`第 ${index + 1} 个音，点击谱线或谱间输入`});
        rect.addEventListener('pointerdown', event => { if (event.pointerType !== 'touch') event.preventDefault(); });
        rect.addEventListener('pointermove', event => onCell(index, candidate(event), 'preview', event.pointerType));
        rect.addEventListener('pointerleave', event => {
          if (event.relatedTarget?.matches?.(`.melody-note-hit[data-note-index="${index}"]`)) return;
          onCell(index, null, 'leave');
        });
        rect.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); onCell(index, candidate(event), 'choose', event.pointerType); });
        rect.addEventListener('keydown', event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            const staffIndex = spellings?.[index]?.staffIndex ?? 30;
            onCell(index, {staffIndex, midi:pitchAt(staffIndex, signature), x:center}, 'choose');
          }
        });
      }
      if (midiIsFilled(notes[index])) {
        const y = tickables[index].getYs()[0];
        const interactive = !onCell || index > 0;
        const label = onCell ? `编辑第 ${index + 1} 个音` : `试听第 ${index + 1} 个音`;
        const attributes = onCell ?
          {cx:center, cy:y, r:15, class:`melody-note-hit is-${zone}`, 'data-note-index':index} :
          {x:left, y:compact ? 12 : 25, width:right-left, height:compact ? 148 : 168, rx:9,
            class:`melody-note-hit is-${zone}`, 'data-note-index':index};
        if (interactive) Object.assign(attributes, {tabindex:0, role:'button', 'aria-label':label});
        else attributes['aria-hidden'] = 'true';
        const hit = element(onCell ? 'circle' : 'rect', attributes);
        hit.addEventListener('pointerdown', event => { if (event.pointerType !== 'touch') event.preventDefault(); });
        if (onCell && index > 0) {
          hit.addEventListener('pointermove', event => onCell(index, candidate(event), 'preview', event.pointerType));
          hit.addEventListener('pointerleave', event => {
            if (event.relatedTarget?.matches?.(`.melody-cell-hit[data-note-index="${index}"]`)) return;
            onCell(index, null, 'leave');
          });
        }
        hit.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); if (interactive) onNote?.(index); });
        if (interactive) hit.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onNote?.(index); } });
      }
      element('text', {x:center, y:height-11, 'text-anchor':'middle', class:'melody-beat-label'}).textContent = String(index + 1);
    });
    return {width, height, centers, staffBottom};
  }

  function midiIsFilled(value) { return Number.isInteger(value); }

  global.MelodyTrainer = {ENV_NAMES, signatureFor, pitchAt, spellingFor, degreeLabel, noteLabel, keyName, allowedPitch, accidentalsBefore, accidentalMarks, reflowInheritedAccidentals, nearestInputPitch, scalePitches, chooseQuestion, differences, renderScore};
  if (typeof module !== 'undefined' && module.exports) module.exports = global.MelodyTrainer;
})(typeof window !== 'undefined' ? window : globalThis);
