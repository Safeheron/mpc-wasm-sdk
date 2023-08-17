import initWasm from './SafeheronCMP'

export async function loadAndInstantiateMPCAssembly(
  mpcWasmBuffer: Uint8Array,
): Promise<WebAssembly.Instance> {
  const instance = await initWasm({
    wasmBinary: mpcWasmBuffer,
    wasmBinaryFile: 'SafeheronCMP.wasm',
  })

  return instance
}
