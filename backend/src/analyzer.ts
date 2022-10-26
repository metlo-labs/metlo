import path from "path"
import Piscina from "piscina"
import os from "os"

const totalCPUs = os.cpus().length

const main = async () => {
  const pool = new Piscina()
  const options = {
    filename: path.resolve(__dirname, "analyze-traces.js"),
  }
  const analyzers = Array.from({ length: totalCPUs }).map(() =>
    pool.run({}, options),
  )
  await Promise.all(analyzers)
}
main()
