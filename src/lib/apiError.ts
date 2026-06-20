import { NextResponse } from 'next/server'

/**
 * Standard JSON error envelope. Keeps client-facing errors clean and never
 * leaks raw exception messages or stack traces (which can disclose DB schema,
 * file paths, etc.). Log the real detail server-side instead.
 */
export function apiError(
  message: string,
  status = 500,
  extra?: Record<string, unknown>
) {
  return NextResponse.json(
    { success: false, error: message, ...(extra ?? {}) },
    { status }
  )
}

/** Log the real error server-side, return a safe generic message to the client. */
export function serverError(
  logLabel: string,
  error: unknown,
  clientMessage = 'Something went wrong. Please try again.'
) {
  console.error(logLabel, error)
  return apiError(clientMessage, 500)
}
