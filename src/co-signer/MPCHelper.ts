import { PromisedMPCAssemblyBridge } from '../utils/types'

class MPCHelper {
  private mpcAssemblyBridge: PromisedMPCAssemblyBridge

  constructor(mpcAssemblyBridge: PromisedMPCAssemblyBridge) {
    this.mpcAssemblyBridge = mpcAssemblyBridge
  }

  async setupRandomSeed(): Promise<boolean> {
    return this.mpcAssemblyBridge.setupRandomSeed()
  }

  async prepare() {
    return this.mpcAssemblyBridge.createContextGeneralParams()
  }

  async extractMnemonicFromSignKey(signKey: string) {
    return this.mpcAssemblyBridge.extractMnemonicFromSignKey(signKey)
  }

  async createKeyPair() {
    return this.mpcAssemblyBridge.createKeyPair()
  }

  async encrypt(localPriv: string, remotePub: string, plainText: string) {
    return this.mpcAssemblyBridge.encrypt(localPriv, remotePub, plainText)
  }

  async decrypt(localPriv: string, remotePub: string, cypher: string) {
    return this.mpcAssemblyBridge.decrypt(localPriv, remotePub, cypher)
  }

  async sign(priv: string, digest: string) {
    return this.mpcAssemblyBridge.sign(priv, digest)
  }

  async verify(pub: string, digest: string, sig: string) {
    return this.mpcAssemblyBridge.verify(pub, digest, sig)
  }

  async aggregateKeyShard(partialShards: string[], X: string) {
    return this.mpcAssemblyBridge.aggregateKeyShard(partialShards, X)
  }
}

export default MPCHelper
