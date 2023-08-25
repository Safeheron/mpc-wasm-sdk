import { PromisedMPCAssemblyBridge } from '../utils/types'

export abstract class AbstractCoSigner {
  protected readonly mpcAssemblyBridge: PromisedMPCAssemblyBridge

  protected contextId: number
  protected lastRoundIndex = 0

  isComplete = false

  constructor(mpcBridge: PromisedMPCAssemblyBridge) {
    this.mpcAssemblyBridge = mpcBridge
  }

  get isContextCreated() {
    return Boolean(this.contextId)
  }

  get lastIndex() {
    return this.lastRoundIndex
  }
}
