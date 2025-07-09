import rateLimit from 'express-rate-limit';

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,                   // Limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many login/register attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,   // Return rate limit info in headers
  legacyHeaders: false,    // Disable the `X-RateLimit-*` headers
});