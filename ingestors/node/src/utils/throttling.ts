import { Lock, ILock } from "lock"

const LOCK_KEY = "METLO_LIMIT"

export class Throttler {
    private rps: Number;
    private ts: Array<number>;
    private lock: ILock
    constructor(rps: Number) {
        this.rps = rps
        this.ts = new Array<number>()
        this.lock = Lock()
    }

    allow(successCb: () => void, failCb?: () => void): void {
        this.lock(LOCK_KEY, (release) => {
            const now = Date.now()
            const tmp_ts = this.ts.filter(
                (ts) => {
                    if ((now - ts) <= 1000) {
                        return true
                    } return false
                }
            )
            this.ts = tmp_ts
            if (this.ts.length < this.rps) {
                this.ts.push(now)
                release()()
                successCb()
            } else {
                release()()
                failCb ? failCb() : null
            }
        })
    }
}