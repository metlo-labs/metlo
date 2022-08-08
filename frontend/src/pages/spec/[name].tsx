import { GetServerSideProps } from "next";
import ErrorPage from "next/error";
import { SideNavLinkDestination } from "../../components/Sidebar/NavLinkUtils";
import { SidebarLayoutShell } from "../../components/SidebarLayoutShell";
import { getSpec } from "../../api/apiSpecs";
import SpecPage from "../../components/Spec";
import superjson from "superjson";
import { OpenApiSpec } from "@common/types";

const Spec = ({ spec }) => {
  const parsedSpec = superjson.parse(spec) as OpenApiSpec | null;
  if (!parsedSpec) {
    return <ErrorPage statusCode={404} />;
  }
  return (
    <SidebarLayoutShell currentTab={SideNavLinkDestination.Specs}>
      <SpecPage spec={parsedSpec} />
    </SidebarLayoutShell>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const spec = await getSpec(context.query.name as string);
  return { props: { spec: superjson.stringify(spec) } };
};

export default Spec;
