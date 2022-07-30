import { Box, VStack } from "@chakra-ui/react";
import React from "react";
import { Endpoint } from "../../types";
import EndpointFilters from "./Filters";
import List from "./List";

interface EndpointListProps {
  fetching: boolean;
  endpoints: Endpoint[];
}

const EndpointList: React.FC<EndpointListProps> = React.memo(
  ({ endpoints, fetching }) => {
    return (
      <VStack
        w="full"
        alignItems="flex-start"
        borderWidth="1px"
        rounded="md"
        spacing="0"
        overflow="hidden"
      >
        <Box p="4" borderBottom="1px" borderColor="inherit" w="full">
          <EndpointFilters
            environmentList={["production", "staging", "develpment"]}
            hostList={["AWS Gateway 1", "GCP Gateway Staging"]}
            riskList={["Low", "Medium", "High"]}
          />
        </Box>
        <Box w="full">
          <List
            endpoints={endpoints}
            totalCount={endpoints.length}
            currentPage={1}
            setCurrentPage={(e: number) => {}}
            fetching={fetching}
            setOrdering={(e: "ASC" | "DESC") => {}}
            setOrderBy={(e: string | undefined) => {}}
          />
        </Box>
      </VStack>
    );
  }
);

export default EndpointList;
