# TempoLeaf Core

TempoLeaf is an English phrase-reading trainer that helps learners stop reading word by word.

This repository is the public chunking core for TempoLeaf. It contains the phrase-grouping logic, supporting test fixture dependency, public documentation, and GitHub feedback forms. The complete Chrome extension product is maintained separately and is not part of this repository.

## What this repo contains

- `core/chunking.js`
- `libs/compromise.min.js`
- chunking-focused tests
- MPL-2.0 license
- issue forms for bug reports, chunking problems, and experience feedback

## What this repo does not contain

- Chrome extension UI
- onboarding guide pages
- popup, reader, overlay, or dictionary integration
- store screenshots, branding assets, or release workflow

## Product positioning

TempoLeaf is an English phrase-reading trainer that helps learners stop reading word by word.

Chunking means seeing collocations, phrases, and sentence patterns as meaningful units instead of processing every word separately. TempoLeaf uses this idea to help readers build phrase awareness first, then improve pace without treating comprehension as a simple speed contest.

## NLP approach

TempoLeaf Core uses local NLP tags and deterministic phrase rules to estimate chunk boundaries. It is designed for fast, private, repeatable chunking rather than heavy server-side analysis.

Advantages:

- Runs locally with low latency
- Keeps selected text on the device during chunking
- Produces stable, repeatable boundaries for the same input
- Easy to test, debug, and improve with concrete regression cases

Limitations:

- It is not a large language model and does not deeply reason over full discourse context
- Unusual syntax, ambiguous phrasing, names, citations, or noisy webpage text can still lead to awkward chunk boundaries
- Some tradeoffs favor readable phrase grouping over full linguistic accuracy

## Feedback

If you want to report chunking that feels unnatural, please use the GitHub Issue Forms in this repo.

Recommended topics:

- chunking problems
- playback or integration bugs
- learning experience feedback

## Privacy Policy

The Chrome extension privacy policy is available at [privacy_policy.md](privacy_policy.md).

## Local test

Requires Node.js 20 or newer.

```bash
npm test
```
