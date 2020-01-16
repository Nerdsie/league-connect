import fs from 'fs-extra'
import { Credentials } from './index'
import cp from 'child_process'
import util from 'util'

const exec = util.promisify(cp.exec)

export async function auth(): Promise<Credentials> {
  const re = process.platform === 'win32' ? /"--install-directory=(.*?)"/ : /--install-directory=(.*?)( --|\n|$)/
  const cmd = process.platform === 'win32' ? "WMIC PROCESS WHERE name='LeagueClientUx.exe' GET CommandLine" : "ps x -o args | grep 'LeagueClientUx'"

  const { stdout } = await exec(cmd)
  const path = stdout.match(re) || []

  try {
    const content = await fs.readFile(`${path[1]}/lockfile`, 'utf8')

    const [name, pid, port, token, protocol] = content.split(':')

    return {
      name,
      pid: Number(pid),
      port: Number(port),
      token,
      protocol
    } as Credentials
  } catch (ex) {
    throw Error("League Client could not be located.")
  }
}