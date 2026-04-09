/**
 * Enterprise Error Handling System
 * Standardized error responses and logging
 * @version 1.0.0
 */

/**
 * Standard Error Codes
 */
export enum ErrorCode {
  // Authentication & Authorization (1xxx)
  UNAUTHORIZED = 'AUTH_1001',
  FORBIDDEN = 'AUTH_1002',
  TOKEN_EXPIRED = 'AUTH_1003',
  INVALID_CREDENTIALS = 'AUTH_1004',

  // Validation Errors (2xxx)
  VALIDATION_ERROR = 'VAL_2001',
  INVALID_INPUT = 'VAL_2002',
  MISSING_REQUIRED_FIELD = 'VAL_2003',
  INVALID_FORMAT = 'VAL_2004',

  // Resource Errors (3xxx)
  NOT_FOUND = 'RES_3001',
  ALREADY_EXISTS = 'RES_3002',
  RESOURCE_EXHAUSTED = 'RES_3003',
  QUOTA_EXCEEDED = 'RES_3004',

  // Business Logic Errors (4xxx)
  INSUFFICIENT_CREDITS = 'BIZ_4001',
  PLAN_LIMIT_REACHED = 'BIZ_4002',
  FEATURE_NOT_AVAILABLE = 'BIZ_4003',
  OPERATION_NOT_ALLOWED = 'BIZ_4004',

  // External Service Errors (5xxx)
  EXTERNAL_API_ERROR = 'EXT_5001',
  PAYMENT_FAILED = 'EXT_5002',
  EMAIL_SEND_FAILED = 'EXT_5003',
  AI_SERVICE_ERROR = 'EXT_5004',

  // System Errors (6xxx)
  INTERNAL_ERROR = 'SYS_6001',
  DATABASE_ERROR = 'SYS_6002',
  NETWORK_ERROR = 'SYS_6003',
  TIMEOUT = 'SYS_6004',

  // Rate Limiting (7xxx)
  RATE_LIMIT_EXCEEDED = 'RATE_7001',
  TOO_MANY_REQUESTS = 'RATE_7002',
}

/**
 * Standard Error Response Interface
 */
export interface ErrorResponse {
  success: false
  error: {
    code: ErrorCode
    message: string
    details?: unknown
    timestamp: string
    requestId?: string
  }
}

/**
 * Standard Success Response Interface
 */
export interface SuccessResponse<T = unknown> {
  success: true
  data: T
  message?: string
  timestamp: string
}

/**
 * Error Messages Map
 */
const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // Authentication
  [ErrorCode.UNAUTHORIZED]: 'Authentication required. Please sign in to continue.',
  [ErrorCode.FORBIDDEN]: 'You do not have permission to perform this action.',
  [ErrorCode.TOKEN_EXPIRED]: 'Your session has expired. Please sign in again.',
  [ErrorCode.INVALID_CREDENTIALS]: 'Invalid credentials provided.',

  // Validation
  [ErrorCode.VALIDATION_ERROR]: 'Validation failed. Please check your input.',
  [ErrorCode.INVALID_INPUT]: 'Invalid input provided.',
  [ErrorCode.MISSING_REQUIRED_FIELD]: 'Required field is missing.',
  [ErrorCode.INVALID_FORMAT]: 'Invalid format provided.',

  // Resources
  [ErrorCode.NOT_FOUND]: 'The requested resource was not found.',
  [ErrorCode.ALREADY_EXISTS]: 'Resource already exists.',
  [ErrorCode.RESOURCE_EXHAUSTED]: 'Resource limit exhausted.',
  [ErrorCode.QUOTA_EXCEEDED]: 'Quota exceeded for this operation.',

  // Business Logic
  [ErrorCode.INSUFFICIENT_CREDITS]: 'Insufficient AI credits. Please upgrade your plan or purchase credits.',
  [ErrorCode.PLAN_LIMIT_REACHED]: 'You have reached your plan limit. Please upgrade to continue.',
  [ErrorCode.FEATURE_NOT_AVAILABLE]: 'This feature is not available on your current plan.',
  [ErrorCode.OPERATION_NOT_ALLOWED]: 'This operation is not allowed.',

  // External Services
  [ErrorCode.EXTERNAL_API_ERROR]: 'External service error. Please try again later.',
  [ErrorCode.PAYMENT_FAILED]: 'Payment processing failed. Please check your payment method.',
  [ErrorCode.EMAIL_SEND_FAILED]: 'Failed to send email. Please try again.',
  [ErrorCode.AI_SERVICE_ERROR]: 'AI service temporarily unavailable. Please try again.',

  // System
  [ErrorCode.INTERNAL_ERROR]: 'An internal error occurred. Our team has been notified.',
  [ErrorCode.DATABASE_ERROR]: 'Database operation failed. Please try again.',
  [ErrorCode.NETWORK_ERROR]: 'Network error occurred. Please check your connection.',
  [ErrorCode.TIMEOUT]: 'Request timeout. Please try again.',

  // Rate Limiting
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded. Please try again later.',
  [ErrorCode.TOO_MANY_REQUESTS]: 'Too many requests. Please slow down.',
}

/**
 * HTTP Status Code Mapping
 */
const ERROR_STATUS_CODES: Record<ErrorCode, number> = {
  // Authentication
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.TOKEN_EXPIRED]: 401,
  [ErrorCode.INVALID_CREDENTIALS]: 401,

  // Validation
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.INVALID_INPUT]: 400,
  [ErrorCode.MISSING_REQUIRED_FIELD]: 400,
  [ErrorCode.INVALID_FORMAT]: 400,

  // Resources
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.ALREADY_EXISTS]: 409,
  [ErrorCode.RESOURCE_EXHAUSTED]: 429,
  [ErrorCode.QUOTA_EXCEEDED]: 429,

  // Business Logic
  [ErrorCode.INSUFFICIENT_CREDITS]: 402,
  [ErrorCode.PLAN_LIMIT_REACHED]: 402,
  [ErrorCode.FEATURE_NOT_AVAILABLE]: 403,
  [ErrorCode.OPERATION_NOT_ALLOWED]: 403,

  // External Services
  [ErrorCode.EXTERNAL_API_ERROR]: 502,
  [ErrorCode.PAYMENT_FAILED]: 402,
  [ErrorCode.EMAIL_SEND_FAILED]: 500,
  [ErrorCode.AI_SERVICE_ERROR]: 503,

  // System
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.NETWORK_ERROR]: 503,
  [ErrorCode.TIMEOUT]: 504,

  // Rate Limiting
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,
  [ErrorCode.TOO_MANY_REQUESTS]: 429,
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  code: ErrorCode,
  customMessage?: string,
  details?: unknown,
  requestId?: string
): ErrorResponse {
  return {
    success: false,
    error: {
      code,
      message: customMessage || ERROR_MESSAGES[code],
      details,
      timestamp: new Date().toISOString(),
      requestId,
    },
  }
}

/**
 * Create standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string
): SuccessResponse<T> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Get HTTP status code for error
 */
export function getErrorStatusCode(code: ErrorCode): number {
  return ERROR_STATUS_CODES[code] || 500
}

/**
 * Log error with context
 */
export function logError(
  error: Error | unknown,
  context: {
    userId?: string
    endpoint?: string
    method?: string
    requestId?: string
  }
): void {
  const errorDetails = {
    message: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    context,
    timestamp: new Date().toISOString(),
  }

  // In production, send to monitoring service (Sentry, DataDog, etc.)
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to monitoring service
    console.error('[PRODUCTION ERROR]', JSON.stringify(errorDetails, null, 2))
  } else {
    console.error('[ERROR]', errorDetails)
  }
}

/**
 * Application Error Class
 */
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message?: string,
    public details?: unknown
  ) {
    super(message || ERROR_MESSAGES[code])
    this.name = 'AppError'
  }

  toResponse(requestId?: string): ErrorResponse {
    return createErrorResponse(this.code, this.message, this.details, requestId)
  }

  getStatusCode(): number {
    return getErrorStatusCode(this.code)
  }
}

/**
 * Error Handler Middleware Helper
 */
export function handleApiError(
  error: Error | AppError | unknown,
  requestId?: string
): { response: ErrorResponse; statusCode: number } {
  if (error instanceof AppError) {
    return {
      response: error.toResponse(requestId),
      statusCode: error.getStatusCode(),
    }
  }

  // Unknown error - treat as internal error
  const internalError = createErrorResponse(
    ErrorCode.INTERNAL_ERROR,
    error instanceof Error ? error.message : 'An unexpected error occurred',
    undefined,
    requestId
  )

  return {
    response: internalError,
    statusCode: 500,
  }
}
