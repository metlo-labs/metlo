import { Heading, VStack } from "@chakra-ui/react";
import { SideNavLinkDestination } from "../components/Sidebar/NavLinkUtils";
import { useEffect, useState } from "react";
import { Alert } from "@common/types";
import { testAlerts } from "testData";
import { SidebarLayoutShell } from "components/SidebarLayoutShell";
import { ContentContainer } from "components/utils/ContentContainer";
import AlertList from "components/AlertList";

const Alerts = () => {
  const [fetching, setFetching] = useState<boolean>(true);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  useEffect(() => {
    setAlerts(testAlerts);
    setFetching(false);
  }, []);
  return (
    <SidebarLayoutShell currentTab={SideNavLinkDestination.Alerts}>
      <ContentContainer>
        <VStack w="full" alignItems="flex-start">
          <Heading fontWeight="medium" size="xl" mb="8">
            Alerts
          </Heading>
          <AlertList alerts={alerts} fetching={fetching} />
        </VStack>
      </ContentContainer>
    </SidebarLayoutShell>
  );
};

export default Alerts;
