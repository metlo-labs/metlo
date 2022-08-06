export default class Error409Conflict extends Error {
  code: number;

  constructor(message: string) {
    super(message);
    this.code = 409;
  }
}
