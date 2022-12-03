import { GetServerSideProps } from "next"
import Error from "next/error"
import superjson from "superjson"
import { PageWrapper } from "components/PageWrapper"
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
    <PageWrapper title="Vulnerabilities">
      <VulnerabilityPage initSummary={parsedSummary} hosts={hosts} />
    </PageWrapper>
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
