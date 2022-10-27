import { DataClass } from "@common/enums"
import { DataField } from "models"

export const addDataClass = (dataField: DataField, dataClass: DataClass): boolean => {
  if (dataField.dataClasses === null || dataField.dataClasses === undefined) {
    dataField.dataClasses = Array<DataClass>()
  }
  if (dataField.falsePositives === null || dataField.falsePositives === undefined) {
    dataField.falsePositives = Array<DataClass>()
  }
  if (
    dataField.scannerIdentified === null ||
    dataField.scannerIdentified === undefined
  ) {
    dataField.scannerIdentified = Array<DataClass>()
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
