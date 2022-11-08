import {
  Box,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  Spinner,
  Flex,
} from "@chakra-ui/react"
import { ConnectionType, GCP_STEPS } from "@common/enums"
import { useState } from "react"
import { v4 as uuidv4 } from "uuid"
import { STEP_RESPONSE } from "@common/types"
import { GCP_STEP_TO_TITLE_MAP } from "@common/maps"
import axios, { AxiosResponse, AxiosError, AxiosRequestConfig } from "axios"
import { useToast } from "@chakra-ui/react"
import { api_call_retry, makeToast } from "utils"
import GenericStep from "../common/genericStep"
import KeySetup from "./key_setup"
import SelectMirrorSourceGCP from "./select_source"
import SourceMigConfig from "./destination_instance_config"
interface configureAWSParams {
  selected: GCP_STEPS
  updateSelected: (x: GCP_STEPS) => void
}

type connData = Omit<STEP_RESPONSE<ConnectionType.GCP>, "data">

const incrementStep = (
  id: string,
  params: Record<string, any>,
  step: GCP_STEPS,
  onStepSuccess: (data: AxiosResponse<connData, any>) => void,
  onStepError: (data: AxiosResponse<connData, any>) => void,
  onError: (data: AxiosError) => void,
  setUpdating: (x: boolean) => void,
) => {
  axios
    .post<connData>(`/api/v1/setup_connection`, {
      id: id,
      params: params,
      type: ConnectionType.GCP,
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
  step: GCP_STEPS,
  onError: (err) => void,
) => {
  try {
    let resp = await axios.post<connData>(`/api/v1/setup_connection`, {
      id: id,
      params: params,
      type: ConnectionType.GCP,
      step: step,
    })
    return resp.data.retry_id
  } catch (err) {
    onError(err)
  }
}

const ConfigureGCP: React.FC<configureAWSParams> = ({
  selected,
  updateSelected,
}) => {
  const [isUpdating, setUpdating] = useState(false)
  const [id] = useState(uuidv4())
  const [name, setName] = useState(`Metlo-Connection-${id}`)
  const toast = useToast()
  const create_toast_with_message = (
    msg: string,
    step: GCP_STEPS,
    statusCode?: number,
  ) => {
    toast(
      makeToast(
        {
          title: `Encountered an error on step ${GCP_STEPS[step]}`,
          description: msg,
          status: "error",
          duration: 6000,
        },
        statusCode,
      ),
    )
  }

  const step_increment_function = (
    params: Record<string, any>,
    step: GCP_STEPS,
    onSuccess = () => {},
  ) => {
    let retries = 0
    incrementStep(
      id,
      { ...params, name: name },
      step,
      () => {
        updateSelected(step + 1)
        onSuccess()
      },
      err => {
        create_toast_with_message(err.data.message, step, err.status)
        console.log(err.data.error)
      },
      error => {
        create_toast_with_message(
          error.message as string,
          step,
          error.response?.status,
        )
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
    step: GCP_STEPS
    params: Record<string, any>
    onComplete?: () => void
  }) => {
    setUpdating(true)
    let _params = { ...params, name: name }
    let retry_id = await getRetryId(id, _params, step, () => {})

    if (retry_id) {
      api_call_retry({
        url: `/api/v1/long_running/${retry_id}`,
        requestParams: {
          params: { id, step, ..._params },
        } as AxiosRequestConfig,
        onAPIError: (err: AxiosError) => {
          create_toast_with_message(err.message, step, err.response?.status)
          setUpdating(false)
        },
        onError: (err: Error) => {
          create_toast_with_message(err.message, step)
          setUpdating(false)
        },
        onSuccess: (resp: AxiosResponse<connData>) => {
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
        shouldRetry: (resp: AxiosResponse<connData>) => {
          return resp.data.success === "FETCHING"
        },
      })
    } else {
      console.log("Couldn't attempt to fetch")
    }
  }

  let internals = (renderIndex: GCP_STEPS): React.ReactElement => {
    switch (renderIndex) {
      case GCP_STEPS.GCP_KEY_SETUP:
        return (
          <KeySetup
            complete={params => {
              step_increment_function(params, GCP_STEPS.GCP_KEY_SETUP)
            }}
            name={name}
            setName={setName}
          />
        )
      case GCP_STEPS.SOURCE_INSTANCE_ID:
        return (
          <SelectMirrorSourceGCP
            complete={params => {
              step_increment_function(params, GCP_STEPS.SOURCE_INSTANCE_ID)
            }}
          />
        )
      case GCP_STEPS.CREATE_DESTINATION_SUBNET:
        return (
          <GenericStep
            id={id}
            complete={async params => {
              await retrier({
                step: GCP_STEPS.CREATE_DESTINATION_SUBNET,
                params,
              })
            }}
            isCurrent={GCP_STEPS.CREATE_DESTINATION_SUBNET == selected}
          />
        )
      case GCP_STEPS.CREATE_FIREWALL:
        return (
          <GenericStep
            id={id}
            complete={async params => {
              await step_increment_function(params, GCP_STEPS.CREATE_FIREWALL)
            }}
            isCurrent={GCP_STEPS.CREATE_FIREWALL == selected}
          />
        )
      case GCP_STEPS.CREATE_CLOUD_ROUTER:
        return (
          <GenericStep
            id={id}
            complete={async params => {
              await step_increment_function(
                params,
                GCP_STEPS.CREATE_CLOUD_ROUTER,
              )
            }}
            isCurrent={GCP_STEPS.CREATE_CLOUD_ROUTER == selected}
          />
        )
      case GCP_STEPS.CREATE_MIG:
        return (
          <SourceMigConfig
            complete={async params => {
              await retrier({ step: GCP_STEPS.CREATE_MIG, params })
            }}
            isSelected={GCP_STEPS.CREATE_MIG === selected}
            id={id}
          />
        )
      case GCP_STEPS.CREATE_HEALTH_CHECK:
        return (
          <GenericStep
            id={id}
            complete={async params => {
              await retrier({ params, step: GCP_STEPS.CREATE_HEALTH_CHECK })
            }}
            isCurrent={GCP_STEPS.CREATE_HEALTH_CHECK == selected}
          />
        )
      case GCP_STEPS.CREATE_BACKEND_SERVICE:
        return (
          <GenericStep
            id={id}
            complete={async params => {
              await retrier({ params, step: GCP_STEPS.CREATE_BACKEND_SERVICE })
            }}
            isCurrent={GCP_STEPS.CREATE_BACKEND_SERVICE == selected}
          />
        )
      case GCP_STEPS.CREATE_ILB:
        return (
          <GenericStep
            id={id}
            complete={async params => {
              await retrier({ params, step: GCP_STEPS.CREATE_ILB })
            }}
            isCurrent={GCP_STEPS.CREATE_ILB == selected}
          />
        )
      case GCP_STEPS.START_PACKET_MIRRORING:
        return (
          <GenericStep
            id={id}
            complete={async params => {
              await retrier({ params, step: GCP_STEPS.START_PACKET_MIRRORING })
            }}
            isCurrent={GCP_STEPS.START_PACKET_MIRRORING == selected}
          />
        )
      case GCP_STEPS.TEST_SSH:
        return (
          <GenericStep
            id={id}
            complete={async params => {
              await retrier({ step: GCP_STEPS.TEST_SSH, params })
            }}
            isCurrent={GCP_STEPS.TEST_SSH == selected}
          />
        )
      case GCP_STEPS.PUSH_FILES:
        return (
          <GenericStep
            id={id}
            complete={params => {
              retrier({ step: GCP_STEPS.PUSH_FILES, params })
            }}
            isCurrent={GCP_STEPS.PUSH_FILES == selected}
          />
        )
      case GCP_STEPS.EXEC_COMMAND:
        return (
          <GenericStep
            id={id}
            complete={params => {
              retrier({
                step: GCP_STEPS.EXEC_COMMAND,
                params,
                onComplete: () =>
                  toast(
                    makeToast({
                      title: "Mirroring setup completed!",
                      status: "success",
                    }),
                  ),
              })
            }}
            isCurrent={GCP_STEPS.EXEC_COMMAND == selected}
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
        pb={4}
      >
        {Array.from(Array(Object.values(GCP_STEPS).length / 2)).map((_, i) => {
          return (
            <AccordionItem isDisabled={true} key={i}>
              <h2>
                <AccordionButton disabled>
                  <Box flex="1" textAlign="left">
                    Step {i + 1}: {GCP_STEP_TO_TITLE_MAP[i + 1]}
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

export default ConfigureGCP
