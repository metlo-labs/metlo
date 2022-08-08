import { Heading, VStack } from "@chakra-ui/react";
import { getSummary } from "api/home";
import { GetServerSideProps } from "next";
import { SummaryResponse } from "@common/types";
import { testAlerts } from "testData";
import superjson from "superjson";
import HomePage from "../components/Home";
import { SideNavLinkDestination } from "../components/Sidebar/NavLinkUtils";
import { SidebarLayoutShell } from "../components/SidebarLayoutShell";
import { ContentContainer } from "../components/utils/ContentContainer";

const Index = ({ summary }) => {
  const parsedSummary = superjson.parse<SummaryResponse>(summary);
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
            alerts={testAlerts}
          />
        </VStack>
      </ContentContainer>
    </SidebarLayoutShell>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const summary = await getSummary();
  return { props: { summary: superjson.stringify(summary) } };
};

export default Index;
