import { Code, Heading, Box, Grid, VStack } from "@chakra-ui/react"
const GCPDocs = () => {
  return (
    <>
      <VStack w={"full"}>
        <Box w={"full"}>
          <Heading w={"full"} size={"md"}>
            Steps
          </Heading>
          <Heading w={"full"} size={"sm"} paddingBlock={2}>
            1. Open Ports
          </Heading>
        </Box>
        <Box w={"full"}>
          <>
            Open Port 8081 on your Metlo instance so you can start collecting
            traffic data. It should be open to any machines you want to collect
            traffic from.
          </>
        </Box>
        <Heading w={"full"} size={"sm"} paddingBlock={2}>
          2. Collect account information
        </Heading>
        <VStack w={"full"}>
          <Box w={"full"}>
            This step is for collecting basic information regarding your GCP
            instance
          </Box>
          <Box w={"full"}>
            <VStack w={"full"}>
              <Box w={"full"}>These parameters have to be populated:</Box>
              <Box w={"full"}>
                &nbsp;-&nbsp;Name : Name for the particular connection.
              </Box>
              <Box w={"full"}>&nbsp;-&nbsp;Network: GCP Network Name</Box>
              <Box w={"full"}>&nbsp;-&nbsp;Project: GCP Project Name</Box>
              <Box w={"full"}>&nbsp;-&nbsp;Zone: GCP Zone Name</Box>
              <Box w={"full"}>&nbsp;-&nbsp;Zone: GCP Zone</Box>
              <Box w={"full"}>
                &nbsp;-&nbsp;Key: GCP Service Account JSON Key{" "}
              </Box>
            </VStack>
          </Box>
          <Box w={"full"}>Your key should look something like this :</Box>
          <Code w={"full"} p={2}>
            <VStack>
              <Box w={"full"}>{"{"}</Box>
              <Box w={"full"}>
                &nbsp;&nbsp;&nbsp;&nbsp;&quot;type&quot;:
                &quot;service_account&quot;,
              </Box>
              <Box w={"full"}>
                &nbsp;&nbsp;&nbsp;&nbsp;&quot;project_id&quot;: &quot;...&quot;,
              </Box>
              <Box w={"full"}>
                &nbsp;&nbsp;&nbsp;&nbsp;&quot;private_key_id&quot;:
                &quot;...&quot;,
              </Box>
              <Box w={"full"}>
                &nbsp;&nbsp;&nbsp;&nbsp;&quot;private_key&quot;:
                &quot;...&quot;,
              </Box>
              <Box w={"full"}>
                &nbsp;&nbsp;&nbsp;&nbsp;&quot;client_email&quot;:
                &quot;abc@xyz.iam.gserviceaccount.com&quot;,
              </Box>
              <Box w={"full"}>
                &nbsp;&nbsp;&nbsp;&nbsp;&quot;client_id&quot;:&quot;1234567890123456789012&quot;,
              </Box>
              <Box w={"full"}>
                &nbsp;&nbsp;&nbsp;&nbsp;&quot;auth_uri&quot;:
                &quot;https://accounts.google.com/o/oauth2/auth&quot;,
              </Box>
              <Box w={"full"}>
                &nbsp;&nbsp;&nbsp;&nbsp;&quot;token_uri&quot;:
                &quot;https://oauth2.googleapis.com/token&quot;,
              </Box>
              <Box w={"full"}>
                &nbsp;&nbsp;&nbsp;&nbsp;&quot;auth_provider_x509_cert_url&quot;:
                &quot;https://www.googleapis.com/oauth2/v1/certs&quot;,
              </Box>
              <Box w={"full"}>
                &nbsp;&nbsp;&nbsp;&nbsp;&quot;client_x509_cert_url&quot;:
                &quot;...&quot;
              </Box>
              <Box w={"full"}>{"}"}</Box>
            </VStack>
          </Code>
          <VStack w={"full"}>
            <Box w={"full"}>
              The Project, Zone, and Network need to match the details of the
              source which being monitored.
            </Box>
            <Box w={"full"}>
              <VStack w={"full"}>
                <Box w={"full"}>
                  Currently, we require these permissions for the service
                  account:
                </Box>
                <Box w={"full"}>&nbsp;-&nbsp;Compute Admin</Box>
                <Box w={"full"}>
                  &nbsp;-&nbsp;Compute packet mirroring admin
                </Box>
                <Box w={"full"}>&nbsp;-&nbsp;Compute packet mirroring user</Box>
                <Box w={"full"}>&nbsp;-&nbsp;IAP-secured Tunnel User</Box>
              </VStack>
            </Box>
          </VStack>
        </VStack>
        <Box w={"full"}>
          <Heading size={"sm"} paddingBlock={2}>
            3. Collect mirror instance information
          </Heading>
          <VStack w={"full"}>
            <Box w={"full"}>
              This step is for selecting the EC2 instance that is to be
              mirrored.
            </Box>
            <Box w={"full"}>Theses parameters have to be populated: </Box>
            <Box w={"full"}>
              &nbsp;-&nbsp;Source GCloud Compute Instance Name : The name of the
              compute engine to be mirrored. It should resemble.
            </Box>
          </VStack>
        </Box>
        <Box w={"full"}>
          <Heading w={"full"} size={"sm"} paddingBlock={2}>
            4. GCP Collector Instance Creation
          </Heading>
          This step creates a new compute engine instance for the Metlo
          collector.
        </Box>
      </VStack>
    </>
  )
}

export default GCPDocs
