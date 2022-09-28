import superjson from "superjson"
import { GetServerSideProps } from "next"
import AttackDetailContent from "enterprise/pages/protection/AttackDetail"
import { getAttack } from "api/attacks"

const AttackDetail = ({ attackDetailResp }) => (
  <AttackDetailContent attackDetail={attackDetailResp} />
)

export const getServerSideProps: GetServerSideProps = async context => {
  const attackDetailResp = await getAttack(context.query.attackUUID as string)

  return {
    props: {
      attackDetailResp: superjson.stringify(attackDetailResp),
    },
  }
}

export default AttackDetail
