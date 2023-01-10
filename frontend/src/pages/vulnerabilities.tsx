import { GetServerSideProps } from "next"
import Error from "next/error"
import superjson from "superjson"
import { PageWrapper } from "components/PageWrapper"
import { VulnerabilitySummary } from "@common/types"
import { getHosts } from "api/endpoints"
import { getVulnerabilitySummary } from "api/alerts/vulnerabilities"
import VulnerabilityPage from "components/Vulnerability"
import { GetVulnerabilityAggParams } from "@common/api/summary"
import { RiskScore } from "@common/enums"

const Vulnerabilities = ({ summary, hosts, params }) => {
  const parsedSummary = superjson.parse<VulnerabilitySummary>(summary)
  const parsedParams = superjson.parse<GetVulnerabilityAggParams>(params)
  if (!parsedSummary) {
    return <Error statusCode={500} />
  }
  return (
    <PageWrapper title="Vulnerabilities">
      <VulnerabilityPage
        summary={parsedSummary}
        hosts={hosts}
        params={parsedParams}
      />
    </PageWrapper>
  )
}

export const getServerSideProps: GetServerSideProps = async context => {
  const params: GetVulnerabilityAggParams = {
    hosts: ((context.query.hosts as string) || null)?.split(",") ?? [],
    riskScores: ((context.query.riskScores as string) || "")
      .split(",")
      .filter(e => Object.values(RiskScore).includes(e as RiskScore))
      .map(e => e as RiskScore),
  }
  const summaryPromise = getVulnerabilitySummary(params)
  const hostsPromise = getHosts()
  const [hosts, summary] = await Promise.all([hostsPromise, summaryPromise])
  return {
    props: {
      hosts,
      summary: superjson.stringify(summary),
      params: superjson.stringify(params),
    },
  }
}

export default Vulnerabilities
