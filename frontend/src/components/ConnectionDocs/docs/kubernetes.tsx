import { Link, Box, Heading, VStack } from "@chakra-ui/react"

const KubernetesDocs = () => {
  return (
    <VStack spacing={6}>
      <Heading w={"full"} size={"sm"}>
        Daemonset
      </Heading>
      <Box w={"full"}>
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
      </Box>

      <Heading w={"full"} size={"sm"}>
        Sidecar
      </Heading>
      <VStack spacing={3} w={"full"}>
        <Box w={"full"}>
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

        <Box w={"full"}>
          Be sure to replace {"`<"}METLO_HOST_URL{">`"} and {"`<"}
          YOUR_METLO_API_KEY{">`"} in the templates.
        </Box>
      </VStack>
    </VStack>
  )
}
export default KubernetesDocs
