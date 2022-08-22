import { Box, Flex, Heading, VStack } from "@chakra-ui/react";
import { GetServerSideProps } from "next";
import axios from "axios";
import { getAPIURL } from "~/constants";
import { ConnectionInfo } from "@common/types";
import { useEffect } from "react";
import { SideNavLinkDestination } from "components/Sidebar/NavLinkUtils";
import { SidebarLayoutShell } from "components/SidebarLayoutShell";
import { ContentContainer } from "components/utils/ContentContainer";
import { ConnectionType } from "@common/enums";
import AWS_INFO from "components/ConnectionInfo/aws";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const resp = await axios.get(
    `${getAPIURL()}/list_connections/${context.params.id}`
  );
  return { props: { connection: resp.data } };
};

function ConnectionForUUID({ connection }: { connection: ConnectionInfo }) {
  useEffect(() => {}, []);
  return (
    <Box>
      <SidebarLayoutShell
        title="Connections"
        currentTab={SideNavLinkDestination.Connections}
      >
        <ContentContainer>
          <VStack w="full" alignItems="flex-start">
            <Heading fontWeight="medium" size="xl" mb="8">
              Connections
            </Heading>
            {connection.connectionType === ConnectionType.AWS ? (
              <AWS_INFO connection={connection}></AWS_INFO>
            ) : (
              <></>
            )}
          </VStack>
        </ContentContainer>
      </SidebarLayoutShell>
    </Box>
  );
}

export default ConnectionForUUID;
