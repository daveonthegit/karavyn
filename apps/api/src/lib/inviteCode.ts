import { INVITE_CODE_ALPHABET, INVITE_CODE_LENGTH } from '../config/constants.js';

export function generateInviteCode(): string {
  let code = '';
  const bytes = crypto.getRandomValues(new Uint8Array(INVITE_CODE_LENGTH));
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    code += INVITE_CODE_ALPHABET[bytes[i] % INVITE_CODE_ALPHABET.length];
  }
  return code;
}
