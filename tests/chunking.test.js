const test = require('node:test');
const assert = require('node:assert/strict');
const nlp = require('../libs/compromise.min.js');
const chunking = require('../core/chunking.js');

function chunksFor(text, options = {}) {
  return chunking.segmentText(text, { granularity: 'practice', nlp, ...options });
}

test('preserves normalized text and emits metadata', () => {
  const input = 'Although the result was promising, the sample was small.\n\nA second paragraph follows.';
  const chunks = chunksFor(input);
  assert.equal(chunking.reconstructNormalized(chunks), chunking.normalizeText(input));
  assert.ok(chunks.every((chunk) => chunk.id && chunk.wordCount > 0));
  assert.equal(chunks.at(-1).boundary, 'paragraph');
  assert.equal(chunks[0].paragraphIndex, 0);
  assert.equal(chunks.at(-1).paragraphIndex, 1);
});

test('does not split abbreviations and decimals as sentences', () => {
  const chunks = chunksFor('Dr. Smith reported a 3.14 percent increase in performance.');
  assert.ok(chunks.some((chunk) => chunk.text.includes('Dr. Smith')));
  assert.equal(chunks.filter((chunk) => chunk.boundary === 'sentence' || chunk.boundary === 'paragraph').length, 1);
  assert.equal(chunking.reconstructNormalized(chunks), 'Dr. Smith reported a 3.14 percent increase in performance.');
});

test('protects common multi-word expressions and noun phrases', () => {
  const chunks = chunksFor('She is looking forward to reading the new research paper.');
  const boundaries = chunks.map((chunk) => chunk.text).join(' | ');
  assert.doesNotMatch(boundaries, /looking forward \| to/);
  assert.doesNotMatch(boundaries, /the \| new/);
  assert.doesNotMatch(boundaries, /new research \| paper/);
});

test('keeps inflected fixed phrases and favors complete relative clauses', () => {
  const looking = chunksFor('She is looking forward to reading the new research paper.')
    .map((chunk) => chunk.text)
    .join(' | ');
  assert.doesNotMatch(looking, /looking \| forward/);

  const relative = chunksFor('The students who studied every day performed better on the final exam.')
    .map((chunk) => chunk.text);
  assert.ok(relative.some((chunk) => chunk === 'who studied every day'));
  assert.ok(relative.some((chunk) => chunk === 'on the final exam.'));
});

test('keeps common verb particles and percentage noun phrases together', () => {
  const slow = chunksFor('If you slow down at sentence boundaries, you may remember the passage more clearly.')
    .map((chunk) => chunk.text)
    .join(' | ');
  assert.doesNotMatch(slow, /slow \| down/);

  const percentage = chunksFor('Dr. Smith reported a 3.14 percent increase in performance.')
    .map((chunk) => chunk.text)
    .join(' | ');
  assert.doesNotMatch(percentage, /3\.14 percent \| increase/);
});

test('does not end a chunk with an article or auxiliary', () => {
  const chunks = chunksFor('If you slow down at sentence boundaries, you may remember the passage more clearly.');
  for (const chunk of chunks.slice(0, -1)) {
    assert.doesNotMatch(chunk.text.toLowerCase(), /\b(?:a|an|the|can|has|will)$/);
  }
});

test('keeps RSVP phrase guardrails readable', () => {
  const chunks = chunksFor('In the late Middle Ages, less than half of adults will have finished a book, and adults read often.');
  const boundaries = chunks.map((chunk) => chunk.text).join(' | ');
  assert.doesNotMatch(boundaries, /In the late \| Middle Ages/);
  assert.doesNotMatch(boundaries, /less than half \| of adults/);
  assert.doesNotMatch(boundaries, /will have \| finished/);
  assert.doesNotMatch(boundaries, /and \| adults read/);
});

test('keeps short subject and verb together when possible', () => {
  const boundaries = chunksFor('Although on occasion a person reads out loud for other listeners.')
    .map((chunk) => chunk.text)
    .join(' | ');
  assert.doesNotMatch(boundaries, /a person \| reads/);
  assert.doesNotMatch(boundaries, /person \| reads/);
  assert.doesNotMatch(boundaries, /reads \| out loud/);
});

test('respects the hard maximum in each mode', () => {
  const input = 'Reading meaningful phrases can help language learners process complex ideas with a smoother and more confident rhythm.';
  for (const mode of ['guided', 'practice', 'challenge']) {
    const limits = chunking.getModeLimits({ granularity: mode });
    const chunks = chunksFor(input, { granularity: mode });
    assert.ok(chunks.every((chunk) => chunk.wordCount <= limits.hardMax));
  }
});

test('handles CRLF, quotation marks, em dash, and citations', () => {
  const input = '“Chunking matters,” she said—although results vary (Smith, 2024).\r\nA new line continues.';
  const chunks = chunksFor(input);
  assert.equal(chunking.reconstructNormalized(chunks), chunking.normalizeText(input));
  assert.ok(chunks.every((chunk) => chunk.text.trim()));
});

test('cleans common web and Wikipedia noise when requested', () => {
  const input = '[ edit ] Reading is generally [10] an individual activity, [ ] done silently. [[11]]';
  const chunks = chunksFor(input, { cleanupNoise: 'web' });
  const text = chunking.reconstructNormalized(chunks);
  assert.equal(text, 'Reading is generally an individual activity, done silently.');
  assert.doesNotMatch(text, /\[\s*(?:edit|\d+)?\s*\]/i);
  assert.ok(chunks.every((chunk) => !/^\[|\]$/.test(chunk.text)));
});
