import crypto from 'crypto';
import { Buffer } from 'node:buffer';

const PBKDF2_ITERATIONS = 120000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';
const SALT_LENGTH = 16;

/**
 * 비밀번호 해시를 생성합니다.
 * @param {string} password
 * @returns {{ hash: string, salt: string }}
 */
export function createPasswordHash(password) {
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, DIGEST)
    .toString('hex');

  return { hash, salt };
}

/**
 * 비밀번호를 검증합니다.
 * @param {string} password
 * @param {string} salt
 * @param {string} expectedHash
 * @returns {boolean}
 */
export function verifyPasswordHash(password, salt, expectedHash) {
  const hash = crypto
    .pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, DIGEST)
    .toString('hex');

  const hashBuffer = Buffer.from(hash, 'hex');
  const expectedBuffer = Buffer.from(expectedHash, 'hex');

  if (hashBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(hashBuffer, expectedBuffer);
}
