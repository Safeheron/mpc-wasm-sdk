import {
  AbstractBridgeClient,
  createAssemblyBridgeProxy,
} from '../utils/AbstractBridgeClient'
import { RequestMessage, ResponseMessage } from '../utils/types'

export type WebViewRef = {
  injectJavaScript(script: string): void
}

export class WebviewMPCClient extends AbstractBridgeClient {
  private webviewRef: WebViewRef

  setup(webviewRef: WebViewRef) {
    this.webviewRef = webviewRef
  }

  send(message: RequestMessage) {
    const { callId, method, params } = message

    const script = `window.mpc.invoke('${callId}', '${method}', '${JSON.stringify(
      params,
    )}'); void(0);`

    this.webviewRef.injectJavaScript(script)
  }

  onWebviewMessageCallback(data: string) {
    const responseMessage = JSON.parse(data) as ResponseMessage
    this.handleResponse(responseMessage)
  }
}

export const WebviewMPCProxyClient = createAssemblyBridgeProxy(WebviewMPCClient)
