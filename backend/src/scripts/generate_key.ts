import yargs from "yargs"
import { AppDataSource } from "data-source"
import { ApiKey } from "models"
import { randomUUID } from "crypto"

const generateKey = async (
    keyName: string
) => {
    const newKey = ApiKey.create({ name: keyName })
    newKey.name = keyName
    return await AppDataSource.getRepository(ApiKey).save(
        newKey,
    )
}

const generateName = () => {
    return `Metlo-API-Key-${randomUUID()}`
}

const main = async () => {
    const datasource = await AppDataSource.initialize()
    if (!datasource.isInitialized) {
        console.error("Couldn't initialize datasource...")
        return
    }
    console.log("AppDataSource Initialized...")
    const args = await yargs(process.argv).option("name", {
        describe: "Name for the key. If not given, name will be assigned automatically",
        type: 'string',
        demandOption: false,
        default: () => { return generateName() }
    })

    let key = await generateKey(args.argv["name"])
    console.log(`Your API KEY is : ${key.apiKey}`)
}

main()
