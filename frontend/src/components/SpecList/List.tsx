import React from "react";
import yaml from "js-yaml";
import { useRouter } from "next/router";
import { useColorMode } from "@chakra-ui/react";
import DataTable, { TableColumn } from "react-data-table-component";
import { getCustomStyles, rowStyles } from "components/utils/TableUtils";
import { OpenApiSpec } from "@common/types";
import { SpecExtension } from "@common/enums";
import { getDateTimeString } from "utils";

interface SpecListProps {
  apiSpecs: OpenApiSpec[];
}

const getHostsFromSpec = (spec: OpenApiSpec): string[] => {
  let parsedSpec = null;
  if (spec.extension === SpecExtension.JSON) {
    parsedSpec = JSON.parse(spec.spec);
  } else if (spec.extension === SpecExtension.YAML) {
    parsedSpec = yaml.load(spec.spec);
  }
  if (parsedSpec) {
    return parsedSpec.servers.map((e: any) => e.url);
  }
};

const SpecList: React.FC<SpecListProps> = React.memo(({ apiSpecs }) => {
  const router = useRouter();
  const colorMode = useColorMode();
  const onRowClicked = (
    row: OpenApiSpec,
    e: React.MouseEvent<Element, MouseEvent>
  ) => {
    router.push(`/spec/${row.name}`);
  };
  const columns: TableColumn<OpenApiSpec>[] = [
    {
      name: "Name",
      sortable: true,
      selector: (row: OpenApiSpec) => row.name || "",
      id: "name",
    },
    {
      name: "Hosts",
      sortable: true,
      selector: (row: OpenApiSpec) => getHostsFromSpec(row)?.join(", ") || "",
      id: "hosts",
    },
    {
      name: "Last Updated",
      sortable: true,
      selector: (row: OpenApiSpec) => getDateTimeString(row.updatedAt) || "",
      id: "lastUpdated",
    },
  ];
  return (
    <DataTable
      style={rowStyles}
      columns={columns}
      data={apiSpecs}
      onRowClicked={onRowClicked}
      customStyles={getCustomStyles(colorMode.colorMode)}
    />
  );
});

export default SpecList;
