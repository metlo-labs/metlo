import React from "react";
import { Box, VStack } from "@chakra-ui/react";
import { ApiEndpoint, GetEndpointParams } from "@common/types";
import EndpointFilters from "./Filters";
import List from "./List";
import { ENDPOINT_PAGE_LIMIT } from "../../constants";
import { RiskScore } from "@common/enums";

interface EndpointListProps {
  fetching: boolean;
  endpoints: ApiEndpoint[];
  totalCount: number;
  setParams: React.Dispatch<React.SetStateAction<GetEndpointParams>>;
  params: GetEndpointParams;
  hosts: string[];
}

const EndpointList: React.FC<EndpointListProps> = React.memo(
  ({ endpoints, fetching, totalCount, params, setParams, hosts }) => {
    const setCurrentPage = (page: number) => {
      const offset = (page - 1) * ENDPOINT_PAGE_LIMIT;
      setParams({...params, offset });
    }
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
            hostList={hosts}
            riskList={[RiskScore.NONE, RiskScore.LOW, RiskScore.MEDIUM, RiskScore.HIGH]}
            setParams={setParams}
            params={params}
          />
        </Box>
        <Box w="full">
          <List
            endpoints={endpoints}
            totalCount={totalCount}
            currentPage={1}
            setCurrentPage={setCurrentPage}
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
