import { readFile } from 'fs/promises'
import path from 'path'

export interface IPkgJson {
  dependencies: Record<string, string>
  name: string
}

export const resolvePkgJson = async (pkgJsonPath: string) => {
  const absolutePath = path.resolve(pkgJsonPath)
  let content: IPkgJson | undefined = undefined
  try {
    const contentString = await readFile(absolutePath, 'utf-8')
    content = JSON.parse(contentString) as IPkgJson
  } catch (e) {}
  return content
}
