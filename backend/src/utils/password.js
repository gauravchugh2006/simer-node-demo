import crypto from 'crypto';

const iterations = 310000;
const keylen = 32;
const digest = 'sha256';

export const hashPassword = async (password, salt = crypto.randomBytes(16).toString('hex')) => {
  const derivedKey = await new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, iterations, keylen, digest, (err, derivedKeyBuffer) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(derivedKeyBuffer.toString('hex'));
    });
  });

  return `${salt}:${derivedKey}`;
};

export const verifyPassword = async (password, hashed) => {
  const [salt, key] = hashed.split(':');
  const hashToCompare = await hashPassword(password, salt);
  return hashToCompare === hashed;
};
