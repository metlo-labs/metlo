import { PageWrapper } from "components/PageWrapper"
import { ContentContainer } from "components/utils/ContentContainer"
import { Flex, Heading, VStack } from "@chakra-ui/react"
import { useState } from "react"
import ConfigureGCP from "components/ConnectionConfiguration/GCP/configureGcp"

const Connections = ({}) => {
  const [selectedIndex, updateIndex] = useState(1)
  return (
    <PageWrapper>
      <ContentContainer height="full">
        <VStack w="full" alignItems="flex-start" h={"full"}>
          <Heading fontWeight="medium" size="xl" mb="8">
            Configure Metlo connection for GCP
          </Heading>
          <Flex w={"full"} h={"full"} direction="column">
            <ConfigureGCP
              selected={selectedIndex}
              updateSelected={updateIndex}
            />
          </Flex>
        </VStack>
      </ContentContainer>
    </PageWrapper>
  )
}

export default Connections
