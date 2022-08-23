import { DataSection, STEPS } from "./enums";

export const NEXT_STEP: Record<STEPS, STEPS | null> = {
  [STEPS.AWS_KEY_SETUP]: STEPS.SOURCE_INSTANCE_ID,
  [STEPS.SOURCE_INSTANCE_ID]: STEPS.SELECT_OS,
  [STEPS.SELECT_OS]: STEPS.SELECT_INSTANCE_TYPE,
  [STEPS.SELECT_INSTANCE_TYPE]: STEPS.CREATE_INSTANCE,
  [STEPS.CREATE_INSTANCE]: STEPS.INSTANCE_IP,
  [STEPS.INSTANCE_IP]: STEPS.CREATE_MIRROR_TARGET,
  [STEPS.CREATE_MIRROR_TARGET]: STEPS.CREATE_MIRROR_FILTER,
  [STEPS.CREATE_MIRROR_FILTER]: STEPS.CREATE_MIRROR_SESSION,
  [STEPS.CREATE_MIRROR_SESSION]: STEPS.TEST_SSH,
  [STEPS.TEST_SSH]: STEPS.PUSH_FILES,
  [STEPS.PUSH_FILES]: STEPS.EXEC_COMMAND,
  [STEPS.EXEC_COMMAND]: null,
};

export const STEP_TO_TITLE_MAP: Record<STEPS, string> = {
  [STEPS.AWS_KEY_SETUP]: "AWS Credentials Setup",
  [STEPS.SOURCE_INSTANCE_ID]: "EC2 Instance for mirroring source",
  [STEPS.SELECT_OS]: "OS Selection",
  [STEPS.SELECT_INSTANCE_TYPE]: "EC2 Instance type selection",
  [STEPS.CREATE_INSTANCE]: "EC2 Instance Instantiation",
  [STEPS.INSTANCE_IP]: "Obtain Mirror Instance IP",
  [STEPS.CREATE_MIRROR_TARGET]: "Traffic Mirror Target Creation",
  [STEPS.CREATE_MIRROR_FILTER]: "Traffic Mirror Filter Creation",
  [STEPS.CREATE_MIRROR_SESSION]: "Traffic Mirror Session Creation",
  [STEPS.TEST_SSH]: "SSH Connection Test",
  [STEPS.PUSH_FILES]: "Push installation files to remote instance",
  [STEPS.EXEC_COMMAND]: "Install metlo",
};

export const DATA_SECTION_TO_LABEL_MAP: Record<DataSection, string> = {
  [DataSection.REQUEST_PATH]: "Request Path Parameters",
  [DataSection.REQUEST_QUERY]: "Request Query Parameters",
  [DataSection.REQUEST_HEADER]: "Request Headers",
  [DataSection.REQUEST_BODY]: "Request Body",
  [DataSection.RESPONSE_HEADER]: "Response Headers",
  [DataSection.RESPONSE_BODY]: "Response Body",
}
