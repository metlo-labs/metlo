import React from "react"
import {
  Badge,
  Box,
  Text,
  useColorMode,
  VStack,
  Tag,
  Tooltip,
  HStack,
  Wrap,
  WrapItem,
  Code,
} from "@chakra-ui/react"
import { useRouter } from "next/router"
import EmptyView from "components/utils/EmptyView"
import dynamic from "next/dynamic"
import { RISK_TO_COLOR } from "~/constants"
import { getCustomStyles, rowStyles } from "components/utils/TableUtils"
import { ApiEndpoint, DataClass, DataField } from "@common/types"
import {
  getDateTimeString,
  getMaxRiskScoreFromList,
  getRiskScores,
} from "utils"
import { NewDetectionType } from "@common/enums"
import { statusCodeToColor } from "components/utils/StatusCode"
import { DATA_SECTION_TO_LABEL_MAP } from "@common/maps"

const DataTable = dynamic(() => import("react-data-table-component"), {
  ssr: false,
})

interface NewDetectionTableProps {
  fetching: boolean
  newDetections: (ApiEndpoint | DataField)[]
  totalCount: number
  currentPage: number
  setCurrentPage: (e: number) => void
  dataClasses: DataClass[]
  detectionType: NewDetectionType
}

export const NewDetectionTable: React.FC<NewDetectionTableProps> = React.memo(
  ({
    fetching,
    newDetections,
    totalCount,
    currentPage,
    setCurrentPage,
    dataClasses,
    detectionType,
  }) => {
    const router = useRouter()
    const colorMode = useColorMode()

    const columns =
      detectionType === NewDetectionType.DATA_FIELD
        ? [
            {
              name: "Risk",
              sortable: false,
              selector: (row: DataField) => {
                return (
                  getMaxRiskScoreFromList(
                    getRiskScores(row.dataClasses ?? [], dataClasses),
                  ) || ""
                )
              },
              cell: (row: DataField) => (
                <Badge
                  p="1"
                  fontSize="sm"
                  fontWeight="medium"
                  colorScheme={
                    RISK_TO_COLOR[
                      getMaxRiskScoreFromList(
                        getRiskScores(row.dataClasses ?? [], dataClasses),
                      )
                    ]
                  }
                  pointerEvents="none"
                >
                  {getMaxRiskScoreFromList(
                    getRiskScores(row.dataClasses ?? [], dataClasses),
                  )}
                </Badge>
              ),
              id: "riskScore",
              grow: 0,
            },
            {
              name: "Status",
              selector: (row: DataField) => row.statusCode,
              cell: (row: DataField) => (
                <Box pointerEvents="none">
                  {row.statusCode && row.statusCode > 0 ? (
                    <Badge
                      fontSize="sm"
                      fontWeight="medium"
                      px="2"
                      py="1"
                      colorScheme={statusCodeToColor(row.statusCode) || "gray"}
                      data-tag="allowRowEvents"
                    >
                      {row.statusCode}
                    </Badge>
                  ) : null}
                </Box>
              ),
              grow: 0,
            },
            {
              name: "Content Type",
              selector: (row: DataField) => row.contentType,
              cell: (row: DataField) => (
                <Box pointerEvents="none" py={2}>
                  {row.contentType ? (
                    <Code p="1">{row.contentType}</Code>
                  ) : null}
                </Box>
              ),
              grow: 1,
            },
            {
              name: "Sensitive Data Classes",
              sortable: false,
              selector: (row: DataField) => row.dataClasses?.join(", ") || "",
              id: "dataClasses",
              grow: 2,
            },
            {
              name: "Endpoint",
              sortable: false,
              selector: (row: DataField) =>
                row.apiEndpoint?.method + row.apiEndpoint?.path,
              cell: (row: DataField) =>
                row.apiEndpoint ? (
                  <VStack
                    pointerEvents="none"
                    spacing={1}
                    alignItems="flex-start"
                  >
                    <Text
                      pointerEvents="none"
                      fontWeight="medium"
                      fontFamily="mono"
                      color="gray.900"
                    >
                      <HStack>
                        <strong>{row.apiEndpoint.method}</strong>
                        <Text>{row.apiEndpoint.path}</Text>
                      </HStack>
                    </Text>
                    <Text pointerEvents="none" fontWeight="normal">
                      {row.apiEndpoint.host}
                    </Text>
                  </VStack>
                ) : null,
              id: "endpoint",
              grow: 4,
            },
            {
              name: "Section",
              sortable: false,
              selector: (row: DataField) =>
                DATA_SECTION_TO_LABEL_MAP[row.dataSection],
              cell: (row: DataField) => (
                <Text data-tag="allowRowEvents">
                  {DATA_SECTION_TO_LABEL_MAP[row.dataSection]}
                </Text>
              ),
              id: "dataSection",
            },
            {
              name: "Field",
              sortable: false,
              selector: (row: DataField) => row.dataPath,
              cell: (row: DataField) => (
                <Box pointerEvents="none">
                  {row.dataPath ? (
                    <Code p="1" pointerEvents="none">
                      {row.dataPath}
                    </Code>
                  ) : (
                    <Text>None</Text>
                  )}
                </Box>
              ),
              id: "dataPath",
              grow: 2,
            },
            {
              name: "Date Identified",
              sortable: false,
              selector: (row: DataField) =>
                getDateTimeString(row.createdAt) || "",
              id: "dateIdentified",
              grow: 0,
              width: "200px",
            },
          ]
        : [
            {
              name: "Risk",
              sortable: false,
              selector: (row: ApiEndpoint) => row.riskScore || "",
              cell: (row: ApiEndpoint) => (
                <Badge
                  fontSize="sm"
                  fontWeight="medium"
                  colorScheme={RISK_TO_COLOR[row.riskScore]}
                  pointerEvents="none"
                  p={1}
                >
                  {row.riskScore}
                </Badge>
              ),
              id: "riskScore",
              grow: 0,
            },
            {
              name: "Endpoint",
              sortable: false,
              selector: (row: ApiEndpoint) => row.method + row.path,
              cell: (row: ApiEndpoint) => (
                <VStack
                  pointerEvents="none"
                  spacing={1}
                  alignItems="flex-start"
                >
                  <Text
                    pointerEvents="none"
                    fontWeight="medium"
                    fontFamily="mono"
                    color="gray.900"
                  >
                    <HStack>
                      <strong>{row.method}</strong>
                      <Text>{row.path}</Text>
                    </HStack>
                  </Text>
                  <Text pointerEvents="none" fontWeight="normal">
                    {row.host}
                  </Text>
                </VStack>
              ),
              id: "endpoint",
              grow: 4,
            },
            {
              name: "Visibility",
              sortable: false,
              selector: (row: ApiEndpoint) => row.host || "",
              cell: (row: ApiEndpoint) => (
                <VStack spacing={1} alignItems="flex-start">
                  <Badge>{row.isPublic ? "Public" : "Private"}</Badge>
                </VStack>
              ),
              id: "visibility",
              grow: 0,
            },
            {
              name: "Date Identified",
              sortable: false,
              selector: (row: ApiEndpoint) =>
                getDateTimeString(row.createdAt) || "N/A",
              id: "createdAt",
              right: true,
              grow: 0,
              width: "200px",
            },
          ]

    const onEndpointRowClicked = (
      row: ApiEndpoint,
      e: React.MouseEvent<Element, MouseEvent>,
    ) => {
      router.push(`/endpoint/${row.uuid}`)
    }

    const onDataFieldRowClicked = (
      row: DataField,
      e: React.MouseEvent<Element, MouseEvent>,
    ) => {
      router.push(`/endpoint/${row.apiEndpointUuid}?tab=fields`)
    }

    if (totalCount == 0 && !fetching) {
      return <EmptyView text="No results found." />
    }
    if (totalCount > 0) {
      return detectionType === NewDetectionType.DATA_FIELD ? (
        <DataTable
          style={rowStyles}
          paginationComponentOptions={{ noRowsPerPage: true }}
          paginationTotalRows={totalCount}
          paginationServer
          onChangePage={setCurrentPage}
          theme="solarized"
          columns={columns}
          data={newDetections}
          customStyles={getCustomStyles(colorMode.colorMode)}
          pagination
          onRowClicked={onDataFieldRowClicked}
          paginationDefaultPage={currentPage}
        />
      ) : (
        <DataTable
          style={rowStyles}
          paginationComponentOptions={{ noRowsPerPage: true }}
          paginationTotalRows={totalCount}
          paginationServer
          onChangePage={setCurrentPage}
          theme="solarized"
          columns={columns}
          data={newDetections}
          customStyles={getCustomStyles(colorMode.colorMode)}
          pagination
          onRowClicked={onEndpointRowClicked}
          paginationDefaultPage={currentPage}
        />
      )
    }
    return null
  },
)
