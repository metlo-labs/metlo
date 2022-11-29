import { Code, Link, Box, Heading, Text, VStack } from "@chakra-ui/react"
import { ListNumber } from "components/utils/ListNumber"

const KubernetesDocs = () => {
  return (
    <VStack spacing={6}>
      <ListNumber num={1} title="Install">
        <VStack w="full" spacing="4">
          <Text w="full">
            You can setup Meto in Kubernetes with either a Daemonset or Sidecar.
          </Text>
          <VStack spacing="1" w="full">
            <Heading w="full" size={"sm"}>
              Daemonset
            </Heading>
            <Box w="full">
              <Text>
                Here is an example
                <Link
                  href={
                    "https://github.com/metlo-labs/metlo/blob/develop/ingestors/kubernetes/metlo-daemonset.yaml"
                  }
                  color={"blue"}
                >
                  &nbsp;metlo-daemonset.yaml&nbsp;
                </Link>
                file that contains just the daemonset for deploying metlo.
              </Text>
            </Box>
          </VStack>
          <VStack spacing="1" w="full">
            <Heading w="full" size={"sm"}>
              Sidecar
            </Heading>
            <Box w="full">
              <Link
                href={
                  "https://github.com/metlo-labs/metlo/blob/develop/ingestors/kubernetes/metlo-sidecar.yaml"
                }
                color={"blue"}
              >
                metlo-sidecar.yaml&nbsp;
              </Link>
              contains an example for how to setup Metlo as a sidecar container.
            </Box>
            <Box w="full">
              Be sure to replace <Code>{"<METLO_HOST_URL>"}</Code> and{" "}
              <Code>{"<YOUR_METLO_API_KEY>"}</Code> in the templates.
            </Box>
          </VStack>
        </VStack>
      </ListNumber>
    </VStack>
  )
}
export default KubernetesDocs
