import { Class } from 'type-fest'
import { v4 as uuidV4 } from 'uuid'

import { PromisedMPCAssemblyBridge } from '../co-signer/AbstractCoSigner'
import { MPCAssemblyMethods, RequestMessage, ResponseMessage } from './types'

export abstract class AbstractBridgeClient {
  private waitingMap = new Map<
    string,
    {
      resolve: (args: any) => any
      reject: (arg: any) => any
    }
  >()

  handleResponse(response: ResponseMessage) {
    const { callId, result, err } = response
    if (!this.waitingMap.has(callId)) {
      return
    }
    const { resolve, reject } = this.waitingMap.get(callId)!

    this.waitingMap.delete(callId)

    if (err) {
      reject(err)
    } else {
      resolve(result)
    }
  }

  async request(method: MPCAssemblyMethods, ...params: any) {
    return new Promise((resolve, reject) => {
      const requestId = uuidV4()
      const message: RequestMessage = {
        callId: requestId,
        method,
        params,
      }
      this.waitingMap.set(requestId, {
        resolve,
        reject,
      })
      console.debug(
        `[Bridge Client] request -->> requestId: ${requestId}, method: ${method}`,
      )
      this.send(message)
    })
  }

  abstract send(data: RequestMessage): void
}

export type MPCAssemblyBridgeDuck<T> = (PromisedMPCAssemblyBridge | T) &
  AbstractBridgeClient & {
    new (): PromisedMPCAssemblyBridge
  }

const MpcAssemblyBridgeDuck = class {} as any

export function createAssemblyBridgeProxy<T extends AbstractBridgeClient>(
  ProxyClientClass: Class<AbstractBridgeClient>,
): MPCAssemblyBridgeDuck<T> {
  return new Proxy<MPCAssemblyBridgeDuck<T>>(MpcAssemblyBridgeDuck, {
    construct(): object {
      const proxyInstance = new ProxyClientClass()
      return new Proxy(proxyInstance, {
        get(target: MPCAssemblyBridgeDuck<T>, p: MPCAssemblyMethods | string) {
          if (Reflect.has(proxyInstance, p)) {
            return Reflect.get(proxyInstance, p)
          }
          return function (...params) {
            return proxyInstance.request(p as MPCAssemblyMethods, ...params)
          }
        },
      })
    },
  })
}
