export class Error500InternalServer extends Error {
  code: number

  constructor(message: string) {
    super(message)
    this.code = 500
  }
}
