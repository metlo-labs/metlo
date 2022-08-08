import { Heading, VStack } from "@chakra-ui/react";
import { SideNavLinkDestination } from "../components/Sidebar/NavLinkUtils";
import { useEffect, useState } from "react";
import { Alert, GetAlertParams } from "@common/types";
import { testAlerts } from "testData";
import { SidebarLayoutShell } from "components/SidebarLayoutShell";
import { ContentContainer } from "components/utils/ContentContainer";
import AlertList from "components/AlertList";
import { ALERT_PAGE_LIMIT } from "../constants";
import { getAlerts } from "../api/alerts";

const Alerts = () => {
  const [fetching, setFetching] = useState<boolean>(true);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [totalCount, setTotalCount] = useState<number>();
  const [params, setParams] = useState<GetAlertParams>({
    riskScores: [],
    resolved: null,
    alertTypes: [],
    offset: 0,
    limit: ALERT_PAGE_LIMIT,
  });

  useEffect(() => {
    const fetchAlerts = async () => {
      const res = await getAlerts(params);
      setAlerts(res[0]);
      setTotalCount(res[1]);
      setFetching(false);
    }
    fetchAlerts();
  }, [params]);
  return (
    <SidebarLayoutShell currentTab={SideNavLinkDestination.Alerts}>
      <ContentContainer>
        <VStack w="full" alignItems="flex-start">
          <Heading fontWeight="medium" size="xl" mb="8">
            Alerts
          </Heading>
          <AlertList alerts={alerts} fetching={fetching} totalCount={totalCount} params={params} setParams={setParams} />
        </VStack>
      </ContentContainer>
    </SidebarLayoutShell>
  );
};

export default Alerts;
