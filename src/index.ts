import BaseMPC from './BaseMPC'
import { PromisedMPCAssemblyBridge } from './co-signer/AbstractCoSigner'
import { KeyGen } from './co-signer/KeyGen'
import MPCHelper from './co-signer/MPCHelper'
import { Signer } from './co-signer/Signer'
import { loadAndInstantiateMPCAssembly } from './mpc-assembly/AssemblyBufferLoader'
import MPCAssemblyBridge from './mpc-assembly/MPCAssemblyBridge'

export class MPC extends BaseMPC {
  static async init() {
    const instance = await loadAndInstantiateMPCAssembly()
    return new MPC(instance)
  }

  private constructor(wasmInstance: WebAssembly.Instance) {
    super()
    this.assemblyBridge = new MPCAssemblyBridge(
      wasmInstance,
    ) as any as PromisedMPCAssemblyBridge
    this.mpcHelper = new MPCHelper(this.assemblyBridge)
    this.assemblyBridge.setupRandomSeed()
  }
}

export { KeyGen, Signer }
