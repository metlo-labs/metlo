export default class Error401Unauthorized extends Error {
  code: number

  constructor(message: string) {
    super(message)
    this.code = 401
  }
}
