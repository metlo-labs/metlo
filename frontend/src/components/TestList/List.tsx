import React from "react"
import { useRouter } from "next/router"
import { Badge, useColorMode, VStack } from "@chakra-ui/react"
import DataTable, { TableColumn } from "react-data-table-component"
import { getCustomStyles, rowStyles } from "components/utils/TableUtils"
import { TestDetailed } from "@common/testing/types"

interface TestListProps {
  tests: TestDetailed[]
}

const getTestStatus = (test: TestDetailed) => {
  if (!test.requests.every(e => e.result)) {
    return null
  }
  const success = test.requests.every(
    r =>
      r.result && !r.result.error && r.result.testResults.every(e => e.success),
  )
  if (success) {
    return <Badge colorScheme="green">Passing</Badge>
  }
  return <Badge colorScheme="red">Failing</Badge>
}

const TestList: React.FC<TestListProps> = React.memo(({ tests }) => {
  const router = useRouter()
  const colorMode = useColorMode()
  const onRowClicked = (
    row: TestDetailed,
    e: React.MouseEvent<Element, MouseEvent>,
  ) => {
    router.push(`/endpoint/${row.apiEndpoint.uuid}/test/${row.uuid}`)
  }
  const columns: TableColumn<TestDetailed>[] = [
    {
      name: "Name",
      sortable: true,
      selector: (row: TestDetailed) => row.name || "",
      id: "name",
      grow: 1
    },
    {
      name: "Status",
      sortable: true,
      selector: (row: TestDetailed) => row.name || "",
      cell: (row: TestDetailed) => getTestStatus(row),
      id: "status",
      grow: 1
    },
    {
      name: "Tags",
      sortable: true,
      selector: (row: TestDetailed) => row.tags?.join(", ") || "",
      cell: (row: TestDetailed) => (
        <VStack alignItems="flex-start" py="2">
          {row.tags?.map((tag, idx) => (
            <Badge key={idx}>{tag}</Badge>
          ))}
        </VStack>
      ),
      id: "hosts",
      grow: 2
    },
  ]
  return (
    <DataTable
      style={rowStyles}
      columns={columns}
      data={tests}
      onRowClicked={onRowClicked}
      customStyles={getCustomStyles(colorMode.colorMode)}
    />
  )
})

export default TestList
