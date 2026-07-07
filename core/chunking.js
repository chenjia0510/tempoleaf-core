(function (root, factory) {
  const api = factory();
  root.RsvpCore = root.RsvpCore || {};
  root.RsvpCore.chunking = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const ABBREVIATIONS = new Set([
    'mr.', 'mrs.', 'ms.', 'dr.', 'prof.', 'sr.', 'jr.', 'st.',
    'e.g.', 'i.e.', 'etc.', 'vs.', 'fig.', 'no.', 'inc.', 'ltd.'
  ]);
  const ARTICLES = new Set(['a', 'an', 'the']);
  const PREPOSITIONS = new Set([
    'about', 'above', 'across', 'after', 'against', 'along', 'among', 'around',
    'at', 'before', 'behind', 'below', 'beneath', 'beside', 'between', 'beyond',
    'by', 'despite', 'during', 'for', 'from', 'in', 'inside', 'into', 'near',
    'of', 'off', 'on', 'onto', 'over', 'through', 'throughout', 'to', 'toward',
    'under', 'until', 'up', 'upon', 'with', 'within', 'without'
  ]);
  const CONJUNCTIONS = new Set([
    'and', 'or', 'but', 'nor', 'yet', 'so', 'because', 'although', 'though',
    'if', 'unless', 'while', 'when', 'where', 'whereas', 'which', 'who', 'that'
  ]);
  const AUXILIARIES = new Set([
    'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'can', 'could',
    'may', 'might', 'must', 'shall', 'should', 'will', 'would', 'do', 'does',
    'did', 'have', 'has', 'had'
  ]);
  const NEGATIONS = new Set(['not', "n't", 'never']);
  const POSSESSIVES = new Set(['my', 'your', 'his', 'her', 'its', 'our', 'their']);
  const OBJECT_COMPLEMENT_VERBS = new Set([
    'let', 'lets', 'letting', 'make', 'makes', 'making', 'help', 'helps', 'helping'
  ]);
  const SUBJECT_TAGS = new Set(['Noun', 'Pronoun', 'Person', 'Organization', 'Place']);
  const VERB_TAGS = new Set(['Verb', 'Auxiliary', 'Copula', 'Participle']);
  const CLAUSE_STARTERS = new Set([
    'although', 'because', 'but', 'if', 'unless', 'when', 'where', 'whereas',
    'while', 'who', 'which', 'that', 'and', 'or', 'yet', 'so'
  ]);
  const FIXED_PHRASES = [
    'as well as', 'because of', 'due to', 'even though', 'in addition to',
    'in front of', 'in order to', 'instead of', 'look forward to',
    'looks forward to', 'looked forward to', 'looking forward to',
    'on the other hand', 'such as', 'take into account', 'according to',
    'rather than', 'as a result', 'slow down', 'slows down', 'slowed down',
    'slowing down', 'less than half of', 'more than half of', 'at least half of',
    'fewer than half of', 'less than', 'more than', 'at least',
    'read out loud', 'reads out loud', 'reading out loud', 'read aloud',
    'reads aloud', 'reading aloud', 'return to', 'returns to', 'returned to',
    'returning to'
  ];

  function normalizeText(text) {
    return String(text || '').replace(/\r\n?/g, '\n').trim().replace(/\s+/g, ' ');
  }

  function cleanupWebNoise(text) {
    return String(text || '')
      .replace(/\r\n?/g, '\n')
      .replace(/\[\s*edit\s*\]/gi, ' ')
      .replace(/(?:\s*\[\s*\d+[a-z]?\s*\])+/gi, ' ')
      .replace(/\[\s*\]/g, ' ')
      .replace(/(^|\s)(?:\[|\])(?=\s|$)/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .replace(/\s+([,.;:!?])/g, '$1')
      .trim();
  }

  function cleanToken(token) {
    return String(token || '')
      .toLowerCase()
      .replace(/^[“”"'([{]+|[“”"')\]},;:!?—–.]+$/g, '');
  }

  function splitParagraphs(text) {
    return String(text || '')
      .replace(/\r\n?/g, '\n')
      .split(/\n\s*\n+/)
      .map((paragraph) => paragraph.replace(/\s*\n\s*/g, ' ').trim())
      .filter(Boolean);
  }

  function isSentenceEndingToken(token) {
    const raw = String(token || '').trim();
    const lower = raw.toLowerCase().replace(/[”"')\]]+$/g, '');
    if (!/[.!?][”"')\]]*$/.test(raw)) return false;
    if (ABBREVIATIONS.has(lower)) return false;
    if (/^\d+(?:\.\d+)+[.!?]?$/.test(lower)) return false;
    if (/^(?:[a-z]\.){2,}$/i.test(lower)) return false;
    return true;
  }

  function splitSentences(paragraph) {
    const tokens = String(paragraph || '').trim().split(/\s+/).filter(Boolean);
    const sentences = [];
    let current = [];
    for (const token of tokens) {
      current.push(token);
      if (isSentenceEndingToken(token)) {
        sentences.push(current);
        current = [];
      }
    }
    if (current.length) sentences.push(current);
    return sentences;
  }

  function punctuationOf(token) {
    const match = String(token || '').match(/([,;:!?—–.]|\.\.\.)[”"')\]]*$/);
    return match ? match[1] : null;
  }

  function tagTokens(tokens, nlpImpl) {
    const result = tokens.map(() => new Set());
    if (typeof nlpImpl !== 'function') return result;
    try {
      const sentences = nlpImpl(tokens.join(' ')).json();
      const terms = sentences.flatMap((sentence) => sentence.terms || []);
      for (let i = 0; i < Math.min(terms.length, result.length); i += 1) {
        for (const tag of terms[i].tags || []) result[i].add(tag);
      }
    } catch (_) {
      // The heuristic chunker remains usable if NLP tagging fails.
    }
    return result;
  }

  function markFixedPhrases(tokens, protectedBoundaries) {
    const cleaned = tokens.map(cleanToken);
    for (const phrase of FIXED_PHRASES) {
      const parts = phrase.split(' ');
      for (let start = 0; start <= cleaned.length - parts.length; start += 1) {
        if (parts.every((part, offset) => cleaned[start + offset] === part)) {
          for (let i = start; i < start + parts.length - 1; i += 1) {
            protectedBoundaries.add(i);
          }
        }
      }
    }
  }

  function buildProtectedBoundaries(tokens, tags) {
    const protectedBoundaries = new Set();
    markFixedPhrases(tokens, protectedBoundaries);

    for (let i = 0; i < tokens.length - 1; i += 1) {
      const current = cleanToken(tokens[i]);
      const next = cleanToken(tokens[i + 1]);
      const currentTags = tags[i] || new Set();
      const nextTags = tags[i + 1] || new Set();
      const currentPunctuation = punctuationOf(tokens[i]);

      if (
        ARTICLES.has(current) ||
        PREPOSITIONS.has(current) ||
        AUXILIARIES.has(current) ||
        NEGATIONS.has(current) ||
        /^(?:mr|mrs|ms|dr|prof|sr|jr)\.$/i.test(tokens[i])
      ) {
        protectedBoundaries.add(i);
      }

      if (
        (currentTags.has('Adjective') && nextTags.has('Noun')) ||
        (currentTags.has('Determiner') && (nextTags.has('Adjective') || nextTags.has('Noun'))) ||
        ((currentTags.has('Possessive') || POSSESSIVES.has(current)) && (nextTags.has('Adjective') || nextTags.has('Noun'))) ||
        (currentTags.has('Auxiliary') && (nextTags.has('Verb') || nextTags.has('Participle'))) ||
        (
          !currentPunctuation &&
          currentTags.has('Noun') &&
          nextTags.has('Noun') &&
          i > 0 &&
          (
            ARTICLES.has(cleanToken(tokens[i - 1])) ||
            PREPOSITIONS.has(cleanToken(tokens[i - 1])) ||
            (tags[i - 1] || new Set()).has('Adjective')
          )
        )
      ) {
        protectedBoundaries.add(i);
      }

      if (
        OBJECT_COMPLEMENT_VERBS.has(current) &&
        (nextTags.has('Pronoun') || nextTags.has('Noun')) &&
        i + 2 < tokens.length &&
        Array.from(tags[i + 2] || new Set()).some((tag) => VERB_TAGS.has(tag))
      ) {
        protectedBoundaries.add(i);
      }

      if (
        !currentPunctuation &&
        Array.from(currentTags).some((tag) => SUBJECT_TAGS.has(tag)) &&
        Array.from(nextTags).some((tag) => VERB_TAGS.has(tag)) &&
        !currentTags.has('Date') &&
        !currentTags.has('Duration')
      ) {
        protectedBoundaries.add(i);
      }

      if (current === 'to' && next) protectedBoundaries.add(i);
      if (
        /^(?:\d+(?:\.\d+)?|one|two|three|four|five|six|seven|eight|nine|ten)$/.test(current) &&
        /^(?:percent|percentage|per-cent)$/.test(next)
      ) {
        protectedBoundaries.add(i);
        if (i + 1 < tokens.length - 1) protectedBoundaries.add(i + 1);
      }
    }
    return protectedBoundaries;
  }

  function getModeLimits(options) {
    const mode = options.granularity || options.mode || 'practice';
    const table = {
      guided: { min: 2, idealMax: 4, hardMax: 6 },
      balanced: { min: 3, idealMax: 5, hardMax: 7 },
      practice: { min: 3, idealMax: 5, hardMax: 7 },
      broad: { min: 4, idealMax: 6, hardMax: 8 },
      challenge: { min: 4, idealMax: 6, hardMax: 8 }
    };
    const limits = { ...(table[mode] || table.practice) };
    if (Number.isFinite(options.maxWords)) {
      limits.idealMax = Math.max(1, Math.round(options.maxWords));
      limits.min = Math.max(1, Math.min(limits.min, limits.idealMax));
      limits.hardMax = Math.max(limits.idealMax + 1, Math.round(options.hardMaxWords || limits.idealMax + 2));
    }
    return limits;
  }

  function boundaryScore(tokens, tags, start, end, protectedBoundaries, isFinal) {
    if (isFinal) return 100;
    const token = tokens[end];
    const punctuation = punctuationOf(token);
    const next = cleanToken(tokens[end + 1]);
    const nextTags = tags[end + 1] || new Set();
    const segmentLength = end - start + 1;
    let score = 0;
    if (punctuation === ';' || punctuation === ':' || punctuation === '—' || punctuation === '–') score += 70;
    else if (punctuation === ',') score += 50;
    if (
      punctuation === ',' &&
      Array.from(nextTags).some((tag) => SUBJECT_TAGS.has(tag)) &&
      Array.from(tags[end + 2] || new Set()).some((tag) => VERB_TAGS.has(tag))
    ) score += 35;
    if (punctuation === ',' && nextTags.has('Verb')) score += 25;
    if (CLAUSE_STARTERS.has(next)) score += 35;
    if (
      segmentLength >= 2 &&
      (nextTags.has('Verb') || nextTags.has('Auxiliary') || nextTags.has('Copula'))
    ) score += segmentLength >= 3 ? 30 : 15;
    if (segmentLength >= 2 && PREPOSITIONS.has(next)) score += 20;
    if (protectedBoundaries.has(end)) score -= 120;
    const ending = cleanToken(token);
    if (
      ARTICLES.has(ending) ||
      PREPOSITIONS.has(ending) ||
      CONJUNCTIONS.has(ending) ||
      AUXILIARIES.has(ending) ||
      NEGATIONS.has(ending)
    ) score -= 90;
    return score;
  }

  function segmentScore(tokens, tags, start, end, limits, protectedBoundaries) {
    const length = end - start + 1;
    if (length > limits.hardMax) return -Infinity;
    let score = boundaryScore(tokens, tags, start, end, protectedBoundaries, end === tokens.length - 1);
    if (length >= limits.min && length <= limits.idealMax) score += 20;
    else if (length < limits.min) score -= (limits.min - length) * 15;
    else score -= (length - limits.idealMax) * 15;
    for (let i = start; i < end; i += 1) {
      const punctuation = punctuationOf(tokens[i]);
      if (punctuation === ',' || punctuation === ';' || punctuation === ':') score -= 45;
    }
    if (length === 1 && tokens.length > 1) score -= 60;
    if (start > 0 && CONJUNCTIONS.has(cleanToken(tokens[start])) && length === 1) score -= 80;
    return score;
  }

  function chooseSegments(tokens, tags, limits, protectedBoundaries) {
    const count = tokens.length;
    const best = Array(count + 1).fill(-Infinity);
    const previous = Array(count + 1).fill(-1);
    best[0] = 0;

    for (let endExclusive = 1; endExclusive <= count; endExclusive += 1) {
      const earliest = Math.max(0, endExclusive - limits.hardMax);
      for (let start = earliest; start < endExclusive; start += 1) {
        if (!Number.isFinite(best[start])) continue;
        const score = best[start] + segmentScore(
          tokens,
          tags,
          start,
          endExclusive - 1,
          limits,
          protectedBoundaries
        );
        if (score > best[endExclusive]) {
          best[endExclusive] = score;
          previous[endExclusive] = start;
        }
      }
    }

    if (previous[count] < 0) return [tokens.slice()];
    const segments = [];
    let cursor = count;
    while (cursor > 0) {
      const start = previous[cursor];
      segments.unshift(tokens.slice(start, cursor));
      cursor = start;
    }
    return segments;
  }

  function segmentText(text, options = {}) {
    const sourceText = options.cleanupNoise === 'web' ? cleanupWebNoise(text) : text;
    const paragraphs = splitParagraphs(sourceText);
    const limits = getModeLimits(options);
    const chunks = [];

    paragraphs.forEach((paragraph, paragraphIndex) => {
      const sentences = splitSentences(paragraph);
      sentences.forEach((tokens, sentenceIndex) => {
        const tags = tagTokens(tokens, options.nlp);
        const protectedBoundaries = buildProtectedBoundaries(tokens, tags);
        const segments = chooseSegments(tokens, tags, limits, protectedBoundaries);
        segments.forEach((segment, chunkIndex) => {
          const isLastInSentence = chunkIndex === segments.length - 1;
          const isLastInParagraph = isLastInSentence && sentenceIndex === sentences.length - 1;
          const punctuation = punctuationOf(segment[segment.length - 1]);
          let boundary = 'none';
          if (isLastInParagraph) boundary = 'paragraph';
          else if (isLastInSentence) boundary = 'sentence';
          else if (punctuation === ',' || punctuation === ';' || punctuation === ':' || punctuation === '—') {
            boundary = 'clause';
          }
          chunks.push({
            id: `p${paragraphIndex}-s${sentenceIndex}-c${chunkIndex}`,
            text: segment.join(' '),
            words: segment.slice(),
            wordCount: segment.length,
            boundary,
            punctuation,
            paragraphIndex,
            sentenceIndex,
            chunkIndex,
            confidence: boundary === 'none' ? 0.65 : 0.85
          });
        });
      });
    });
    return chunks;
  }

  function reconstructNormalized(chunks) {
    return normalizeText((chunks || []).map((chunk) => chunk.text).join(' '));
  }

  return {
    segmentText,
    normalizeText,
    cleanupWebNoise,
    reconstructNormalized,
    splitSentences,
    getModeLimits
  };
});
