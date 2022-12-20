import React, { useRef, useState } from "react"
import {
  Box,
  VStack,
  HStack,
  Button,
  InputGroup,
  useToast,
} from "@chakra-ui/react"
import { saveAs } from "file-saver"
import { FiDownload } from "icons/fi/FiDownload"
import { OpenApiSpec } from "@common/types"
import List from "./List"
import { getSpecZip, uploadSpec } from "api/apiSpecs"
import { useRouter } from "next/router"
import { makeToast } from "utils"

interface APISpecListProps {
  apiSpecs: OpenApiSpec[]
}

const APISpecList: React.FC<APISpecListProps> = React.memo(({ apiSpecs }) => {
  const router = useRouter()
  const [fetching, setFetching] = useState<boolean>(false)
  const [downloading, setDownloading] = useState<boolean>(false)
  const toast = useToast()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const handleClick = () => inputRef.current?.click()
  const handleSubmission = async (evt: React.ChangeEvent<HTMLInputElement>) => {
    setFetching(true)
    const file = evt.target.files[0]
    if (!file) {
      return
    }
    try {
      await uploadSpec(file)
      router.reload()
    } catch (err) {
      const errMessage = err.response.data?.message
      const title = errMessage
        ? `Upload Failed: ${errMessage}`
        : "Upload Failed..."
      const errorMsg = err.response.data?.error
      const description = errorMsg ?? err.response.data
      toast(
        makeToast(
          {
            title,
            size: "xl",
            description,
            status: "error",
            duration: 1000000,
          },
          err.response?.status,
        ),
      )
    }
    setFetching(false)
  }

  const handleDownloadAll = async () => {
    setDownloading(true)
    try {
      const resp = await getSpecZip()
      const buff = Buffer.from(resp, "hex")
      const blob = new Blob([buff], { type: "application/zip" })
      saveAs(blob, "openapi_specs.zip")
    } catch (err) {
      toast(
        makeToast({
          title: "Failed to download zip",
          status: "error",
          description: err.response?.data,
        }),
      )
    }
    setDownloading(false)
  }

  return (
    <VStack
      w="full"
      alignItems="flex-start"
      borderWidth="1px"
      rounded="md"
      spacing="0"
      overflow="hidden"
    >
      <Box p="4" borderBottom="1px" borderColor="inherit" w="full">
        <HStack w="full">
          <Box marginLeft="auto">
            <InputGroup onChange={handleSubmission} onClick={handleClick}>
              <input
                type="file"
                multiple={false}
                hidden
                ref={e => {
                  inputRef.current = e
                }}
              />
              <Button colorScheme="blue" isLoading={fetching}>
                Upload New Spec
              </Button>
            </InputGroup>
          </Box>
          <Button
            leftIcon={<FiDownload />}
            isLoading={downloading}
            onClick={handleDownloadAll}
          >
            Download All
          </Button>
        </HStack>
      </Box>
      <Box w="full">
        <List apiSpecs={apiSpecs} />
      </Box>
    </VStack>
  )
})

export default APISpecList
