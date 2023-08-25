import BaseMPC from '../BaseMPC'
import MPCHelper from '../co-signer/MPCHelper'
import {
  WebviewMPCClient,
  WebviewMPCProxyClient,
  WebViewRef,
} from './WebviewMPCClientBridge'
import { PromisedMPCAssemblyBridge } from '../utils/types';

export default class MPC extends BaseMPC {
  static init(webviewRef) {
    return new MPC(webviewRef)
  }

  private constructor(webviewRef: WebViewRef) {
    super()
    const webviewMpcBridge = new WebviewMPCProxyClient()
    ;(webviewMpcBridge as any as WebviewMPCClient).setup(webviewRef)
    this.assemblyBridge = webviewMpcBridge

    this.mpcHelper = new MPCHelper(
      this.assemblyBridge as any as PromisedMPCAssemblyBridge,
    )
  }

  onMessageCallback(responseMessageString: string) {
    ;(this.assemblyBridge as any as WebviewMPCClient).onWebviewMessageCallback(
      responseMessageString,
    )
  }
}
