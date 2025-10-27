const SENSITIVE_KEYS = ['password', 'token', 'authorization', 'auth'];

const shouldRedact = (key) =>
  typeof key === 'string' && SENSITIVE_KEYS.includes(key.toLowerCase());

const redactValue = (value) => {
  if (Array.isArray(value)) {
    return value.map(redactValue);
  }
  if (value && typeof value === 'object') {
    return Object.entries(value).reduce((acc, [key, val]) => {
      acc[key] = shouldRedact(key) ? '[REDACTED]' : redactValue(val);
      return acc;
    }, {});
  }
  return value;
};

export const sanitizeForLogging = (payload) => {
  if (payload == null) {
    return payload;
  }
  return redactValue(payload);
};

export const logInfo = (message, metadata = undefined) => {
  if (metadata) {
    console.info(message, sanitizeForLogging(metadata));
    return;
  }
  console.info(message);
};

export const logError = (message, error, metadata = undefined) => {
  const payload = metadata ? sanitizeForLogging(metadata) : undefined;
  if (payload) {
    console.error(message, payload, error);
    return;
  }
  console.error(message, error);
};
