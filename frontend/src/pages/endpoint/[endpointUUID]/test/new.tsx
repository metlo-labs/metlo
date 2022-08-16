import { GetServerSideProps } from "next";
import ErrorPage from "next/error";
import superjson from "superjson";
import { SideNavLinkDestination } from "components/Sidebar/NavLinkUtils";
import { SidebarLayoutShell } from "components/SidebarLayoutShell";
import { getEndpoint } from "api/endpoints";
import { ApiEndpointDetailed } from "@common/types";

const NewTest = ({ endpoint }) => {
  const parsedEndpoint = superjson.parse(
    endpoint
  ) as ApiEndpointDetailed | null;
  if (!parsedEndpoint) {
    return <ErrorPage statusCode={404} />;
  }
  return (
    <SidebarLayoutShell
      title="New Test"
      currentTab={SideNavLinkDestination.Endpoints}
    ></SidebarLayoutShell>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const endpoint = await getEndpoint(context.query.endpointUUID as string);
  return {
    props: {
      endpoint: superjson.stringify(endpoint),
    },
  };
};

export default NewTest;
