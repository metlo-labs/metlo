import { DownloadIcon } from "@chakra-ui/icons"
import {
  Box,
  Editable,
  EditableInput,
  EditablePreview,
  Flex,
  Grid,
  GridItem,
  IconButton,
  Link,
  Image,
  useColorMode,
  Button,
  useToast,
} from "@chakra-ui/react"
import { ConnectionType } from "@common/enums"
import { ConnectionInfo } from "@common/types"
import axios from "axios"
import { useState } from "react"
import { getAPIURL } from "~/constants"
import { EditableControls } from "../utils/EditableControls"

interface AWS_INFOInterface {
  connection: ConnectionInfo
  setConnection: (updatedConnection: ConnectionInfo) => void
}

const AWS_INFO: React.FC<AWS_INFOInterface> = ({
  connection,
  setConnection,
}) => {
  const [name, setName] = useState(connection.name)
  const colorMode = useColorMode()
  const toast = useToast()
  const onEditableChange = () => {
    if (
      JSON.stringify(connection) !=
      JSON.stringify({ ...connection, name: name })
    ) {
      axios
        .post(`${getAPIURL()}/update_connection`, {
          id: connection.uuid,
          name: name,
        })
        .then(v => {
          toast({ title: "Updated Name for Connection" })
          setConnection({ ...connection, name: name })
        })
        .catch(err => {
          toast({
            title: "Couldn't update name for connection",
            description: err,
          })
        })
    }
  }

  const onDownloadClick = (fileName, uuid) => {
    axios
      .get<{ sshkey: string }>(`${getAPIURL()}/list_connections/${uuid}/sshkey`)
      .then(v => {
        const element = document.createElement("a")
        const file = new Blob([v.data.sshkey], {
          type: "text/plain",
        })
        element.href = URL.createObjectURL(file)
        element.download = `${fileName}.pem`
        document.body.appendChild(element) // Required for this to work in FireFox
        element.click()
        document.body.removeChild(element)
      })
      .catch(err => {
        console.log(err)
        toast({ title: "Couldn't download ssh key file", description: err })
      })
  }
  return (
    <Grid w={"full"} gridTemplateColumns={"repeat(4,1fr)"} gap={6}>
      <GridItem colStart={1} alignSelf={"center"}>
        Name
      </GridItem>
      <GridItem colStart={2} colSpan={3} alignSelf={"center"} w={"full"}>
        <Editable
          value={name}
          onChange={v => setName(v)}
          onSubmit={onEditableChange}
        >
          <Flex gap={4}>
            <EditablePreview w={"full"} />
            <EditableInput w={"full"} />
            <EditableControls />
          </Flex>
        </Editable>
      </GridItem>
      <GridItem colStart={1} alignSelf={"center"}>
        Instance Type
      </GridItem>
      <GridItem colStart={2} colSpan={3} alignSelf={"center"}>
        <Flex alignSelf={"center"} gap={2} w={"full"}>
          <Box alignSelf={"center"} w={"full"} fontWeight="bold">
            {connection.aws.selected_instance_type}
          </Box>
          <Link
            href={`https://${connection.aws.region}.console.aws.amazon.com/ec2/v2/home?region=${connection.aws.region}#InstanceDetails:instanceId=${connection.aws.mirror_instance_id}`}
            target="_blank"
          >
            <Button aria-label="See on aws" bg={"transparent"} p={0}>
              <Image
                alt={`AWS-image`}
                src={`../connections/${ConnectionType.AWS}_${colorMode.colorMode}.svg`}
              />
            </Button>
          </Link>
        </Flex>
      </GridItem>
      <GridItem colStart={1} alignSelf={"center"}>
        Mirror Target
      </GridItem>
      <GridItem colStart={2} colSpan={3} alignSelf={"center"}>
        <Flex alignSelf={"center"} gap={2} w={"full"}>
          <Box alignSelf={"center"} w={"full"} fontWeight="bold">
            {connection.aws.mirror_target_id}
          </Box>
          <Link
            href={`https://${connection.aws.region}.console.aws.amazon.com/vpc/v2/home?region=${connection.aws.region}#TrafficMirrorTarget:trafficMirrorTargetId=${connection.aws.mirror_target_id}`}
            target="_blank"
          >
            <Button aria-label="See on aws" bg={"transparent"} p={0}>
              <Image
                alt={`AWS-image`}
                src={`../connections/${ConnectionType.AWS}_${colorMode.colorMode}.svg`}
              />
            </Button>
          </Link>
        </Flex>
      </GridItem>
      <GridItem colStart={1} alignSelf={"center"}>
        Mirror Filter
      </GridItem>
      <GridItem colStart={2} colSpan={3} alignSelf={"center"}>
        <Flex alignSelf={"center"} gap={2} w={"full"}>
          <Box alignSelf={"center"} w={"full"} fontWeight="bold">
            {connection.aws.mirror_filter_id}
          </Box>
          <Link
            href={`https://${connection.aws.region}.console.aws.amazon.com/vpc/v2/home?region=${connection.aws.region}#TrafficMirrorFilter:trafficMirrorFilterId=${connection.aws.mirror_filter_id}`}
            target="_blank"
          >
            <Button aria-label="See on aws" bg={"transparent"} p={0}>
              <Image
                alt={`AWS-image`}
                src={`../connections/${ConnectionType.AWS}_${colorMode.colorMode}.svg`}
              />
            </Button>
          </Link>
        </Flex>
      </GridItem>
      <GridItem colStart={1} alignSelf={"center"}>
        Mirror Session
      </GridItem>
      <GridItem colStart={2} colSpan={3} alignSelf={"center"}>
        <Flex alignSelf={"center"} gap={2} w={"full"}>
          <Box alignSelf={"center"} w={"full"} fontWeight="bold">
            {connection.aws.mirror_session_id}
          </Box>
          <Link
            href={`https://${connection.aws.region}.console.aws.amazon.com/vpc/v2/home?region=${connection.aws.region}#TrafficMirrorSession:trafficMirrorSessionId=${connection.aws.mirror_session_id}`}
            target="_blank"
          >
            <Button aria-label="See on aws" bg={"transparent"} p={0}>
              <Image
                alt={`AWS-image`}
                src={`../connections/${ConnectionType.AWS}_${colorMode.colorMode}.svg`}
              />
            </Button>
          </Link>
        </Flex>
      </GridItem>
      <GridItem colStart={1} alignSelf={"center"}>
        <Box>Download</Box>
      </GridItem>
      <GridItem colStart={2} alignSelf={"center"}>
        <Box>
          <Link
            onClick={() => onDownloadClick(connection.name, connection.uuid)}
            download
          >
            <IconButton
              aria-label="Download SSH key"
              icon={<DownloadIcon />}
            ></IconButton>
          </Link>
        </Box>
      </GridItem>
    </Grid>
  )
}

export default AWS_INFO
