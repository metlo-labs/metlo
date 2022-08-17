import {
  Box,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  Text,
  Spinner,
  Button,
  Flex,
  Editable,
  EditableInput,
  EditablePreview,
  Input,
} from "@chakra-ui/react";
import { ConnectionType, STEPS } from "@common/enums";
import { useState } from "react";
import KeySetup from "./key_setup";
import { v4 as uuidv4 } from "uuid";
import SourceInstanceID from "./source_instance_id";
import { STEP_RESPONSE } from "@common/types";
import { STEP_TO_TITLE_MAP } from "@common/maps";
import axios, { AxiosResponse, AxiosError } from "axios";
import { id } from "date-fns/locale";
import { getAPIURL } from "~/constants";
import OsSelection from "./os_selection";
import InstanceSelection from "./instance_selection";
import GenericStepAWS from "./genericStepAws";
import SetupRulesFilter from "./mirrorFilters";
import { useToast } from "@chakra-ui/react";
import { EditableControls } from "~/components/utils/EditableControls";
interface configureAWSParams {
  selected: STEPS;
  updateSelected: (x: STEPS) => void;
}

const incrementStep = (
  id: string,
  params: Record<string, any>,
  step: STEPS,
  onStepSuccess: (
    data: AxiosResponse<Omit<STEP_RESPONSE, "data">, any>
  ) => void,
  onStepError: (data: AxiosResponse<Omit<STEP_RESPONSE, "data">, any>) => void,
  onError: (data: AxiosError) => void,
  setUpdating: (x: boolean) => void
) => {
  axios
    .post<Omit<STEP_RESPONSE, "data">>(`${getAPIURL()}/setup_connection`, {
      id: id,
      params: params,
      type: ConnectionType.AWS,
      step: step,
    })
    .then((value) => {
      if (value.data.success === "OK") {
        onStepSuccess(value);
      } else if (value.data.success === "FAIL") {
        onStepError(value);
      }
    })
    .catch((err: AxiosError) => {
      onError(err);
    })
    .finally(() => {
      setUpdating(false);
    });
  setUpdating(true);
};

const ConfigureAWS: React.FC<configureAWSParams> = ({
  selected,
  updateSelected,
}) => {
  const toast = useToast();

  const create_toast_with_message = (msg: string, step: STEPS) => {
    toast({
      title: `Encountered an error on step ${STEPS[step]}`,
      description: msg,
      status: "error",
      duration: 6000,
      isClosable: true,
    });
  };

  const [isUpdating, setUpdating] = useState(false);
  const id = uuidv4();
  const [name, setName] = useState(`Metlo-Connection-${id}`);

  const step_increment_function = (
    params: Record<string, any>,
    step: STEPS
  ) => {
    incrementStep(
      id,
      { ...params, name: name },
      step,
      () => updateSelected(step + 1),
      (err) => {
        create_toast_with_message(err.data.message, step);
        console.log(err.data.error);
      },
      () => {},
      setUpdating
    );
  };

  let internals = (selectedIndex: STEPS): React.ReactElement => {
    switch (selectedIndex) {
      case STEPS.AWS_KEY_SETUP:
        return (
          <KeySetup
            complete={(params) => {
              step_increment_function(params, STEPS.AWS_KEY_SETUP);
            }}
          />
        );
      case STEPS.SOURCE_INSTANCE_ID:
        return (
          <SourceInstanceID
            complete={(params) => {
              step_increment_function(params, STEPS.SOURCE_INSTANCE_ID);
            }}
          />
        );
      case STEPS.SELECT_OS:
        return (
          <OsSelection
            isCurrent={selectedIndex === selected}
            complete={(params) => {
              step_increment_function(params, STEPS.SELECT_OS);
            }}
            id={id}
          />
        );
      case STEPS.SELECT_INSTANCE_TYPE:
        return (
          <InstanceSelection
            id={id}
            complete={(params) => {
              step_increment_function(params, STEPS.SELECT_INSTANCE_TYPE);
            }}
            isCurrent={selectedIndex == selected}
          ></InstanceSelection>
        );
      case STEPS.CREATE_INSTANCE:
        return (
          <GenericStepAWS
            id={id}
            complete={(params) => {
              step_increment_function(params, STEPS.CREATE_INSTANCE);
            }}
            isCurrent={selectedIndex == selected}
          ></GenericStepAWS>
        );
      case STEPS.INSTANCE_IP:
        return (
          <GenericStepAWS
            id={id}
            complete={(params) => {
              step_increment_function(params, STEPS.INSTANCE_IP);
            }}
            isCurrent={selectedIndex == selected}
          ></GenericStepAWS>
        );
      case STEPS.CREATE_MIRROR_TARGET:
        return (
          <GenericStepAWS
            id={id}
            complete={(params) => {
              step_increment_function(params, STEPS.CREATE_MIRROR_TARGET);
            }}
            isCurrent={selectedIndex == selected}
          ></GenericStepAWS>
        );
      case STEPS.CREATE_MIRROR_FILTER:
        return (
          <SetupRulesFilter
            id={id}
            complete={(params) => {
              step_increment_function(params, STEPS.CREATE_MIRROR_FILTER);
            }}
            isCurrent={selectedIndex == selected}
          />
        );
      case STEPS.CREATE_MIRROR_SESSION:
        return (
          <GenericStepAWS
            id={id}
            complete={(params) => {
              step_increment_function(params, STEPS.CREATE_MIRROR_SESSION);
            }}
            isCurrent={selectedIndex == selected}
          ></GenericStepAWS>
        );
      case STEPS.TEST_SSH:
        return (
          <GenericStepAWS
            id={id}
            complete={(params) => {
              step_increment_function(params, STEPS.TEST_SSH);
            }}
            isCurrent={selectedIndex == selected}
          ></GenericStepAWS>
        );
      case STEPS.PUSH_FILES:
        return (
          <GenericStepAWS
            id={id}
            complete={(params) => {
              step_increment_function(params, STEPS.PUSH_FILES);
            }}
            isCurrent={selectedIndex == selected}
          ></GenericStepAWS>
        );
      case STEPS.EXEC_COMMAND:
        return (
          <GenericStepAWS
            id={id}
            complete={(params) => {
              step_increment_function(params, STEPS.EXEC_COMMAND);
            }}
            isCurrent={selectedIndex == selected}
          ></GenericStepAWS>
        );
    }
  };
  return (
    <>
      <Editable
        textAlign="center"
        value={name}
        fontSize="md"
        isPreviewFocusable={false}
        onChange={(v) => setName(v)}
      >
        <Flex>
          <EditablePreview />
          <Input as={EditableInput} />
          <EditableControls />
        </Flex>
      </Editable>
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
                    Step {i + 1}: {STEP_TO_TITLE_MAP[i + 1]}
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
          );
        })}
      </Accordion>
    </>
  );
};

export default ConfigureAWS;
