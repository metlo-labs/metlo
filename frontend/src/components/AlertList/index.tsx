import { Box, VStack } from "@chakra-ui/react";
import React from "react";
import { Alert } from "@common/types";
import List from "./List";
import AlertFilters from "./Filters";

interface AlertListProps {
  fetching: boolean;
  alerts: Alert[];
}

const AlertList: React.FC<AlertListProps> = React.memo(
  ({ alerts, fetching }) => {
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
          <AlertFilters
            hostList={["AWS Gateway 1", "GCP Gateway Staging"]}
            riskList={["Low", "Medium", "High"]}
          />
        </Box>
        <Box w="full">
          <List
            alerts={alerts}
            totalCount={alerts.length}
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

export default AlertList;
