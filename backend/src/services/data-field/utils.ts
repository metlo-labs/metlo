import { DataField } from "models"

export const addDataClass = (
  dataField: DataField,
  dataClass: string,
): boolean => {
  if (dataField.dataClasses === null || dataField.dataClasses === undefined) {
    dataField.dataClasses = Array<string>()
  }
  if (
    dataField.falsePositives === null ||
    dataField.falsePositives === undefined
  ) {
    dataField.falsePositives = Array<string>()
  }
  if (
    dataField.scannerIdentified === null ||
    dataField.scannerIdentified === undefined
  ) {
    dataField.scannerIdentified = Array<string>()
  }
  if (
    dataClass === null ||
    dataField.dataClasses.includes(dataClass) ||
    dataField.falsePositives.includes(dataClass)
  ) {
    return false
  }
  dataField.dataClasses.push(dataClass)
  dataField.scannerIdentified.push(dataClass)
  return true
}
