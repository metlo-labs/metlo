import { Code, Heading, Box, Grid, VStack } from "@chakra-ui/react"
const GCPDocs = () => {
  return (
    <>
      <VStack>
        <Heading size={"md"}>Steps</Heading>
        <Heading size={"sm"}>Open Ports</Heading>
        <Box>
          <>
            Open Port 8081 on your Metlo instance so you can start collecting
            traffic data. It should be open to any machines you want to collect
            traffic from.
          </>
        </Box>
        <Heading size={"sm"}>Collect account information</Heading>
        <Box>
          <>
            This step is for collecting basic information regarding your GCP
            instance These parameters have to be populated : Name : Name for the
            particular connection. Network: GCP Network Name Project: GCP
            Project Name Zone: GCP Zone Name Key: GCP Service Account JSON Key
            Your key should look something like this :
          </>
          <>
            <Code>
              {"{"}
              "type": "service_account", "project_id": "...", "private_key_id":
              "...", "private_key": "...", "client_email":
              "abc@xyz.iam.gserviceaccount.com", "client_id":
              "1234567890123456789012", "auth_uri":
              "https://accounts.google.com/o/oauth2/auth", "token_uri":
              "https://oauth2.googleapis.com/token",
              "auth_provider_x509_cert_url":
              "https://www.googleapis.com/oauth2/v1/certs",
              "client_x509_cert_url": "..."
              {"}"}
            </Code>
          </>
          <>
            The Project, Zone, and Network need to match the details of the
            source which being monitored Currently, we require these permissions
            for the service account: Compute Admin Compute packet mirroring
            admin Compute packet mirroring user IAP-secured Tunnel User
          </>
        </Box>
        <Box>
          <>
            Collect mirror instance information This step is for selecting the
            EC2 instance that is to be mirrored. Theses parameters have to be
            populated: Source GCloud Compute Instance Name : The name of the
            compute engine to be mirrored. It should resemble.
          </>
          2470
        </Box>
        <Box>
          <Heading size={"sm"}>GCP Collector Instance Creation</Heading>
          This step creates a new compute engine instance for the Metlo
          collector. 2470
        </Box>
      </VStack>
    </>
  )
}

export default GCPDocs
