import { DEFAULT_MODEL_OPTION, parseLineSeparatedModels } from './shared.js';
import type { RuntimeAgentDef } from '../types.js';

export const dhcoderAgentDef = {
    id: 'dhcoder',
    name: 'DHcoder',
    bin: 'dhcoder',
    versionArgs: ['--version'],
    // `dhcoder models` prints `provider/model` per line, identical to OpenCode.
    // Network round-trips to the provider registry can be slow, so match the
    // 15s budget used by other listModels adapters.
    listModels: {
      args: ['models'],
      parse: parseLineSeparatedModels,
      timeoutMs: 15_000,
    },
    authProbe: {
      args: ['status'],
      timeoutMs: 5_000,
    },
    fallbackModels: [
      DEFAULT_MODEL_OPTION,
      { id: 'openai/gpt-5.1-codex-mini-high-dhcoder', label: 'openai/gpt-5.1-codex-mini-high-dhcoder' },
      { id: 'openai/gpt-5.4-high-dhcoder', label: 'openai/gpt-5.4-high-dhcoder' },
      { id: 'openai/gpt-5.4-xhigh-dhcoder', label: 'openai/gpt-5.4-xhigh-dhcoder' },
      { id: 'openai/gpt-oss-120b-dhcoder', label: 'openai/gpt-oss-120b-dhcoder' },
    ],
    // DHcoder is a fork of OpenCode and exposes the same argv shape:
    //   dhcoder run --format json [-s <session>] [-m <model>] [--dir <cwd>]
    // The prompt is delivered via stdin to avoid Windows command-line limits.
    buildArgs: (_prompt, _imagePaths, _extra, options = {}, runtimeContext = {}) => {
      const args = [
        'run',
        '--format',
        'json',
        '--dangerously-skip-permissions',
      ];
      // Capture-style resume: DHcoder mints its own session id (reported on
      // the stream as `sessionID`, e.g. `ses_...`). On a follow-up turn the
      // daemon continues that session with `-s <id>` instead of re-sending the
      // flattened transcript, so the first upstream call reuses the warm prefix
      // cache. `-s` continues an EXISTING session (the create turn passes no id
      // and we capture the one DHcoder generated), mirroring OpenCode.
      const resumeSessionId =
        typeof runtimeContext.resumeSessionId === 'string' &&
        runtimeContext.resumeSessionId.length > 0
          ? runtimeContext.resumeSessionId
          : null;
      if (resumeSessionId) {
        args.push('-s', resumeSessionId);
      }
      if (runtimeContext.cwd) {
        args.push('--dir', runtimeContext.cwd);
      }
      if (options.model && options.model !== 'default') {
        args.push('-m', options.model);
      }
      return args;
    },
    promptViaStdin: true,
    // DHcoder's CLI carries its own session across spawns: on a follow-up turn
    // the daemon resumes the captured session id (`-s <id>`) instead of
    // re-flattening the transcript. Capture-style — the resume handle is the
    // `sessionID` captured from the stream, not a daemon-minted id.
    resumesSessionViaCli: true,
    capturesSessionIdFromStream: true,
    streamFormat: 'json-event-stream',
    eventParser: 'dhcoder',
    // DHcoder inherits OpenCode's layered config, so the same env-based MCP
    // forwarding strategy works without polluting the user's saved config.
    externalMcpInjection: 'opencode-env-content',
    installUrl: 'https://dhcoder.com',
    docsUrl: 'https://docs.dhcoder.com',
} satisfies RuntimeAgentDef;
