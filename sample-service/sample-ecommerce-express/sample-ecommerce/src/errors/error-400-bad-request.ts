export class Error400BadRequest extends Error {
  code: number

  constructor(message: string) {
    super(message)
    this.code = 400
  }
}
