/** Letras (incl. acentuadas) e espaços — sem números, emojis ou símbolos. */
export const FORM_NAME_DISALLOWED = /[^\p{L}\s]/gu;

export const FORM_NAME_VALID = /^(?=.*\p{L})[\p{L}\s]{1,120}$/u;

export const FORM_NAME_USAGE_HINT =
  'Use apenas letras e espaços. Acentos permitidos; sem números, emojis ou símbolos.';

/**
 * Texto livre: letras, números, espaços/linhas e pontuação habitual.
 * Bloqueia emojis e símbolos que possam comprometer a base de dados.
 */
export const FORM_MESSAGE_DISALLOWED = /[^\p{L}\p{N}\s.,!?;:\-'"()\/%@#&*+=\n\r]/gu;

export const FORM_MESSAGE_VALID = /^[\p{L}\p{N}\s.,!?;:\-'"()\/%@#&*+=\n\r]+$/u;

export const FORM_MESSAGE_USAGE_HINT =
  'Letras, números, espaços e pontuação usual (. , ! ? ; : - etc.). Sem emojis nem símbolos especiais.';

export interface SanitizeInputResult {
  value: string;
  removedChars: boolean;
}

export function sanitizeFormName(value: string): string {
  return value.replace(FORM_NAME_DISALLOWED, '');
}

export function sanitizeFormMessage(value: string, maxLength?: number): string {
  let sanitized = value.replace(FORM_MESSAGE_DISALLOWED, '');
  if (maxLength != null && sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }
  return sanitized;
}

export function applySanitizedInput(
  input: HTMLInputElement | HTMLTextAreaElement,
  disallowedPattern: RegExp,
  maxLength?: number,
): SanitizeInputResult {
  const original = input.value;
  const start = input.selectionStart ?? original.length;
  const before = original.slice(0, start);
  let sanitized = original.replace(disallowedPattern, '');
  if (maxLength != null && sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }
  const removedChars = sanitized !== original;
  if (removedChars) {
    const cursor = Math.min(before.replace(disallowedPattern, '').length, sanitized.length);
    input.value = sanitized;
    input.setSelectionRange(cursor, cursor);
  }
  return { value: sanitized, removedChars };
}
