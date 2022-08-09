import React, { useState } from "react";
import { Alert } from "@common/types";
import { useRouter } from "next/router";
import { Box, Badge, Grid, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay, GridItem, VStack, Text, Code, HStack, Textarea, ModalFooter, Button, useToast } from "@chakra-ui/react";
import { getDateTimeString } from "../../utils";
import { METHOD_TO_COLOR } from "../../constants"
import { RestMethod } from "@common/enums";
import { resolveAlert } from "api/alerts";

interface AlertDetailProps {
  alert: Alert;
  method: RestMethod;
  path: string;
  isOpen: boolean;
  onClose: () => void;
}

const AlertDetail: React.FC<AlertDetailProps> = React.memo(({ alert, isOpen, method, path, onClose }) => {
  const [resolutionMessage, setResolutionMessage] = useState<string>(alert?.resolutionMessage);
  const [resolving, setResolving] = useState<boolean>(false);
  const toast = useToast();
  const router = useRouter();
  const handleResolveClick = async () => {
    setResolving(true);
    const resp = await resolveAlert(alert.uuid, resolutionMessage);
    if (resp) {
      router.reload();
    } else {
      toast({
        title: "Resolving Alert Failed...",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      })
      setResolving(false);
    }
  }
  return (
    <Box>
      <Modal isOpen={isOpen} onClose={onClose} size="4xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader px="4" pt="4" pb="2">
            Alert
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody px="4" pt="2" pb="4">
            {alert ? (
              <Box>
                <Grid templateColumns="1fr 1fr" gap="4">
                  <GridItem>
                    <VStack alignItems="flex-start">
                      <Text fontWeight="semibold">Type</Text>
                      <Code p="1" rounded="md" fontSize="sm">
                        {alert.type}
                      </Code>
                    </VStack>
                  </GridItem>
                  <GridItem>
                    <VStack alignItems="flex-start">
                      <Text fontWeight="semibold">Time</Text>
                      <Code p="1" rounded="md" fontSize="sm">
                        {getDateTimeString(alert.createdAt)}
                      </Code>
                    </VStack>
                  </GridItem>
                  <GridItem>
                    <VStack alignItems="flex-start">
                      <Text fontWeight="semibold">Endpoint</Text>
                      <HStack>
                        <Badge
                          fontSize="sm"
                          px="2"
                          py="1"
                          colorScheme={METHOD_TO_COLOR[method] || "gray"}
                        >
                          {method.toUpperCase()}
                        </Badge>
                        <Code p="1" rounded="md" fontSize="sm">
                          {path}
                        </Code>
                      </HStack>
                    </VStack>
                  </GridItem>
                  <GridItem>
                    <VStack alignItems="flex-start">
                      <Text fontWeight="semibold">Description</Text>
                      <Code p="1" rounded="md" fontSize="sm">
                        {alert.description}
                      </Code>
                    </VStack>
                  </GridItem>
                </Grid>
                <VStack w="full" pt="4" spacing="4">
                  <VStack w="full" alignItems="flex-start">
                    <Text fontWeight="semibold">Resolution Reason</Text>
                    <Textarea
                      disabled={alert.resolved}
                      value={resolutionMessage}
                      placeholder="Provide reason for resolving..."
                      onChange={(e) => setResolutionMessage(e.target.value)}
                    />
                  </VStack>
                </VStack>
              </Box>
            ) : null}
          </ModalBody>
          <ModalFooter w="full">
            {alert?.resolved ?
              <Badge colorScheme="green" fontSize="lg">Resolved</Badge>
            : <Button disabled={resolving} colorScheme="blue" onClick={handleResolveClick}>Resolve</Button>
            }
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
});

export default AlertDetail;
