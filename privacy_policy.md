# TempoLeaf Privacy Policy

Last updated: July 7, 2026

TempoLeaf is an English phrase-reading trainer for Chrome. It helps you select text on webpages, view phrase chunks, use focused playback, paste text into a reader, and look up individual English words.

This policy explains what data TempoLeaf handles and why.

## Summary

- TempoLeaf does not sell personal data.
- TempoLeaf does not use advertising trackers.
- TempoLeaf does not use analytics SDKs.
- Phrase chunking runs locally in the extension.
- Selected text and pasted text are not sent to an LLM or TempoLeaf server.
- A single word is sent to the Free Dictionary API only when you use the dictionary helper.

## Data Processed Locally

TempoLeaf may process the following data locally inside your browser:

- selected webpage text, when you choose Focus playback or Mark phrase chunks;
- pasted text, when you use the paste reader;
- reading settings such as speed, chunk size, context display, theme, and language;
- onboarding and tip state, such as whether you have already seen a welcome guide.

Phrase chunking, cleanup, playback scheduling, and reading display are handled locally by the extension.

## Data Stored by the Extension

TempoLeaf stores user preferences with Chrome extension storage so your settings continue to work between sessions.

- `chrome.storage.sync` is used for reading preferences such as speed, chunk size, theme, and language.
- `chrome.storage.local` is used for onboarding and local tip state.

TempoLeaf does not intentionally store your browsing history, full webpage content, or a history of dictionary lookups.

## Dictionary Lookup

When you click or request a word definition, TempoLeaf sends that individual word to the Free Dictionary API:

`https://api.dictionaryapi.dev/`

This is used only to fetch definitions, pronunciation, and related dictionary information. TempoLeaf does not send the full page, full sentence, or full selected passage for dictionary lookup.

Because this request goes to a third-party dictionary service, that service may receive standard network information such as your IP address and browser request metadata. Please review the third-party service's own terms and privacy practices if you need more detail.

## Website Access Permission

TempoLeaf asks Chrome for access to webpages because its main features work directly on page text:

- Focus playback uses selected text from the current webpage.
- Mark phrase chunks displays phrase boundaries on the original webpage.
- The dictionary helper can be opened on words shown in the extension interface.

The extension code may be available on webpages so these features can respond when you use the context menu or keyboard shortcuts. TempoLeaf does not use this access to collect browsing history, track website visits, or upload page content to a TempoLeaf server.

## No LLM Uploads

TempoLeaf does not send selected text to a large language model for phrase chunking. The phrase grouping uses local NLP tagging and deterministic rules inside the extension.

## Remote Code

TempoLeaf does not execute remotely hosted extension code. The extension package includes its own local scripts and assets. Network access is used for dictionary lookup only.

## Children's Privacy

TempoLeaf is a general reading tool and is not designed to knowingly collect personal information from children.

## Changes to This Policy

This policy may be updated when TempoLeaf changes how it handles data. The latest version should be used for Chrome Web Store review and user-facing privacy disclosure.

## Contact

For privacy questions, bug reports, or data handling concerns, please use the TempoLeaf support hub:

`https://github.com/chenjia0510/tempoleaf-core/issues/new/choose`
