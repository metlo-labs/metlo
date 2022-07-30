import { GetServerSideProps } from "next";
import { SideNavLinkDestination } from "../../components/Sidebar/NavLinkUtils";
import { SidebarLayoutShell } from "../../components/SidebarLayoutShell";
import { ContentContainer } from "../../components/utils/ContentContainer";
import { testEndpoints } from "../../testData";
import EndpointPage from "../../components/Endpoint";

const Endpoint = ({ endpoint }) => {
  return (
    <SidebarLayoutShell currentTab={SideNavLinkDestination.Endpoints}>
      <ContentContainer>
        <EndpointPage endpoint={endpoint} />
      </ContentContainer>
    </SidebarLayoutShell>
  );
};

// This gets called on every request
export const getServerSideProps: GetServerSideProps = async (context) => {
  const endpoint = testEndpoints.find(
    (e) => e.uuid == context.query.endpointUUID
  );
  return { props: { endpoint } };
};

export default Endpoint;
