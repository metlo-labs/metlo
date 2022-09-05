export class Error401UnauthorizedRequest extends Error {
  code: number

  constructor(message: string) {
    super(message)
    this.code = 401
  }
}
