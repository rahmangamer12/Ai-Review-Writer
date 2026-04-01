/**
 * API Error Handler
 * Standardized error responses across all API endpoints
 */

import { NextResponse } from 'next/server'

export interface ApiErrorResponse {
  success: false
  error: string
  code?: string
  details?: Record<string, unknown>
  requiresReauth?: boolean
}

export interface ApiSuccessResponse<T> {
  success: true
  data: T
  partial_failure?: boolean
  warnings?: string[]
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

/**
 * Standardized error response for API endpoints
 */
export function apiError(
  message: string,
  statusCode: number = 500,
  options?: {
    code?: string
    details?: Record<string, unknown>
    requiresReauth?: boolean
  }
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = {
    success: false,
    error: message,
    ...(options?.code && { code: options.code }),
    ...(options?.details && { details: options.details }),
    ...(options?.requiresReauth && { requiresReauth: options.requiresReauth })
  }

  return NextResponse.json(response, { status: statusCode })
}

/**
 * Standardized success response for API endpoints
 */
export function apiSuccess<T>(
  data: T,
  statusCode: number = 200,
  options?: {
    partial_failure?: boolean
    warnings?: string[]
  }
): NextResponse<ApiSuccessResponse<T>> {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    ...(options?.partial_failure && { partial_failure: true }),
    ...(options?.warnings?.length && { warnings: options.warnings })
  }

  return NextResponse.json(response, { status: statusCode })
}

/**
 * Catch-all error handler for try-catch blocks
 */
export function handleApiError(
  error: unknown,
  defaultMessage: string = 'An error occurred',
  defaultStatus: number = 500
): NextResponse<ApiErrorResponse> {
  if (error instanceof SyntaxError) {
    return apiError('Invalid request format', 400, { code: 'INVALID_JSON' })
  }

  if (error instanceof TypeError) {
    return apiError('Invalid request parameters', 400, { code: 'INVALID_PARAMS' })
  }

  const message = error instanceof Error ? error.message : String(error)
  const finalMessage = message || defaultMessage

  console.error('[API Error]', { error, message: finalMessage, status: defaultStatus })

  return apiError(finalMessage, defaultStatus)
}

/**
 * Validate required parameters
 */
export function validateRequired(params: Record<string, unknown>, required: string[]): string | null {
  for (const key of required) {
    if (!params[key] || (typeof params[key] === 'string' && !params[key].trim())) {
      return `Missing required parameter: ${key}`
    }
  }
  return null
}

/**
 * Platform-specific error handler
 */
export function handlePlatformError(
  platform: string,
  error: unknown,
  context?: string
): NextResponse<ApiErrorResponse> {
  const message = error instanceof Error ? error.message : String(error)

  console.error(`[${platform.toUpperCase()} Error]${context ? ` [${context}]` : ''}`, {
    error,
    message
  })

  // Check for authentication errors
  if (
    message.includes('401') ||
    message.includes('Unauthorized') ||
    message.includes('invalid_grant') ||
    message.includes('expired')
  ) {
    return apiError(
      `${platform} authentication failed. Please re-authenticate.`,
      401,
      {
        code: 'AUTH_FAILED',
        requiresReauth: true
      }
    )
  }

  // Check for rate limiting
  if (message.includes('429') || message.includes('rate limit')) {
    return apiError(
      `${platform} rate limit exceeded. Please try again later.`,
      429,
      { code: 'RATE_LIMIT' }
    )
  }

  // Check for network errors
  if (
    message.includes('connection') ||
    message.includes('timeout') ||
    message.includes('ECONNREFUSED')
  ) {
    return apiError(
      `${platform} service is temporarily unavailable.`,
      503,
      { code: 'SERVICE_UNAVAILABLE' }
    )
  }

  // Generic error
  return apiError(
    `${platform} operation failed: ${message}`,
    500,
    { code: `${platform.toUpperCase()}_ERROR` }
  )
}

/**
 * Database error handler
 */
export function handleDatabaseError(error: unknown, operation: string = 'database operation'): NextResponse<ApiErrorResponse> {
  const message = error instanceof Error ? error.message : String(error)

  console.error('[Database Error]', { error, operation, message })

  // Check for connection errors
  if (
    message.includes('connection') ||
    message.includes('ENOTFOUND') ||
    message.includes('ECONNREFUSED')
  ) {
    return apiError(
      'Database connection failed. Please try again later.',
      503,
      { code: 'DB_CONNECTION_ERROR' }
    )
  }

  // Check for permission errors
  if (
    message.includes('permission') ||
    message.includes('Policy') ||
    message.includes('RLS')
  ) {
    return apiError(
      'Access denied. You do not have permission to perform this operation.',
      403,
      { code: 'PERMISSION_DENIED' }
    )
  }

  // Check for not found
  if (message.includes('No rows') || message.includes('not found')) {
    return apiError(
      'Record not found.',
      404,
      { code: 'NOT_FOUND' }
    )
  }

  // Generic error
  return apiError(
    `Database ${operation} failed: ${message}`,
    500,
    { code: 'DB_ERROR' }
  )
}
