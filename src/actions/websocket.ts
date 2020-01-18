import { auth, Credentials } from '..'
import { LeagueWebSocket } from '..'

export async function connect(credentials: Credentials | null = null): Promise<LeagueWebSocket> {
  const creds = credentials || await auth()

  const socket = new LeagueWebSocket(`wss://riot:${creds.token}@127.0.0.1:${creds.port}`, {
    headers: {
      Authorization: 'Basic ' + Buffer.from(`riot:${creds.token}`).toString('base64')
    },
    rejectUnauthorized: false
  })

  socket.on('open', () => {
    socket.send(JSON.stringify([5, 'OnJsonApiEvent']))
  })

  return socket
}