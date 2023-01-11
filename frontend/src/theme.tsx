import { extendTheme } from "@chakra-ui/react"
import { mode, StyleFunctionProps } from "@chakra-ui/theme-tools"

const fonts = { mono: `'Menlo', monospace` }

const breakpoints = {
  sm: "40em",
  md: "52em",
  lg: "64em",
  xl: "80em",
}

const theme = extendTheme({
  semanticTokens: {
    colors: {
      text: {
        default: "#16161D",
        _dark: "#ade3b8",
      },
      heroGradientStart: {
        default: "#7928CA",
        _dark: "#e3a7f9",
      },
      heroGradientEnd: {
        default: "#FF0080",
        _dark: "#fbec8f",
      },
      secondaryBG: {
        default: "rgb(248, 248, 249)",
        _dark: "rgb(19, 22, 26)",
      },
      cellBG: {
        default: "white",
        _dark: "rgb(39, 40, 43)",
      },
      headerColor: {
        default: "rgb(179, 181, 185)",
        _dark: "rgb(91, 94, 109)",
      },
    },
    radii: {
      button: "12px",
    },
  },
  styles: {
    global: (props: StyleFunctionProps) => ({
      body: {
        bg: mode("rgb(252, 252, 252)", "black")(props),
      },
    }),
  },
  colors: {
    black: "rgb(17, 19, 23)",
    primary: "rgb(101, 138, 216)",
    deleteRed: "rgb(201, 61, 68)",
    metloBlue: "rgb(66, 76, 249)",
  },
  components: {
    Button: {
      baseStyle: {
        border: "1px",
      },
      variants: {
        base: {},
        create: {
          borderWidth: "0px",
          bg: "metloBlue",
          color: "#FFFFFF",
          _hover: {
            bg: "#343FD2",
            color: "#FFFFFF",
            _disabled: {
              bg: "metloBlue",
              color: "#FFFFFF",
              opacity: 0.5,
            },
          },
          _active: {
            bg: "metloBlue",
            color: "#FFFFFF",
          },
          _disabled: {
            bg: "metloBlue",
            color: "#FFFFFF",
            opacity: 0.5,
          },
        },
        delete: {
          borderWidth: "0px",
          bg: "deleteRed",
          color: "#FFFFFF",
          _hover: {
            bg: "#C40F15",
            color: "#FFFFFF",
            _disabled: {
              bg: "#C93D44",
              color: "#FFFFFF",
              opacity: 0.5,
            },
          },
          _active: {
            bg: "deleteRed",
            color: "#FFFFFF",
          },
          _disabled: {
            bg: "deleteRed",
            color: "#FFFFFF",
            opacity: 0.5,
          },
        },
        createSecondary: {
          bg: "#FFFFFF",
          color: "metloBlue",
          _hover: {
            bg: "metloBlue",
            color: "#FFFFFF",
          },
          _active: {
            bg: "metloBlue",
            color: "#FFFFFF",
          },
          _focus: {
            bg: "metloBlue",
            color: "#FFFFFF",
          },
        },
        deleteSecondary: {
          bg: "#FFFFFF",
          color: "deleteRed",
          _hover: {
            bg: "deleteRed",
            color: "#FFFFFF",
          },
          _focus: {
            bg: "deleteRed",
            color: "#FFFFFF",
          },
        },
      },
    },
  },
  fonts,
  breakpoints,
})

export default theme
