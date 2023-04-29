import { TiFlowSwitch } from "icons/ti/TiFlowSwitch"
import { FaBell } from "icons/fa/FaBell"
import { AiFillLock } from "icons/ai/AiFillLock"
import { AiFillSecurityScan } from "icons/ai/AiFillSecurityScan"
import { HiShieldCheck } from "icons/hi/HiShieldCheck"
import { IconType } from "icons/lib"
import { FaCog } from "icons/fa/FaCog"
import { FiServer } from "icons/fi/FiServer"
import { FaHome } from "icons/fa/FaHome"
import { BiTestTube } from "icons/bi/BiTestTube"

export enum SideNavLinkDestination {
  Home,
  Endpoints,
  Hosts,
  Alerts,
  SensitiveData,
  Attacks,
  Tests,
  Settings,
}

export const sideNavDestinationToLabel: (
  dest: SideNavLinkDestination,
) => string = dest => {
  switch (dest) {
    case SideNavLinkDestination.Home:
      return "Home"
    case SideNavLinkDestination.Endpoints:
      return "Endpoints"
    case SideNavLinkDestination.Hosts:
      return "Hosts"
    case SideNavLinkDestination.SensitiveData:
      return "Sensitive Data"
    case SideNavLinkDestination.Alerts:
      return "Alerts"
    case SideNavLinkDestination.Attacks:
      return "Attacks"
    case SideNavLinkDestination.Tests:
      return "Testing"
    case SideNavLinkDestination.Settings:
      return "Settings"
    default:
      throw Error(`No value mapped for ${dest}`)
  }
}

export const sideNavDestinationToIcon: (
  dest: SideNavLinkDestination,
) => IconType = dest => {
  switch (dest) {
    case SideNavLinkDestination.Home:
      return FaHome
    case SideNavLinkDestination.Endpoints:
      return TiFlowSwitch
    case SideNavLinkDestination.Hosts:
      return FiServer
    case SideNavLinkDestination.SensitiveData:
      return AiFillLock
    case SideNavLinkDestination.Alerts:
      return FaBell
    case SideNavLinkDestination.Attacks:
      return HiShieldCheck
    case SideNavLinkDestination.Tests:
      return BiTestTube
    case SideNavLinkDestination.Settings:
      return FaCog
    default:
      throw Error(`No value mapped for ${dest}`)
  }
}

export const sideNavDestinationToHref: (
  dest: SideNavLinkDestination,
) => string = dest => {
  switch (dest) {
    case SideNavLinkDestination.Home:
      return "/"
    case SideNavLinkDestination.Endpoints:
      return "/endpoints"
    case SideNavLinkDestination.Hosts:
      return "/hosts"
    case SideNavLinkDestination.SensitiveData:
      return "/sensitive-data"
    case SideNavLinkDestination.Alerts:
      return "/alerts"
    case SideNavLinkDestination.Attacks:
      return "/attacks"
    case SideNavLinkDestination.Tests:
      return "/tests"
    case SideNavLinkDestination.Settings:
      return "/settings"
    default:
      throw Error(`No value mapped for ${dest}`)
  }
}
