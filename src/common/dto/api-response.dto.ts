export interface FieldError {
  field: string;
  message: string;
}

export interface ErrorDetail {
  code: string;
  message: string;
  details: FieldError[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ErrorDetail;
  timestamp: string;
}

export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return { success: true, data, timestamp: new Date().toISOString() };
}

export function createErrorResponse(
  code: string,
  message: string,
  details: FieldError[] = [],
): ApiResponse<never> {
  return {
    success: false,
    error: { code, message, details },
    timestamp: new Date().toISOString(),
  };
}
