import React from "react"
import { WebhookResp } from "@common/types"
import { VStack } from "@chakra-ui/react"
import { Webhook } from "./webhook"

interface IntegrationsProps {
  webhooks: WebhookResp[]
  setWebhooks: React.Dispatch<React.SetStateAction<WebhookResp[]>>
  hostList: string[]
}

export const Integrations: React.FC<IntegrationsProps> = React.memo(
  ({ webhooks, setWebhooks, hostList }) => {
    return (
      <VStack w="full" alignItems="flex-start" spacing="0">
        <Webhook
          webhooks={webhooks}
          setWebhooks={setWebhooks}
          hostList={hostList}
        />
      </VStack>
    )
  },
)
