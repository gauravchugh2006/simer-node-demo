import { logError, logInfo, sanitizeForLogging } from '../utils/logger.js';

const buildRequestSummary = (req) => ({
  method: req.method,
  url: req.originalUrl,
  params: sanitizeForLogging(req.params),
  query: sanitizeForLogging(req.query),
  body: sanitizeForLogging(req.body)
});

const requestLogger = (req, res, next) => {
  const summary = buildRequestSummary(req);
  const startedAt = Date.now();

  logInfo('Incoming request', summary);

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    logInfo('Request completed', {
      ...summary,
      statusCode: res.statusCode,
      durationMs
    });
  });

  res.on('error', (error) => {
    logError('Response error', error, {
      ...summary
    });
  });

  next();
};

export default requestLogger;
