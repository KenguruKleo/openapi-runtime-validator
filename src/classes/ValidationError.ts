import {ValidationErrorCode} from "../@types";

export default class ValidationError extends Error {
  public code: string;
  public operationId?: string;

  constructor(code: ValidationErrorCode, message?: string | undefined, operationId?: string) {
    super(message || code);
    this.code = code;
    this.operationId = operationId || "";
  }

  toString() {
    return this.message || this.code;
  }
}
