import {
  Box,
  VStack,
  Button,
  FormControl,
  FormLabel,
  Input,
  FormHelperText,
  useToast,
} from "@chakra-ui/react"
import { updateEmail } from "api/home/updateEmail"
import { Logo } from "components/Logo"
import Head from "next/head"
import { useRouter } from "next/router"
import { useState } from "react"
import { makeToast } from "utils"

export const HomeUpdateEmailView: React.FC<{}> = () => {
  const [input, setInput] = useState("")
  const router = useRouter()
  const toast = useToast()

  const submit = () => {
    if (!input) {
      toast(
        makeToast({
          title: "Email is required...",
          status: "error",
        }),
      )
      return
    }
    updateEmail(input, false)
      .then(() => {
        router.reload()
      })
      .catch(e => {
        toast(
          makeToast(
            {
              title: "Post Failed",
              description: e.response?.data,
              status: "error",
            },
            e.response?.status,
          ),
        )
      })
  }
  const skip = () => {
    updateEmail("", true)
      .then(() => {
        router.reload()
      })
      .catch(e => {
        toast(
          makeToast(
            {
              title: "Post Failed",
              description: e.response?.data,
              status: "error",
            },
            e.response?.status,
          ),
        )
      })
  }

  return (
    <Box
      bg="secondaryBG"
      h="100vh"
      w="100vw"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Head>
        <title>Metlo</title>
      </Head>
      <VStack spacing="8" w="lg">
        <Logo imageHeight={72} imageWidth={254} />
        <FormControl>
          <FormLabel>Enter your email address</FormLabel>
          <Input
            type="email"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => {
              if (e.key === "Enter") {
                submit()
              }
            }}
          />
          <FormHelperText>
            We will only use this email to send you important updates about
            Metlo.
          </FormHelperText>
        </FormControl>
        <Button variant="create" onClick={submit}>
          Submit
        </Button>
        <Button border="0" variant="link" onClick={skip}>
          Skip →
        </Button>
      </VStack>
    </Box>
  )
}
