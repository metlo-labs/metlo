import React from "react"
import { useRouter } from "next/router"
import {
  Button,
  Divider,
  Heading,
  VStack,
  Image,
  Grid,
  GridItem,
  Text,
} from "@chakra-ui/react"
import { Logo } from "components/Logo"
import { DataHeading } from "components/utils/Card"
import { ConnectionType } from "@common/enums"

const CONNECTION_TYPE_TO_LABEL: { type: ConnectionType; label: string }[] = [
  {
    type: ConnectionType.PYTHON,
    label: "Python",
  },
  {
    type: ConnectionType.NODE,
    label: "Node",
  },
  {
    type: ConnectionType.JAVA,
    label: "Java",
  },
  {
    type: ConnectionType.GOLANG,
    label: "Go",
  },
  {
    type: ConnectionType.AWS,
    label: "AWS Traffic Mirroring",
  },
  {
    type: ConnectionType.GCP,
    label: "GCP Traffic Mirroring",
  },
  {
    type: ConnectionType.DOCKERCOMPOSE,
    label: "Docker Compose",
  },
  {
    type: ConnectionType.KUBERNETES,
    label: "Kubernetes",
  },
  {
    type: ConnectionType.BURPSUITE,
    label: "Burp Suite",
  },
]

export const GetStarted: React.FC = React.memo(({}) => {
  const router = useRouter()

  const handleButtonClick = (connectionType: ConnectionType) => {
    router.push({ pathname: "/", query: { step: "2", type: connectionType } })
  }
  return (
    <>
      <Logo imageHeight={72} imageWidth={254} />
      <Heading size="2xl" pt="4" fontWeight="semibold">
        Welcome to Metlo
      </Heading>
      <DataHeading fontSize="lg" pb="4">
        Add a connection to get started. You can always add more connections
        later from the Settings page.
      </DataHeading>
      <Divider />
      <VStack spacing={4} w="full">
        <Grid
          w="full"
          gridTemplateColumns="repeat(auto-fit, minmax(300px, 1fr))"
          gap="4"
        >
          {CONNECTION_TYPE_TO_LABEL.map(conn => (
            <GridItem
              as="button"
              onClick={() => handleButtonClick(conn.type)}
              key={conn.type}
              borderColor="#CBD5E0"
              borderRadius="10px"
              borderWidth="1px"
              borderStyle="solid"
              padding="20px"
              _hover={{ backgroundColor: "gray.50", borderColor: "primary" }}
            >
              <VStack>
                <Image
                  alt={`connection-${conn.type}`}
                  boxSize="50px"
                  src={`/static-images/connections/${conn.type}_light.svg`}
                />
                <Text>{conn.label}</Text>
              </VStack>
            </GridItem>
          ))}
        </Grid>
      </VStack>
    </>
  )
})
