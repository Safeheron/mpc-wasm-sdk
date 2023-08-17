import initWasm from './SafeheronCMP'

export async function loadAndInstantiateMPCAssembly(
  binaryFilePath: string,
): Promise<WebAssembly.Instance> {
  const instance = await initWasm({
    wasmBinaryFile: binaryFilePath,
  })

  console.log('WasmInstance: ', instance)

  return instance
}
