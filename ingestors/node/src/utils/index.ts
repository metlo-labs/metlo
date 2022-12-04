import path from "node:path"
import fs from "fs"

const findClosestPackageJson = (dirPath: string) => {
  const filePath = path.join(dirPath, "package.json")
  if (!fs.existsSync(filePath)) {
    return findClosestPackageJson(dirPath.split("/").slice(0, -1).join("/"))
  } else {
    const data = JSON.parse(fs.readFileSync(filePath).toString("utf-8"))
    return data
  }
}

const findParentPackage = () => {
  const moduleParent = require.main
  return findClosestPackageJson(moduleParent.path)
}

export const getDependencies = () => {
  return Object.keys(findParentPackage().dependencies)
}
