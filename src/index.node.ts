import { webcrypto } from 'crypto'

import BaseMPC from './BaseMPC'
import { PromisedMPCAssemblyBridge } from './co-signer/AbstractCoSigner'
import { KeyGen } from './co-signer/KeyGen'
import MPCHelper from './co-signer/MPCHelper'
import { Signer } from './co-signer/Signer'
import { loadAndInstantiateMPCAssembly } from './mpc-assembly/AssemblyFsLoader'
import MPCAssemblyBridge from './mpc-assembly/MPCAssemblyBridge'

/**
 * this file just used for test case
 */
export class MPC extends BaseMPC {
  static async init(wasmFile) {
    // @ts-ignore
    global.crypto = webcrypto
    // @ts-ignore
    global.window = {}

    const instance = await loadAndInstantiateMPCAssembly(
      new Uint8Array(wasmFile),
    )
    return new MPC(instance)
  }

  private constructor(wasmInstance: WebAssembly.Instance) {
    super()
    this.assemblyBridge = new MPCAssemblyBridge(
      wasmInstance,
    ) as any as PromisedMPCAssemblyBridge
    this.assemblyBridge.setupRandomSeed()
    this.mpcHelper = new MPCHelper(this.assemblyBridge)
  }
}

export { KeyGen, Signer }
