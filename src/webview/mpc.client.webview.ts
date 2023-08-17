import BaseMPC from '../BaseMPC'
import MPCHelper from '../co-signer/MPCHelper'
import { PromisedMPCAssemblyBridge } from '../utils/types'
import { detect_Compatibility_method } from './extraMethods'
import {
  WebviewMPCClient,
  WebviewMPCProxyClient,
  WebViewRef,
} from './WebviewMPCClientBridge'

export default class MPC extends BaseMPC {
  private webviewProxyBridge: any

  static init(webviewRef) {
    return new MPC(webviewRef)
  }

  private constructor(webviewRef: WebViewRef) {
    super()
    const webviewMpcBridge = new WebviewMPCProxyClient()
    this.webviewProxyBridge = webviewMpcBridge
    ;(webviewMpcBridge as any as WebviewMPCClient).setup(webviewRef)
    this.assemblyBridge = webviewMpcBridge

    this.mpcHelper = new MPCHelper(
      this.assemblyBridge as any as PromisedMPCAssemblyBridge,
    )
  }

  async detectCompatibility(): Promise<{ state: boolean; msg?: string }> {
    return (await (this.webviewProxyBridge as WebviewMPCClient).request(
      detect_Compatibility_method,
    )) as Promise<{ state: boolean; msg?: string }>
  }

  onMessageCallback(responseMessageString: string) {
    ;(this.assemblyBridge as any as WebviewMPCClient).onWebviewMessageCallback(
      responseMessageString,
    )
  }
}
