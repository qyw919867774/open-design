// DHcoder speaks the same JSONL event dialect as OpenCode, so the renderer
// is a thin re-export. If DHcoder diverges later, fork this into a dedicated
// implementation instead of growing special cases in format-opencode.mjs.

export { renderAsOpencode as renderAsDhcoder } from './format-opencode.mjs';
