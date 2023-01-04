import { DataField } from "models"

export const addDataClass = (
  dataField: DataField,
  dataClasses: string[],
) => {
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
  for (const dataClass of dataClasses) {
    if (
      !dataField.dataClasses.includes(dataClass) &&
      !dataField.falsePositives.includes(dataClass)
    ) {
      dataField.dataClasses.push(dataClass)
      dataField.scannerIdentified.push(dataClass)
    }
  }
}
