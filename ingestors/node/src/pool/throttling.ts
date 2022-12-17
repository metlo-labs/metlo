class Throttler {
    private rps: Number;
    private ts: Array<Number>;
    constructor(rps: Number) {
        this.rps = rps
        this.ts = new Array<Number>()
    }

    allow(): Boolean {
        return true
    }
}