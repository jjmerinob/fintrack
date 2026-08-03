import { ErrorHandler, Service } from '@angular/core';

@Service()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {}
}
