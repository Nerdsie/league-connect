import { EventEmitter } from 'events'
import {
  authenticate,
  ClientNotFoundError,
  Credentials
} from './authentication'

const DEFAULT_POLL_INTERVAL = 2500

export declare interface LeagueClient {
  on(event: 'connect', callback: (credentials: Credentials) => void): this

  on(event: 'disconnect', callback: () => void): this
}

export interface LeagueClientOptions {
  /**
   * The time duration in milliseconds between each check for a client
   * disconnect
   *
   * Default: 2500
   */
  pollInterval: number
}

export class LeagueClient extends EventEmitter {
  private intervalHandle: NodeJS.Timeout | undefined = undefined
  public credentials?: Credentials = undefined

  constructor(credentials: Credentials, public options?: LeagueClientOptions) {
    super()
    this.credentials = credentials
  }

  /**
   * Start listening for League Client processes
   */
  start() {
    if (this.credentials === undefined || !processExists(this.credentials.pid)) {
      // Invalidated credentials or no LeagueClientUx process, fail
      throw new ClientNotFoundError()
    }
    this.intervalHandle = setInterval(() => {
      this.onTick()
    }, this.options?.pollInterval ?? DEFAULT_POLL_INTERVAL)
  }

  /**
   * Stop listening for client stop/start
   */
  stop() {
    if (this.intervalHandle !== undefined) {
      clearInterval(this.intervalHandle)
    }
  }

  private async onTick() {
    if (this.credentials !== undefined) {
      // Current credentials are valid
      if (!processExists(this.credentials.pid)) {
        // No such process, emit disconnect and
        // invalidate credentials
        this.emit('disconnect')
        this.credentials = undefined
      }
    } else {
      // Current credentials were invalidated, wait for
      // client to come back up
      const credentials = await authenticate({
        awaitConnection: true,
        pollInterval: this.options?.pollInterval ?? DEFAULT_POLL_INTERVAL
      })
      this.credentials = credentials
      this.emit('connect', credentials)
    }
  }
}

function processExists(pid: number): boolean {
  try {
    // `man 1 kill`: if sig is 0, then no signal is sent, but error checking
    // is still performed.
    return process.kill(pid, 0)
  } catch (err) {
    return err.code === 'EPERM'
  }
}
