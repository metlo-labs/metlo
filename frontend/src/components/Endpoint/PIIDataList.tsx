import React from "react";
import { useColorMode, Code, Badge } from "@chakra-ui/react";
import { PIIField } from "@common/types";
import DataTable, { TableColumn } from "react-data-table-component";
import { getCustomStyles, rowStyles } from "../utils/TableUtils";
import { RISK_TO_COLOR, DATA_CLASS_TO_RISK_SCORE } from "../../constants";
import { getDateTimeString } from "../../utils";

interface PIIDataListProps {
  PIIFields: PIIField[];
}

const PIIDataList: React.FC<PIIDataListProps> = React.memo(({ PIIFields }) => {
  const colorMode = useColorMode();
  const columns: TableColumn<PIIField>[] = [
    {
      name: "Risk Score",
      sortable: true,
      selector: (row: PIIField) => row.risk || "",
      cell: (row: PIIField) => (
        <Badge
          p="1"
          fontSize="sm"
          colorScheme={RISK_TO_COLOR[DATA_CLASS_TO_RISK_SCORE[row.dataClass]]}
          pointerEvents="none"
        >
          {DATA_CLASS_TO_RISK_SCORE[row.dataClass]}
        </Badge>
      ),
      id: "riskScore",
      grow: 1,
    },
    {
      name: "Data Type",
      sortable: true,
      selector: (row: PIIField) => row.dataClass || "",
      id: "dataType",
      grow: 1,
    },
    {
      name: "Data Path",
      sortable: true,
      selector: (row: PIIField) => row.dataPath,
      cell: (row: PIIField) => (
        <Code p="1" pointerEvents="none">
          {row.dataPath}
        </Code>
      ),
      id: "dataPath",
      grow: 2,
    },
    {
      name: "Date Identified",
      sortable: true,
      selector: (row: PIIField) => getDateTimeString(row.createdAt) || "",
      id: "dateIdentified",
      grow: 2,
    },
  ];
  return (
    <DataTable
      style={rowStyles}
      columns={columns}
      data={PIIFields}
      customStyles={getCustomStyles(colorMode.colorMode)}
    />
  );
});

export default PIIDataList;
