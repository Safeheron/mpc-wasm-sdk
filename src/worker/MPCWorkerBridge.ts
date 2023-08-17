import { loadAndInstantiateMPCAssembly } from '../mpc-assembly/AssemblyBufferLoader'
import MPCAssemblyBridge from '../mpc-assembly/MPCAssemblyBridge'
import { RequestMessage, ResponseMessage } from '../utils/types'

let mpcAssemblyBridge
let setupFlag = undefined
let setupFailedReason = ''
let resolver

async function setup() {
  try {
    const wasmInstance = await loadAndInstantiateMPCAssembly()
    mpcAssemblyBridge = new MPCAssemblyBridge(wasmInstance)
    mpcAssemblyBridge.setupRandomSeed()
    setupFlag = true
    resolver && resolver(true)
  } catch (e) {
    setupFlag = false
    setupFailedReason = e.message || 'Setup MPC Assembly Bridge Failed.'
  }
}
setup()

async function waitForBridgeReady() {
  if (!!setupFlag && !!mpcAssemblyBridge) return true
  return new Promise((resolve) => {
    resolver = resolve
  })
}

self.addEventListener('message', async (evt) => {
  const data = evt.data as RequestMessage
  const { callId, method, params } = data
  console.log(
    '[Worker Service] Receive message ↓',
    data,
    callId,
    method,
    params,
  )
  await waitForBridgeReady()

  const handler = mpcAssemblyBridge[method].bind(mpcAssemblyBridge)
  // @ts-ignore
  const result = handler(...params)

  const responseMessage: ResponseMessage = {
    callId,
    method,
    result,
  }

  self.postMessage(responseMessage)
})
