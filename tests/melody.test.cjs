const test = require('node:test');
const assert = require('node:assert/strict');
const melody = require('../dist/melody.js');

test('tonal questions respect the selected key, length, range, and spelling', () => {
  for (const environment of ['major', 'minor']) {
    for (let key = 0; key < 12; key++) {
      for (const length of [4, 5, 6]) {
        for (const range of [7, 12]) {
          const question = melody.chooseQuestion({environment, length, range, keys:[key]});
          const scale = new Set(melody.scalePitches(question.signature, question.notes[0], range));
          assert.equal(question.notes.length, length);
          assert.equal(question.pitchClass, key);
          assert.ok(question.notes.every(midi => scale.has(midi)));
          assert.ok(question.notes.every(midi => melody.allowedPitch(midi, question.notes[0], range)));
          assert.ok(question.notes.every((midi, index) =>
            melody.pitchAt(question.spellings[index].staffIndex, question.signature, question.spellings[index].change) === midi));
        }
      }
    }
  }
});

test('chromatic questions use one controlled approach tone and retain tonal endpoints', () => {
  for (const environment of ['majorChromatic', 'minorChromatic']) {
    for (let key = 0; key < 12; key++) {
      for (let i = 0; i < 20; i++) {
        const question = melody.chooseQuestion({environment, length:4+i%3, range:i%2?7:12, keys:[key]});
        const scale = new Set(melody.scalePitches(question.signature, question.notes[0], question.range));
        const outside = question.notes.flatMap((midi, index) => scale.has(midi) ? [] : [index]);
        assert.equal(outside.length, 1);
        assert.ok(outside[0] > 0 && outside[0] < question.length - 1);
        assert.equal(Math.abs(question.notes[outside[0]]-question.notes[outside[0]+1]), 1);
        assert.ok(question.notes.every(midi => melody.allowedPitch(midi, question.notes[0], question.range)));
      }
    }
  }
});

test('atonal questions have no key signature and stay singable within the requested range', () => {
  for (const range of [7, 12]) {
    for (let i = 0; i < 250; i++) {
      const question = melody.chooseQuestion({environment:'atonal', length:4+i%3, range});
      assert.equal(question.signature, null);
      assert.equal(question.keyName, '无调性');
      assert.ok(question.notes.every(midi => melody.allowedPitch(midi, question.notes[0], range)));
      assert.ok(question.notes.every((midi, index) => index === 0 || Math.abs(midi-question.notes[index-1]) <= 7));
      assert.ok(question.notes.every((midi, index) => index === 0 || midi !== question.notes[index-1]));
    }
  }
});

test('generator avoids the previous sequence and differences preserve every error position', () => {
  const first = melody.chooseQuestion({environment:'major', length:5, range:7, keys:[2]});
  const next = melody.chooseQuestion({environment:'major', length:5, range:7, keys:[2], previousId:first.id});
  assert.notEqual(next.id, first.id);
  assert.deepEqual(melody.differences([60,62,64,65], [60,63,64,67]), [
    {index:1, correct:62, mine:63}, {index:3, correct:65, mine:67}
  ]);
});

test('input candidates at every vertical position snap to the nearest legal pitch', () => {
  for (const signature of [melody.signatureFor('major', 2), melody.signatureFor('minor', 7), null]) {
    for (const first of [64, 69, 74]) {
      for (const range of [7, 12]) {
        for (const accidental of [null, -1, 0, 1]) {
          const legal = Array.from({length:21}, (_, offset) => offset + 24).filter(index =>
            melody.allowedPitch(accidental === null ? melody.pitchAt(index, signature) : melody.pitchAt(index, null, accidental), first, range));
          for (let staffIndex = 24; staffIndex <= 44; staffIndex++) {
            const result = melody.nearestInputPitch(staffIndex, signature, first, range, accidental);
            assert.ok(result);
            assert.ok(melody.allowedPitch(result.midi, first, range));
            assert.equal(Math.abs(result.staffIndex - staffIndex), Math.min(...legal.map(index => Math.abs(index - staffIndex))));
            assert.equal(melody.pitchAt(result.staffIndex, signature, result.change), result.midi);
          }
        }
      }
    }
  }
});

test('atonal accidentals persist for the same letter and octave without repeated marks', () => {
  const notes = [66, 66, 65, 65, 78];
  const spellings = [31, 31, 31, 31, 38].map(staffIndex => ({staffIndex}));
  assert.deepEqual(melody.accidentalMarks(notes, spellings, null), ['#', null, 'n', null, '#']);
  const beforeThird = melody.accidentalsBefore(notes, spellings, 2, null);
  assert.equal(beforeThird.get(31), 1);
  assert.equal(beforeThird.has(38), false);
  assert.equal(melody.nearestInputPitch(31, null, 66, 12, null, beforeThird).midi, 66);
  assert.equal(melody.nearestInputPitch(38, null, 78, 12, null, beforeThird).midi, 77);
  const afterNatural = melody.accidentalsBefore(notes, spellings, 4, null);
  assert.equal(melody.nearestInputPitch(31, null, 66, 12, null, afterNatural).midi, 65);
});

test('editing an earlier accidental updates later inherited notes but preserves explicit ones', () => {
  const spellings = [
    {staffIndex:28, change:0},
    {staffIndex:31, change:1, explicit:true},
    {staffIndex:31, change:1, explicit:false},
    {staffIndex:31, change:0, explicit:true},
    {staffIndex:31, change:0, explicit:false}
  ];
  const changed = melody.reflowInheritedAccidentals([60, 65, 66, 65, 65], spellings, null, 60, 12);
  assert.deepEqual(changed.notes, [60, 65, 65, 65, 65]);
  assert.equal(changed.spellings[2].change, 0);
  assert.equal(changed.spellings[3].explicit, true);
  assert.deepEqual(melody.accidentalMarks(changed.notes, changed.spellings, null), [null, null, null, null, null]);
});
