import React from "react"
import Pagination from "@atlaskit/pagination"
import { useBreakpointValue } from "@chakra-ui/react"

interface PaginateProps {
  tableSize: number
  currentPage: number
  setCurrentPage: (e: number) => void
  pageSize: number
}

type GenericPaginationType = React.SyntheticEvent<Element, Event> & {
  page: number
}

const START_PAGE = 1

export const PaginationComponent: React.FC<PaginateProps> = ({
  tableSize,
  pageSize,
  currentPage,
  setCurrentPage,
}) => {
  const currentSize = tableSize
  const maxVariant = useBreakpointValue({ base: 4, md: 7, xl: 10 })

  return (
    <Pagination
      selectedIndex={currentPage - 1}
      pages={Array.from(Array(Math.ceil(currentSize / pageSize)).keys()).map(
        v => v + 1,
      )}
      max={maxVariant}
      style={{
        display: "flex",
        justifyContent: "center",
        gap: "10px",
        flexWrap: "wrap",
      }}
      onChange={(e, page) => setCurrentPage(page)}
    />
  )
}
