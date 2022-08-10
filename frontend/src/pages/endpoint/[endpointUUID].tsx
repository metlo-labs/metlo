import { GetServerSideProps } from "next";
import ErrorPage from "next/error";
import superjson from "superjson";
import { SideNavLinkDestination } from "components/Sidebar/NavLinkUtils";
import { SidebarLayoutShell } from "components/SidebarLayoutShell";
import EndpointPage from "components/Endpoint";
import { getEndpoint } from "api/endpoints";
import { ApiEndpointDetailed } from "@common/types";

const Endpoint = ({ endpoint }) => {
  const parsedEndpoint = superjson.parse(endpoint) as ApiEndpointDetailed | null;
  if (!parsedEndpoint) {
    return <ErrorPage statusCode={404} />;
  }
  return (
    <SidebarLayoutShell currentTab={SideNavLinkDestination.Endpoints}>
      <EndpointPage endpoint={parsedEndpoint} />
    </SidebarLayoutShell>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const endpoint = await getEndpoint(context.query.endpointUUID as string);
  return { props: { endpoint: superjson.stringify(endpoint) } };
};

export default Endpoint;
