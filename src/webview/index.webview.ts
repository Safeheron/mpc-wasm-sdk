import { loadAndInstantiateMPCAssembly } from '../mpc-assembly/AssemblyBufferLoader'
import MPCAssemblyBridge from '../mpc-assembly/MPCAssemblyBridge'
import { ResponseMessage } from '../utils/types'

type BridgeState = '' | 'init' | 'loaded' | 'failed'

declare global {
  interface Window {
    ReactNativeWebView: {
      postMessage(message: string): void
    }
    mpc: MPCService
  }
}

function callback(
  callId: string,
  methodName: string,
  result: any,
  errorMessage?: string,
) {
  const response: ResponseMessage = {
    callId,
    method: methodName,
    result,
    err: errorMessage,
  }

  const serializedResult = JSON.stringify(response)
  if (!window.ReactNativeWebView) {
    console.log('serializedResult', serializedResult)
  } else {
    window.ReactNativeWebView.postMessage(serializedResult)
  }
}

class MPCService {
  private state: BridgeState = ''
  private initFailedReason = ''
  private assemblyBridge: MPCAssemblyBridge

  async setup() {
    try {
      this.state = 'init'
      const wasmInstance = await loadAndInstantiateMPCAssembly()
      this.assemblyBridge = new MPCAssemblyBridge(wasmInstance)
      console.log('start to set random seed...')
      const ret = this.assemblyBridge.setupRandomSeed()
      console.log('set random seed result: ', ret)
      if (!ret) {
        throw new Error('Set Random seed failed.')
      }

      this.state = 'loaded'
      console.log('Webview init assembly success!!')
    } catch (e) {
      console.error('Webview init assembly failed!', e)
      this.state = 'failed'
      this.initFailedReason =
        typeof e.message === 'string' ? e.message : 'init assembly failed.'
    }
  }

  async invoke(callId: string, methodName: string, args: string) {
    const handler = this.assemblyBridge[methodName]
    if (!handler || typeof handler !== 'function') {
      callback(callId, methodName, null, `Invalid method name [${methodName}]`)
      return
    }

    if (this.state !== 'loaded') {
      callback(
        callId,
        methodName,
        null,
        `Webview init assembly failed! reason is: ${this.initFailedReason}`,
      )
      return
    }

    try {
      const result = await handler.call(
        this.assemblyBridge,
        ...JSON.parse(args),
      )
      callback(callId, methodName, result, null)
    } catch (error) {
      console.error('MPC algorithm execute error: ', error)
      callback(
        callId,
        methodName,
        null,
        typeof error === 'string'
          ? error
          : error.message || 'unknown mpc error',
      )
    }
  }
}

const mpc = new MPCService()
mpc.setup()

window.mpc = mpc
