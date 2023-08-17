import { PromisedMPCAssemblyBridge } from './co-signer/AbstractCoSigner'
import { KeyGen } from './co-signer/KeyGen'
import { KeyRecovery } from './co-signer/KeyRecovery'
import { KeyRefresh } from './co-signer/KeyRefresh'
import MPCHelper from './co-signer/MPCHelper'
import { Signer } from './co-signer/Signer'

interface CoSigner<T> {
  getCoSigner: () => T
}
export default class BaseMPC {
  protected assemblyBridge: PromisedMPCAssemblyBridge
  mpcHelper: MPCHelper

  private getKeyGenInstance() {
    return new KeyGen(this.assemblyBridge)
  }

  private getSignInstance() {
    return new Signer(this.assemblyBridge)
  }

  private getKeyRecoveryInstance() {
    return new KeyRecovery(this.assemblyBridge)
  }

  private getKeyRefreshInstance() {
    return new KeyRefresh(this.assemblyBridge)
  }

  KeyGen: CoSigner<KeyGen> = {
    getCoSigner: this.getKeyGenInstance.bind(this),
  }

  Signer: CoSigner<Signer> = {
    getCoSigner: this.getSignInstance.bind(this),
  }

  KeyRecovery: CoSigner<KeyRecovery> = {
    getCoSigner: this.getKeyRecoveryInstance.bind(this),
  }

  KeyRefresh: CoSigner<KeyRefresh> = {
    getCoSigner: this.getKeyRefreshInstance.bind(this),
  }
}
