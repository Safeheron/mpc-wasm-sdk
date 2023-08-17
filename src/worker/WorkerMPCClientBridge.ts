import {
  AbstractBridgeClient,
  createAssemblyBridgeProxy,
  MPCAssemblyBridgeDuck,
} from '../utils/AbstractBridgeClient'
import { RequestMessage, ResponseMessage } from '../utils/types'

export class WorkerClientBridge extends AbstractBridgeClient {
  private worker?: Worker

  setWorkerUrl(workJsUrl: string) {
    const mpcWorker = new Worker(workJsUrl)
    console.log('Create worker...')
    mpcWorker.onmessage = this.handleWorkerMessage.bind(this)
    mpcWorker.onerror = this.handleWorkerError.bind(this)
    console.log('Create worker end...', mpcWorker)
    this.worker = mpcWorker
  }

  terminate() {
    this.worker.terminate()
  }

  private handleWorkerError(error) {
    console.error('worker occur an error: ', error)
  }

  private handleWorkerMessage(event) {
    const response: ResponseMessage = event.data
    this.handleResponse(response)
  }

  async send(request: RequestMessage) {
    this.worker.postMessage(request)
  }
}

export const ProxyWorkerClient: MPCAssemblyBridgeDuck<WorkerClientBridge> =
  createAssemblyBridgeProxy<WorkerClientBridge>(WorkerClientBridge)
