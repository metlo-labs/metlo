import React, { useCallback, useState } from "react"
import { ApiEndpointDetailed } from "@common/types"
import { TestTags } from "@common/enums"
import { Request, Test } from "@common/testing/types"
import {
  Button,
  Editable,
  EditableInput,
  EditablePreview,
  HStack,
  StackDivider,
  useToast,
  VStack,
} from "@chakra-ui/react"
import { HiPencil } from "@react-icons/all-files/hi/HiPencil"
import TestEditorHeader from "./header"
import RequestList from "./requestsList"
import RequestEditor from "./requestEditor"
import { makeNewEmptyRequest } from "./requestUtils"
import { runTest, saveTest } from "api/tests"
import { TagList } from "components/utils/TagList"
import { useRouter } from "next/router"

interface TestEditorProps {
  endpoint: ApiEndpointDetailed
  initTest: Test
  isNewTest: boolean
}

interface TestEditorState {
  test: Test
  selectedRequest: number
  modified: boolean
}

const TestEditor: React.FC<TestEditorProps> = React.memo(
  ({ endpoint, initTest, isNewTest }) => {
    const [state, setState] = useState<TestEditorState>({
      test: initTest,
      selectedRequest: 0,
      modified: false,
    })
    const [fetching, updateFetching] = useState<boolean>(false)
    const [saving, updateSaving] = useState<boolean>(false)
    const router = useRouter()
    const toast = useToast()

    const selectedRequest = state.selectedRequest
    const updateSelectedRequest = useCallback(
      (e: number) => {
        setState(state => {
          return {
            ...state,
            selectedRequest: e,
          }
        })
      },
      [setState],
    )

    const test = state.test
    const updateTest = useCallback(
      (t: (e: Test) => Test) => {
        setState(state => {
          return {
            ...state,
            test: t(state.test),
            modified: true,
          }
        })
      },
      [setState],
    )

    const updateRequest = useCallback(
      (t: (e: Request) => Request) =>
        updateTest(test => {
          let newRequests = [...test.requests]
          newRequests[selectedRequest] = t(newRequests[selectedRequest])
          return {
            ...test,
            requests: newRequests,
          }
        }),
      [updateTest, selectedRequest],
    )

    const addNewRequest = useCallback(
      () =>
        setState(state => {
          const test = state.test
          let newRequests = [...test.requests, makeNewEmptyRequest(endpoint)]
          return {
            selectedRequest: newRequests.length - 1,
            test: {
              ...test,
              requests: newRequests,
            },
            modified: true,
          }
        }),
      [setState, endpoint],
    )

    const deleteRequest = useCallback(
      (idx: number) =>
        setState(state => {
          const test = state.test
          if (test.requests.length == 1) {
            return state
          }
          const newRequests = test.requests.filter((_, i) => i != idx)
          const newSelectedRequest =
            idx <= state.selectedRequest
              ? Math.max(state.selectedRequest - 1, 0)
              : state.selectedRequest
          return {
            selectedRequest: newSelectedRequest,
            test: {
              ...test,
              requests: newRequests,
            },
            modified: true,
          }
        }),
      [setState],
    )

    const sendSelectedRequest = () => {
      updateFetching(true)
      runTest({
        ...test,
        requests: [test.requests[selectedRequest]],
      })
        .then(res => {
          updateTest(e => ({
            ...e,
            requests: e.requests.map((req, i) =>
              i == selectedRequest ? { ...req, result: res[0] } : req,
            ),
          }))
        })
        .catch(err => {
          toast({
            title: "Error Running Test",
            description: err.message,
            status: "error",
          })
        })
        .finally(() => updateFetching(false))
    }

    const onSaveRequest = async () => {
      updateSaving(true)
      saveTest(state.test, endpoint.uuid)
        .then(e => {
          toast({
            title: "Saved Request",
            status: "success",
          })
          if (isNewTest) {
            router.push(`/endpoint/${endpoint.uuid}/test/${e.uuid}`)
          }
        })
        .catch(err => {
          toast({
            title: "Error Saving",
            description: err.message,
            status: "error",
          })
        })
        .finally(() => {
          updateSaving(false)
          setState(e => ({ ...e, modified: false }))
        })
    }

    const onRunClick = () => {
      updateFetching(true)
      runTest(test)
        .then(res => {
          updateTest(e => ({
            ...e,
            requests: e.requests.map((req, i) => ({ ...req, result: res[i] })),
          }))
        })
        .catch(err => {
          toast({
            title: "Error Running Test",
            description: err.message,
            status: "error",
          })
        })
        .finally(() => updateFetching(false))
    }

    return (
      <VStack
        w="full"
        alignItems="flex-start"
        spacing="0"
        h="100vh"
        overflow="hidden"
        divider={<StackDivider />}
      >
        <VStack alignItems="flex-start" px="6" pt="4" w="full">
          <TestEditorHeader endpoint={endpoint} />
          <HStack justifyContent="space-between" w="full" pb="4">
            <VStack alignItems="flex-start" spacing="0">
              <HStack alignItems="center">
                <HiPencil size="22" />
                <Editable
                  value={test.name}
                  onChange={name => updateTest(e => ({ ...e, name }))}
                  fontSize="2xl"
                  fontWeight="semibold"
                >
                  <EditablePreview />
                  <EditableInput />
                </Editable>
              </HStack>
              <TagList
                allTags={Object.values(TestTags)}
                tags={test.tags}
                updateTags={tags => updateTest(e => ({ ...e, tags }))}
              />
            </VStack>
            <HStack>
              <Button
                colorScheme="blue"
                onClick={onRunClick}
                isLoading={fetching}
              >
                Run
              </Button>
              <Button onClick={onSaveRequest} isLoading={saving}>
                Save
              </Button>
            </HStack>
          </HStack>
        </VStack>
        <HStack
          flex="1"
          overflow="hidden"
          w="full"
          divider={<StackDivider />}
          spacing="0"
        >
          <RequestList
            requests={test.requests}
            selectedRequest={selectedRequest}
            updateSelectedRequest={updateSelectedRequest}
            addNewRequest={addNewRequest}
            deleteRequest={deleteRequest}
            h="full"
            w={{ base: "52", xl: "72" }}
          />
          <RequestEditor
            sendSelectedRequest={sendSelectedRequest}
            fetching={fetching}
            request={test.requests[selectedRequest]}
            updateRequest={updateRequest}
          />
        </HStack>
      </VStack>
    )
  },
)

export default TestEditor
