import fs from 'fs'
import path from 'path'

import { loadAndInstantiateMPCAssembly } from '../src/mpc-assembly/AssemblyFsLoader'

export default async function readWasmFile() {
  const wasmFile = fs.readFileSync(
    path.resolve(__dirname, '../src/mpc-assembly/SafeheronCMP.wasm'),
  )

  return { wasmFile }
}

export async function loadWebAssemblyInstance(): Promise<WebAssembly.Instance> {
  const { wasmFile } = await readWasmFile()
  return await loadAndInstantiateMPCAssembly(new Uint8Array(wasmFile))
}

export function filterMessage(targetPartyId, ...messageList) {
  return messageList.filter((m) => m.destination === targetPartyId)
}
