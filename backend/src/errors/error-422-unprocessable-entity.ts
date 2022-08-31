export default class Error422UnprocessableEntity extends Error {
  code: number
  paylod: object | null

  constructor(message: string, payload?: object | null) {
    super(message)
    this.code = 422
    this.paylod = payload
  }
}
