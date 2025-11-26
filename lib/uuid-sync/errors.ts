/**
 * UUID Sync System - Custom Error Classes
 */

import { UUIDErrorCode } from './types';

export class UUIDValidationError extends Error {
  code = UUIDErrorCode.INVALID_MASK;
  
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'UUIDValidationError';
  }
}

export class UUIDNotFoundError extends Error {
  code = UUIDErrorCode.UUID_NOT_FOUND;
  
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'UUIDNotFoundError';
  }
}

export class MaskNotFoundError extends Error {
  code = UUIDErrorCode.MASK_NOT_FOUND;
  
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'MaskNotFoundError';
  }
}

export class FirestoreTransactionError extends Error {
  code = UUIDErrorCode.TRANSACTION_FAILED;
  
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'FirestoreTransactionError';
  }
}

export class CacheError extends Error {
  code = UUIDErrorCode.CACHE_ERROR;
  
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'CacheError';
  }
}

export function isUUIDError(error: any): error is { code: UUIDErrorCode } {
  return error && typeof error.code === 'string' && error.code in UUIDErrorCode;
}
