import { GetServerSideProps } from "next"
import Error from "next/error"
import superjson from "superjson"
import SensitiveDataPage from "components/SensitiveData"
import { PageWrapper } from "components/PageWrapper"
import { getSensitiveDataSummary } from "api/sensitiveData"
import { SensitiveDataSummary } from "@common/types"
import { getHosts } from "api/endpoints"
import { GetSensitiveDataAggParams } from "@common/api/summary"
import { DataSection, RiskScore } from "@common/enums"

const SensitiveData = ({ summary, hosts, params }) => {
  const parsedSummary = superjson.parse<SensitiveDataSummary>(summary)
  const parsedInitParams = superjson.parse<GetSensitiveDataAggParams>(params)
  if (!parsedSummary) {
    return <Error statusCode={500} />
  }
  return (
    <PageWrapper title="Sensitive Data">
      <SensitiveDataPage
        summary={parsedSummary}
        hosts={hosts}
        params={parsedInitParams}
      />
    </PageWrapper>
  )
}

export const getServerSideProps: GetServerSideProps = async context => {
  const params: GetSensitiveDataAggParams = {
    hosts: ((context.query.hosts as string) || null)?.split(",") ?? [],
    riskScores: ((context.query.riskScores as string) || "")
      .split(",")
      .filter(e => Object.values(RiskScore).includes(e as RiskScore))
      .map(e => e as RiskScore),
    locations: ((context.query.locations as string) || "")
      .split(",")
      .filter(e => Object.values(DataSection).includes(e as DataSection))
      .map(e => e as DataSection),
  }
  const summaryPromise = getSensitiveDataSummary(params)
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

export default SensitiveData
