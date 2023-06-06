export interface RegisterUserParams {
  firstName: string
  lastName: string
  email: string
  password: string
  role: string
  dob: string
  phoneNumber?: string
  address?: string
}

export interface LoginUserParams {
  email: string
  password: string
}

export interface AddNewProductParams {
  name: string
  description: string
  price: number
  warehouseAddress: string
}

export interface PurchaseCartParams {
  firstName: string
  lastName: string
  ccn: string
  code: number
  expirationDate: string
  address: string
}
