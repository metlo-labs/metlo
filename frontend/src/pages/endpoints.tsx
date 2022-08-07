import { Heading, VStack } from "@chakra-ui/react";
import { Endpoint, ApiEndpoint } from "@common/types";
import { useEffect, useState } from "react";
import EndpointList from "../components/EndpointList";
import { SideNavLinkDestination } from "../components/Sidebar/NavLinkUtils";
import { SidebarLayoutShell } from "../components/SidebarLayoutShell";
import { ContentContainer } from "../components/utils/ContentContainer";
import { testEndpoints } from "../testData";
import { getEndpoints } from "../api/endpoints";

const Endpoints = () => {
  const [fetching, setFetching] = useState<boolean>(true);
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  useEffect(() => {
    const fetchEndpoints = async () => {
      const res = await getEndpoints();
      setEndpoints(res);
      setFetching(false);
    }
    fetchEndpoints();
  }, []);
  return (
    <SidebarLayoutShell currentTab={SideNavLinkDestination.Endpoints}>
      <ContentContainer>
        <VStack w="full" alignItems="flex-start">
          <Heading fontWeight="medium" size="xl" mb="8">
            Endpoints
          </Heading>
          <EndpointList endpoints={endpoints} fetching={fetching} />
        </VStack>
      </ContentContainer>
    </SidebarLayoutShell>
  );
};

export default Endpoints;
