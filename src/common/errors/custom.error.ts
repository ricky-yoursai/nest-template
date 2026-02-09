export class CustomError extends Error {
  constructor(
    public readonly code: number,
    message: string,
    public readonly httpCode: number = 500,
  ) {
    super(message);
    this.name = 'CustomError';
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}
