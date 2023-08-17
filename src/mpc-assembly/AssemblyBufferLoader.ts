// @ts-ignore
import initWasm from './SafeheronCMP.js'
// @ts-ignore
import mpcWasmBuffer from './SafeheronCMP.wasm'

export async function loadAndInstantiateMPCAssembly(): Promise<WebAssembly.Instance> {
  const instance = await initWasm({
    wasmBinary: mpcWasmBuffer,
    wasmBinaryFile: 'SafeheronCMP.wasm',
  })

  // console.log('WasmInstance: ', instance)

  return instance
}
