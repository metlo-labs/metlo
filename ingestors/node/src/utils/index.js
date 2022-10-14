const path = require("node:path")
const fs = require("fs")

function findClosestPackageJson(dirPath) {
    const filePath = path.join(dirPath, "package.json")
    if (!fs.existsSync(filePath)) {
        return findClosestPackageJson(dirPath.split("/").slice(0, -1).join("/"))
    } else {        
        const data = JSON.parse(fs.readFileSync(filePath).toString("utf-8"))
        return data
    }
}

function findParentPackage() {
    const moduleParent = require.main
    return findClosestPackageJson(moduleParent.path)

}

function getDependencies() {
    return Object.keys(findParentPackage().dependencies)
}

module.exports = { getDependencies }