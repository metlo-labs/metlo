import { Heading, VStack } from "@chakra-ui/react";
import { Endpoint, ApiEndpoint, GetEndpointParams } from "@common/types";
import { useEffect, useState } from "react";
import EndpointList from "../components/EndpointList";
import { SideNavLinkDestination } from "../components/Sidebar/NavLinkUtils";
import { SidebarLayoutShell } from "../components/SidebarLayoutShell";
import { ContentContainer } from "../components/utils/ContentContainer";
import { testEndpoints } from "../testData";
import { getEndpoints } from "../api/endpoints";
import { ENDPOINT_PAGE_LIMIT } from "../constants";

const Endpoints = () => {
  const [fetching, setFetching] = useState<boolean>(true);
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [totalCount, setTotalCount] = useState<number>();
  const [params, setParams] = useState<GetEndpointParams>({
    host: null,
    riskScore: null,
    offset: 0,
    limit: ENDPOINT_PAGE_LIMIT,
  });
  useEffect(() => {
    const fetchEndpoints = async () => {
      const res = await getEndpoints(params);
      setEndpoints(res[0]);
      setTotalCount(res[1]);
      setFetching(false);
    }
    fetchEndpoints();
  }, [params]);
  return (
    <SidebarLayoutShell currentTab={SideNavLinkDestination.Endpoints}>
      <ContentContainer>
        <VStack w="full" alignItems="flex-start">
          <Heading fontWeight="medium" size="xl" mb="8">
            Endpoints
          </Heading>
          <EndpointList endpoints={endpoints} fetching={fetching} params={params} totalCount={totalCount} setParams={setParams} />
        </VStack>
      </ContentContainer>
    </SidebarLayoutShell>
  );
};

export default Endpoints;
