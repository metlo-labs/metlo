import React, { useEffect } from "react"
import { Heading, Spinner, Text, VStack } from "@chakra-ui/react"
import { getEndpointTracked } from "api/home"

export const ListenRequests: React.FC = React.memo(({}) => {
  useEffect(() => {
    const fetchHosts = async () => {
      try {
        const endpointTracked = await getEndpointTracked()
        if (endpointTracked.exists) {
          clearInterval(interval)
          window.location.href = "/"
        }
      } catch {}
    }
    fetchHosts()
    const interval = setInterval(() => fetchHosts(), 2000)
    return () => {
      clearInterval(interval)
    }
  }, [])

  return (
    <VStack h="200px" w="full" display="flex" alignItems="center">
      <Spinner
        thickness="4px"
        color="blue"
        size="lg"
        emptyColor="gray.200"
        speed="0.65s"
      />
      <Heading size="lg" fontWeight="medium">
        Listening for requests...
      </Heading>
      <Text>
        Once you have set up a connection, we will verify if a request was
        properly received and continue.
      </Text>
    </VStack>
  )
})
