import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import ErrorPage from "next/error";
import { SideNavLinkDestination } from "../../components/Sidebar/NavLinkUtils";
import { SidebarLayoutShell } from "../../components/SidebarLayoutShell";
import EndpointPage from "../../components/Endpoint";
import { ApiEndpointDetailed } from "@common/types";
import { getEndpoint } from "../../api/endpoints";

const Endpoint = () => {
  const router = useRouter();
  const { endpointUUID } = router.query;
  const [fetching, setFetching] = useState<boolean>(true);
  const [endpoint, setEndpoint] = useState<ApiEndpointDetailed>();
  const [notFound, setNotFound] = useState<boolean>(false);
  useEffect(() => {
    const fetchEndpoint = async () => {
      const res = await getEndpoint(endpointUUID?.toString());
      if (!res) {
        setNotFound(true);
      }
      setEndpoint(res);
      setFetching(false);
    }
    if (endpointUUID) {
      fetchEndpoint();
    }
  }, [endpointUUID])
  if (notFound) {
    return <ErrorPage statusCode={404} />
  }
  return (
    <SidebarLayoutShell currentTab={SideNavLinkDestination.Endpoints}>
      <EndpointPage endpoint={endpoint} fetching={fetching} />
    </SidebarLayoutShell>
  );
};

/*export const getServerSideProps: GetServerSideProps = async (context) => {
  const endpoint = testEndpoints.find(
    (e) => e.uuid == context.query.endpointUUID
  );
  return { props: { endpoint: superjson.stringify(endpoint) } };
};*/

export default Endpoint;
