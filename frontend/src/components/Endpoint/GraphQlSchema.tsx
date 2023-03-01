import React, { useRef, useState } from "react"
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  HStack,
  InputGroup,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react"
import Editor from "@monaco-editor/react"
import { useRouter } from "next/router"
import { ApiEndpointDetailed } from "@common/types"
import { DataHeading } from "components/utils/Card"
import EmptyView from "components/utils/EmptyView"
import { makeToast } from "utils"
import { deleteGraphQlSchema, uploadGraphQlSchema } from "api/endpoints"

interface GraphQlSchemaComponentProps {
  endpoint: ApiEndpointDetailed
}

const GraphQlSchemaComponent: React.FC<GraphQlSchemaComponentProps> =
  React.memo(({ endpoint }) => {
    const inputRef = useRef<HTMLInputElement | null>(null)
    const router = useRouter()
    const toast = useToast()
    const [loading, setLoading] = useState<boolean>(false)
    const { isOpen, onOpen, onClose } = useDisclosure()
    const cancelRef = React.useRef()
    const handleClick = () => inputRef.current?.click()

    const handleSubmission = async (
      evt: React.ChangeEvent<HTMLInputElement>,
    ) => {
      setLoading(true)
      const file = evt.target.files[0]
      if (!file) {
        return
      }
      try {
        await uploadGraphQlSchema(endpoint.uuid, file)
        router.reload()
      } catch (err) {
        const errMessage = err.response.data?.message
        const title = errMessage
          ? `Upload Failed: ${errMessage}`
          : "Upload Failed..."
        const msgDetail = err.response.data?.error
        const description = msgDetail ?? err.response.data
        toast(
          makeToast({
            title,
            size: "xl",
            description,
            status: "error",
            duration: 25000,
          }),
        )
      } finally {
        evt.target.value = ""
        setLoading(false)
      }
    }

    const handleDelete = async () => {
      setLoading(true)
      try {
        await deleteGraphQlSchema(endpoint.uuid)
        router.reload()
      } catch (err) {
        toast(
          makeToast({
            title: "Deleting GraphQl Schema failed",
            size: "xl",
            status: "error",
          }),
        )
      } finally {
        setLoading(false)
      }
    }

    return (
      <VStack w={{ base: "full", lg: "50%" }} h="full">
        <HStack
          borderTopWidth={{ base: 1, lg: 0 }}
          borderLeftWidth={{ base: 1, lg: 0 }}
          borderRightWidth={{ base: 1, lg: 0 }}
          borderBottomWidth={1}
          px="4"
          py="1"
          w="full"
          justifyContent="space-between"
        >
          <DataHeading fontSize="lg">GraphQl Schema</DataHeading>
          <HStack>
            <InputGroup
              w="fit-content"
              size="md"
              onChange={handleSubmission}
              onClick={handleClick}
            >
              <input
                type="file"
                multiple={false}
                hidden
                ref={e => {
                  inputRef.current = e
                }}
              />
              <Button variant="create" isLoading={loading}>
                {endpoint.graphQlSchema ? "Update" : "Upload"}
              </Button>
            </InputGroup>
            {endpoint.graphQlSchema ? (
              <Button variant="delete" isLoading={loading} onClick={onOpen}>
                Delete
              </Button>
            ) : null}
          </HStack>
        </HStack>
        {endpoint.graphQlSchema ? (
          <Box
            mt="0 !important"
            overflow="hidden"
            borderWidth={{ base: 1, lg: 0 }}
            h={{
              base: "700px",
              lg: "full",
            }}
            w="full"
          >
            <Editor
              width="100%"
              defaultLanguage="graphql"
              value={endpoint.graphQlSchema || "No spec generated yet."}
              options={{
                minimap: {
                  enabled: false,
                },
                automaticLayout: true,
                readOnly: true,
                renderIndentGuides: false,
                scrollBeyondLastLine: false,
              }}
            />
          </Box>
        ) : (
          <EmptyView
            borderWidth={{ base: 1, lg: 0 }}
            rounded="none"
            mt="0 !important"
            h="full"
            text="No GraphQl Schema uploaded."
          />
        )}
        <AlertDialog
          isOpen={isOpen}
          leastDestructiveRef={cancelRef}
          onClose={onClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Delete GraphQl Schema
              </AlertDialogHeader>

              <AlertDialogBody>
                Are you sure you want to delete this GraphQl Schema?
              </AlertDialogBody>

              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  isLoading={loading}
                  variant="delete"
                  onClick={handleDelete}
                  ml={3}
                >
                  Delete
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </VStack>
    )
  })

export default GraphQlSchemaComponent
