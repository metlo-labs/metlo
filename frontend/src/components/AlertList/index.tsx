import { Box, VStack } from "@chakra-ui/react";
import React from "react";
import { Alert, GetAlertParams } from "@common/types";
import List from "./List";
import AlertFilters from "./Filters";
import { ALERT_PAGE_LIMIT } from "~/constants";
import { AlertType, RiskScore } from "@common/enums";

interface AlertListProps {
  fetching: boolean;
  totalCount: number;
  alerts: Alert[];
  params: GetAlertParams;
  setParams: React.Dispatch<React.SetStateAction<GetAlertParams>>
}

const AlertList: React.FC<AlertListProps> = React.memo(
  ({ alerts, fetching, totalCount, params, setParams }) => {
    const setCurrentPage = (page: number) => {
      const offset = (page - 1) * ALERT_PAGE_LIMIT;
      setParams({...params, offset })
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
          <AlertFilters
            alertList={Object.values(AlertType)}
            riskList={Object.values(RiskScore)}
            params={params}
            setParams={setParams}
          />
        </Box>
        <Box w="full">
          <List
            alerts={alerts}
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

export default AlertList;
