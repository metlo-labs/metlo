import { GetServerSideProps } from "next";
import ErrorPage from "next/error";
import superjson from "superjson";
import { SideNavLinkDestination } from "components/Sidebar/NavLinkUtils";
import { SidebarLayoutShell } from "components/SidebarLayoutShell";
import EndpointPage from "components/Endpoint";
import { getEndpoint, getUsage } from "api/endpoints";
import { ApiEndpointDetailed, Usage } from "@common/types";

const Endpoint = ({ endpoint, usage }) => {
  const parsedEndpoint = superjson.parse(
    endpoint
  ) as ApiEndpointDetailed | null;
  const parsedUsage = superjson.parse(usage) as Usage[] | [];
  if (!parsedEndpoint) {
    return <ErrorPage statusCode={404} />;
  }
  return (
    <SidebarLayoutShell currentTab={SideNavLinkDestination.Endpoints}>
      <EndpointPage endpoint={parsedEndpoint} usage={parsedUsage} />
    </SidebarLayoutShell>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const endpointPromise = getEndpoint(context.query.endpointUUID as string);
  const usagePromise = getUsage(context.query.endpointUUID as string);
  const promises = [endpointPromise, usagePromise];
  let [endpoint, usage] = await Promise.all(promises);
  return {
    props: {
      endpoint: superjson.stringify(endpoint),
      usage: superjson.stringify(usage),
    },
  };
};

export default Endpoint;
