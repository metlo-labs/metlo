import React from "react";
import { Text, Image, useColorMode } from "@chakra-ui/react";
import DataTable, { TableColumn } from "react-data-table-component";
import { getCustomStyles, rowStyles } from "../utils/TableUtils";
import { Connection, OpenApiSpec } from "@common/types";

interface SpecListProps {
  apiSpecs: OpenApiSpec[];
}

const SpecList: React.FC<SpecListProps> = React.memo(({ apiSpecs }) => {
  const colorMode = useColorMode();
  const columns: TableColumn<OpenApiSpec>[] = [
    {
      name: "Name",
      sortable: true,
      selector: (row: OpenApiSpec) => row.name || "",
      id: "name",
    },
  ];
  return (
    <DataTable
      style={rowStyles}
      columns={columns}
      data={apiSpecs}
      customStyles={getCustomStyles(colorMode.colorMode)}
    />
  );
});

export default SpecList;
