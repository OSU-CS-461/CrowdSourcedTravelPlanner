const NON_ALPHANUMERIC = /[^a-z0-9]+/g;
const WHITESPACE = /\s+/g;

export function normalizeTagText(input: string): string {
  return input
    .toLowerCase()
    .replace(NON_ALPHANUMERIC, " ")
    .trim()
    .replace(WHITESPACE, " ");
}

export function sanitizeTagLabel(input: string): string {
  return input.trim().replace(WHITESPACE, " ");
}

export function slugFromTagText(input: string): string {
  const normalized = normalizeTagText(input);
  if (!normalized) return "";
  return normalized.replace(WHITESPACE, "-");
}
