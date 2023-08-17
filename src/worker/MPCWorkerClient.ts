import BaseMPC from '../BaseMPC'
import { KeyGen } from '../co-signer/KeyGen'
import MPCHelper from '../co-signer/MPCHelper'
import { Signer } from '../co-signer/Signer'
import { ProxyWorkerClient, WorkerClientBridge } from './WorkerMPCClientBridge'

export class WorkerMPC extends BaseMPC {
  static async init(workerJsUrl: string) {
    return new WorkerMPC(workerJsUrl)
  }

  private constructor(workerJsUrl: string) {
    super()
    this.assemblyBridge = new ProxyWorkerClient()
    ;(this.assemblyBridge as any as WorkerClientBridge).setWorkerUrl(
      workerJsUrl,
    )

    this.mpcHelper = new MPCHelper(this.assemblyBridge)
  }

  terminate() {
    ;(this.assemblyBridge as any as WorkerClientBridge).terminate()
  }
}

export { KeyGen, Signer }
