import { ChakraProvider } from "@chakra-ui/react"

import theme from "../theme"
import "../main.css"
import { AppProps } from "next/app"
import { SidebarLayoutShell } from "components/SidebarLayoutShell"

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider theme={theme}>
      <SidebarLayoutShell>
        <Component {...pageProps} />
      </SidebarLayoutShell>
    </ChakraProvider>
  )
}

export default MyApp
