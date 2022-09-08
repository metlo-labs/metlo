import {
  Box,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  Spinner,
  Flex,
} from "@chakra-ui/react"
import { ConnectionType, AWS_STEPS } from "@common/enums"
import { useState } from "react"
import KeySetup from "./key_setup"
import { v4 as uuidv4 } from "uuid"
import SelectMirrorSourceAWS from "./select_source"
import { STEP_RESPONSE } from "@common/types"
import { AWS_STEP_TO_TITLE_MAP } from "@common/maps"
import axios, { AxiosResponse, AxiosError, AxiosRequestConfig } from "axios"
import OsSelection from "./os_selection"
import InstanceSelection from "./instance_selection"
import GenericStep from "../common/genericStep"
import SetupRulesFilter from "./mirrorFilters"
import { useToast } from "@chakra-ui/react"
import { api_call_retry } from "utils"
interface configureAWSParams {
  selected: AWS_STEPS
  updateSelected: (x: AWS_STEPS) => void
}

const incrementStep = (
  id: string,
  params: Record<string, any>,
  step: AWS_STEPS,
  onStepSuccess: (
    data: AxiosResponse<Omit<STEP_RESPONSE, "data">, any>,
  ) => void,
  onStepError: (data: AxiosResponse<Omit<STEP_RESPONSE, "data">, any>) => void,
  onError: (data: AxiosError) => void,
  setUpdating: (x: boolean) => void,
) => {
  axios
    .post<Omit<STEP_RESPONSE, "data">>(`/api/v1/setup_connection`, {
      id: id,
      params: params,
      type: ConnectionType.AWS,
      step: step,
    })
    .then(value => {
      if (value.data.success === "OK") {
        onStepSuccess(value)
      } else if (value.data.success === "FAIL") {
        onStepError(value)
      }
    })
    .catch((err: AxiosError) => {
      onError(err)
    })
    .finally(() => {
      setUpdating(false)
    })
  setUpdating(true)
}

const getRetryId = async (
  id: string,
  params: Record<string, any>,
  step: AWS_STEPS,
  onError: (err) => void,
) => {
  try {
    let resp = await axios.post<Omit<STEP_RESPONSE, "data">>(
      `/api/v1/setup_connection`,
      { id: id, params: params, type: ConnectionType.AWS, step: step },
    )
    return resp.data.retry_id
  } catch (err) {
    onError(err)
  }
}

const ConfigureAWS: React.FC<configureAWSParams> = ({
  selected,
  updateSelected,
}) => {
  const [isUpdating, setUpdating] = useState(false)
  const [id] = useState(uuidv4())
  const [name, setName] = useState(`Metlo-Connection-${id}`)
  const toast = useToast()
  const create_toast_with_message = (msg: string, step: AWS_STEPS) => {
    toast({
      title: `Encountered an error on step ${AWS_STEPS[step]}`,
      description: msg,
      status: "error",
      duration: 6000,
      isClosable: true,
    })
  }

  const step_increment_function = (
    params: Record<string, any>,
    step: AWS_STEPS,
  ) => {
    incrementStep(
      id,
      { ...params, name: name },
      step,
      () => {
        updateSelected(step + 1)
      },
      err => {
        create_toast_with_message(err.data.message, step)
        console.log(err.data.error)
      },
      error => {
        create_toast_with_message(error.message as string, step)
        console.log(error)
      },
      setUpdating,
    )
  }

  const retrier = async ({
    step,
    params,
    onComplete,
  }: {
    step: AWS_STEPS
    params: Record<string, any>
    onComplete?: () => void
  }) => {
    setUpdating(true)
    let _params = { ...params, name: name }
    let retry_id = await getRetryId(id, _params, step, () => {})

    api_call_retry({
      url: `/api/v1/long_running/${retry_id}`,
      requestParams: { params: { id, step, ..._params } } as AxiosRequestConfig,
      onAPIError: (err: AxiosError) => {
        create_toast_with_message(err.message, step)
        setUpdating(false)
      },
      onError: (err: Error) => {
        create_toast_with_message(err.message, step)
        setUpdating(false)
      },
      onSuccess: (resp: AxiosResponse<Omit<STEP_RESPONSE, "data">>) => {
        if (resp.data.success === "OK") {
          updateSelected(step + 1)
          if (resp.data.status === "COMPLETE") {
            onComplete()
          }
        } else {
          create_toast_with_message(resp.data.message, step)
          console.log(resp.data.error)
        }
        setUpdating(false)
      },
      onFinally: () => {},
      shouldRetry: (resp: AxiosResponse<Omit<STEP_RESPONSE, "data">>) => {
        return resp.data.success === "FETCHING"
      },
    })
  }

  let internals = (selectedIndex: AWS_STEPS): React.ReactElement => {
    switch (selectedIndex) {
      case AWS_STEPS.AWS_KEY_SETUP:
        return (
          <KeySetup
            complete={async params => {
              await step_increment_function(params, AWS_STEPS.AWS_KEY_SETUP)
            }}
            name={name}
            setName={setName}
          />
        )
      case AWS_STEPS.SOURCE_INSTANCE_ID:
        return (
          <SelectMirrorSourceAWS
            complete={async params => {
              await step_increment_function(
                params,
                AWS_STEPS.SOURCE_INSTANCE_ID,
              )
            }}
          />
        )
      case AWS_STEPS.SELECT_OS:
        return (
          <OsSelection
            isCurrent={selectedIndex === selected}
            complete={async params => {
              await step_increment_function(params, AWS_STEPS.SELECT_OS)
            }}
            id={id}
          />
        )
      case AWS_STEPS.SELECT_INSTANCE_TYPE:
        return (
          <InstanceSelection
            id={id}
            complete={async params => {
              await step_increment_function(
                params,
                AWS_STEPS.SELECT_INSTANCE_TYPE,
              )
            }}
            isCurrent={selectedIndex == selected}
            setLoadingState={setUpdating}
          />
        )
      case AWS_STEPS.CREATE_INSTANCE:
        return (
          <GenericStep
            id={id}
            complete={async params => {
              await step_increment_function(params, AWS_STEPS.CREATE_INSTANCE)
            }}
            isCurrent={selectedIndex == selected}
          />
        )
      case AWS_STEPS.INSTANCE_IP:
        return (
          <GenericStep
            id={id}
            complete={async params => {
              await step_increment_function(params, AWS_STEPS.INSTANCE_IP)
            }}
            isCurrent={selectedIndex == selected}
          />
        )
      case AWS_STEPS.CREATE_MIRROR_TARGET:
        return (
          <GenericStep
            id={id}
            complete={async params => {
              await step_increment_function(
                params,
                AWS_STEPS.CREATE_MIRROR_TARGET,
              )
            }}
            isCurrent={selectedIndex == selected}
          ></GenericStep>
        )
      case AWS_STEPS.CREATE_MIRROR_FILTER:
        return (
          <SetupRulesFilter
            id={id}
            complete={async params => {
              await step_increment_function(
                params,
                AWS_STEPS.CREATE_MIRROR_FILTER,
              )
            }}
            isCurrent={selectedIndex == selected}
          />
        )
      case AWS_STEPS.CREATE_MIRROR_SESSION:
        return (
          <GenericStep
            id={id}
            complete={async params => {
              await step_increment_function(
                params,
                AWS_STEPS.CREATE_MIRROR_SESSION,
              )
            }}
            isCurrent={selectedIndex == selected}
          ></GenericStep>
        )
      case AWS_STEPS.TEST_SSH:
        return (
          <GenericStep
            id={id}
            complete={async params => {
              await retrier({ step: AWS_STEPS.TEST_SSH, params })
            }}
            isCurrent={selectedIndex == selected}
          />
        )
      case AWS_STEPS.PUSH_FILES:
        return (
          <GenericStep
            id={id}
            complete={params => {
              retrier({ step: AWS_STEPS.PUSH_FILES, params })
            }}
            isCurrent={selectedIndex == selected}
          />
        )
      case AWS_STEPS.EXEC_COMMAND:
        return (
          <GenericStep
            id={id}
            complete={params => {
              retrier({
                step: AWS_STEPS.EXEC_COMMAND,
                params,
                onComplete: () => {
                  toast({
                    title: "Mirroring setup completed!",
                    status: "success",
                  })
                },
              })
            }}
            isCurrent={selectedIndex == selected}
          />
        )
    }
  }

  return (
    <>
      <Accordion
        w={"full"}
        index={selected - 1}
        allowToggle={true}
        allowMultiple={false}
      >
        {Array.from(Array(12)).map((_, i) => {
          return (
            <AccordionItem isDisabled={true} key={i}>
              <h2>
                <AccordionButton disabled>
                  <Box flex="1" textAlign="left">
                    Step {i + 1}: {AWS_STEP_TO_TITLE_MAP[i + 1]}
                  </Box>
                </AccordionButton>
              </h2>
              <AccordionPanel px={0} minH={"30vh"} pos={"relative"}>
                {isUpdating && (
                  <Flex
                    w={"full"}
                    h={"full"}
                    overflow={"hidden"}
                    pos={"absolute"}
                    bg={"blackAlpha.100"}
                    opacity={"50%"}
                    justify={"center"}
                    zIndex={10}
                  >
                    <Spinner size="xl" mt={8} />
                  </Flex>
                )}
                <Box zIndex={9} px={4}>
                  {internals(i + 1)}
                </Box>
              </AccordionPanel>
            </AccordionItem>
          )
        })}
      </Accordion>
    </>
  )
}

export default ConfigureAWS
