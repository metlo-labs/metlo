import { PageWrapper } from "components/PageWrapper"
import { ContentContainer } from "components/utils/ContentContainer"
import { Flex, Heading, VStack } from "@chakra-ui/react"
import { useState } from "react"
import dynamic from "next/dynamic"
const ConfigureAWS = dynamic(
  () => import("components/ConnectionConfiguration/AWS/configureAws"),
  { ssr: false },
)

const Connections = ({}) => {
  const [selectedIndex, updateIndex] = useState(1)
  return (
    <PageWrapper>
      <ContentContainer height="full">
        <VStack w="full" alignItems="flex-start" h={"full"}>
          <Heading fontWeight="medium" size="xl" mb="8">
            Configure Metlo connection for AWS
          </Heading>
          <Flex w={"full"} h={"full"} direction="column">
            <ConfigureAWS
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
