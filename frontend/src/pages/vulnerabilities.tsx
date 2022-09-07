import { GetServerSideProps } from "next"
import Error from "next/error"
import superjson from "superjson"
import { SideNavLinkDestination } from "components/Sidebar/NavLinkUtils"
import { SidebarLayoutShell } from "components/SidebarLayoutShell"
import { VulnerabilitySummary } from "@common/types"
import { getHosts } from "api/endpoints"
import { getVulnerabilitySummary } from "api/alerts/vulnerabilities"
import VulnerabilityPage from "components/Vulnerability"

const Vulnerabilities = ({ summary, hosts }) => {
  const parsedSummary = superjson.parse<VulnerabilitySummary>(summary)
  if (!parsedSummary) {
    return <Error statusCode={500} />
  }
  return (
    <SidebarLayoutShell
      title="Vulnerabilities"
      currentTab={SideNavLinkDestination.Vulnerabilities}
    >
      <VulnerabilityPage initSummary={parsedSummary} hosts={hosts} />
    </SidebarLayoutShell>
  )
}

export const getServerSideProps: GetServerSideProps = async context => {
  const summaryPromise = getVulnerabilitySummary({})
  const hostsPromise = getHosts()
  const [hosts, summary] = await Promise.all([hostsPromise, summaryPromise])
  return {
    props: {
      hosts,
      summary: superjson.stringify(summary),
    },
  }
}

export default Vulnerabilities
