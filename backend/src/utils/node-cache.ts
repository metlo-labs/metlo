import NodeCacheModule from "node-cache"
import { MetloContext } from "types"

export class NodeCache {
  private instance: NodeCacheModule

  public constructor(opts?: NodeCacheModule.Options) {
    this.instance = new NodeCacheModule(opts ?? { stdTTL: 60, checkperiod: 10 })
  }

  public set(ctx: MetloContext, key: string, data: unknown, ttl?: number) {
    if (ttl) {
      this.instance.set(key, data, ttl)
    } else {
      this.instance.set(key, data)
    }
  }

  public get(ctx: MetloContext, key: string) {
    return this.instance.get(key)
  }
}
