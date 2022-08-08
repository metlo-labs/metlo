import { Heading, VStack } from "@chakra-ui/react";
import { getSummary, getTopAlerts } from "api/home";
import { GetServerSideProps } from "next";
import { SummaryResponse, Alert } from "@common/types";
import superjson from "superjson";
import HomePage from "../components/Home";
import { SideNavLinkDestination } from "../components/Sidebar/NavLinkUtils";
import { SidebarLayoutShell } from "../components/SidebarLayoutShell";
import { ContentContainer } from "../components/utils/ContentContainer";

const Index = ({ summary, topAlerts }) => {
  const parsedSummary = superjson.parse<SummaryResponse>(summary);
  const parsedTopAlerts = superjson.parse<Alert[]>(topAlerts);
  return (
    <SidebarLayoutShell currentTab={SideNavLinkDestination.Home}>
      <ContentContainer>
        <VStack w="full" alignItems="flex-start">
          <Heading fontWeight="medium" size="xl" mb="8">
            Home
          </Heading>
          <HomePage
            numHighRiskAlerts={parsedSummary.highRiskAlerts}
            numAlerts={parsedSummary.newAlerts}
            numEndpoints={parsedSummary.endpointsTracked}
            numPIIDataDetected={parsedSummary.piiDataFields}
            alerts={parsedTopAlerts}
          />
        </VStack>
      </ContentContainer>
    </SidebarLayoutShell>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const summary = await getSummary();
  const topAlerts = await getTopAlerts();
  return { props: { summary: superjson.stringify(summary), topAlerts: superjson.stringify(topAlerts) } };
};

export default Index;
