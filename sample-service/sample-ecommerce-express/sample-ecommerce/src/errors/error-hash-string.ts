export class StringHashError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "StringHashError"
  }
}
