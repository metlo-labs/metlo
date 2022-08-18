import { Heading, VStack } from "@chakra-ui/react";
import { SideNavLinkDestination } from "components/Sidebar/NavLinkUtils";
import { GetServerSideProps } from "next";
import { listTests } from "~/api/tests";
import { SidebarLayoutShell } from "~/components/SidebarLayoutShell";
import ListTests from "~/components/TestList";
import { ContentContainer } from "~/components/utils/ContentContainer";
import superjson from "superjson";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const tests = await listTests();
  return {
    props: {
      tests: superjson.stringify(tests.data),
    },
  };
};

const Tests = ({ tests }) => (
  <SidebarLayoutShell title="Tests" currentTab={SideNavLinkDestination.Tests}>
    <ContentContainer>
      <VStack w="full" alignItems="flex-start">
        <Heading fontWeight="medium" size="xl" mb="8">
          Tests
        </Heading>
        <ListTests tests={superjson.parse(tests)} />
      </VStack>
    </ContentContainer>
  </SidebarLayoutShell>
);
export default Tests;
