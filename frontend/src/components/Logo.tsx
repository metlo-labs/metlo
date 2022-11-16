import React from "react"
import Image from "next/image"

import { useColorModeValue, BoxProps, Box } from "@chakra-ui/react"

interface LogoProps extends BoxProps {
  imageHeight?: string
  imageWidth?: string
}

export const Logo: React.FC<LogoProps> = React.memo(
  ({ imageHeight, imageWidth, ...props }) => {
    const imageSrc = useColorModeValue(
      "/static-images/metlo_logo_horiz.svg",
      "/static-images/metlo_logo_horiz_negative.svg",
    )
    return (
      <Box {...props}>
        <Image
          alt="logo-image"
          height={imageHeight || "36"}
          width={imageWidth || "127"}
          src={imageSrc}
        />
      </Box>
    )
  },
)

export const SmLogo = React.memo((props: BoxProps) => {
  return (
    <Box {...props}>
      <Image
        alt="logo-image"
        height="30"
        width="30"
        src="/static-images/metlo_logo.svg"
      />
    </Box>
  )
})
