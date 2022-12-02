import { TiFlowSwitch } from "icons/ti/TiFlowSwitch"
import { FaShareAlt } from "icons/fa/FaShareAlt"
import { FaBell } from "icons/fa/FaBell"
import { AiFillLock } from "icons/ai/AiFillLock"
import { AiFillSecurityScan } from "icons/ai/AiFillSecurityScan"
import { AiFillApi } from "icons/ai/AiFillApi"
import { HiShieldCheck } from "icons/hi/HiShieldCheck"
import { IconType } from "icons/lib"
import { FaCog } from "icons/fa/FaCog"
import { FiServer } from "icons/fi/FiServer"
import { FaHome } from "icons/fa/FaHome"

export enum SideNavLinkDestination {
  Home,
  Endpoints,
  Hosts,
  Alerts,
  Specs,
  Connections,
  SensitiveData,
  Vulnerabilities,
  Protection,
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
    case SideNavLinkDestination.Vulnerabilities:
      return "Vulnerabilities"
    case SideNavLinkDestination.Alerts:
      return "Alerts"
    case SideNavLinkDestination.Specs:
      return "API Specs"
    case SideNavLinkDestination.Connections:
      return "Connections"
    case SideNavLinkDestination.Protection:
      return "Protection"
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
    case SideNavLinkDestination.Vulnerabilities:
      return AiFillSecurityScan
    case SideNavLinkDestination.Alerts:
      return FaBell
    case SideNavLinkDestination.Specs:
      return AiFillApi
    case SideNavLinkDestination.Connections:
      return FaShareAlt
    case SideNavLinkDestination.Protection:
      return HiShieldCheck
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
    case SideNavLinkDestination.Vulnerabilities:
      return "/vulnerabilities"
    case SideNavLinkDestination.Alerts:
      return "/alerts"
    case SideNavLinkDestination.Specs:
      return "/specs"
    case SideNavLinkDestination.Connections:
      return "/connections"
    case SideNavLinkDestination.Protection:
      return "/protection"
    case SideNavLinkDestination.Settings:
      return "/settings"
    default:
      throw Error(`No value mapped for ${dest}`)
  }
}
