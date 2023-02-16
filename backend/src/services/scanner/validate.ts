const AADHAR_MULT = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
]
const AADHAR_PERM = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
]
const AADHAR_INV = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9]

export const validateAadhar = (e: string): boolean => {
  const sanitizedText = e.replace(/ /g, "")
  if (sanitizedText.length != 12) {
    return false
  }
  if (!sanitizedText.match(/^[\d]{12}$/)) {
    return false
  }
  const arr = sanitizedText.split("").map(e => parseInt(e))
  const checksum = arr.pop()
  let c = 0
  let invertedArray = arr.reverse()
  for (let i = 0; i < invertedArray.length; i++) {
    c = AADHAR_MULT[c][AADHAR_PERM[(i + 1) % 8][invertedArray[i]]]
  }
  return AADHAR_INV[c] == checksum
}

export const cpfVerifierDigit = (ls: number[]): number => {
  const modulus = ls.length + 1
  const multiplied = ls.map((number, index) => number * (modulus - index))
  const mod = multiplied.reduce((buffer, number) => buffer + number) % 11
  return mod < 2 ? 0 : 11 - mod
}

export const validateBrazilCPF = (e: string): boolean => {
  const sanitizedText = e.replace(/[^0-9]/g, "")
  if (sanitizedText.length != 11) {
    return false
  }

  const ls = sanitizedText.split("").map(e => parseInt(e))
  const checksumDigit2 = ls.pop()
  const checksumDigit1 = ls.pop()

  const realChecksumDigit1 = cpfVerifierDigit(ls)
  ls.push(realChecksumDigit1)
  const realChecksumDigit2 = cpfVerifierDigit(ls)

  return (
    realChecksumDigit1 == checksumDigit1 && realChecksumDigit2 == checksumDigit2
  )
}
