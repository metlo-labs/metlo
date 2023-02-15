import path from "path"
import Piscina from "piscina"

const main = async () => {
  const pool = new Piscina()
  const options = {
    filename: path.resolve(__dirname, "analyze-traces.js"),
  }
  const analyzers = Array.from({
    length: parseInt(process.env.NUM_WORKERS || "7"),
  }).map(() => pool.run({}, options))
  await Promise.all(analyzers)
}
main()
