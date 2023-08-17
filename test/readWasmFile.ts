import fs from 'fs'
import path from 'path'

import { loadAndInstantiateMPCAssembly } from '../src/mpc-assembly/AssemblyFsLoader'
import { ComputeMessage } from '../src/mpc-assembly/mpc.types'

export default async function readWasmFile() {
  const wasmFile = fs.readFileSync(
    path.resolve(__dirname, '../src/mpc-assembly/SafeheronCMP.wasm'),
  )

  return { wasmFile }
}

export async function loadWebAssemblyInstance() {
  const { wasmFile } = await readWasmFile()
  return await loadAndInstantiateMPCAssembly(new Uint8Array(wasmFile))
}

export function filterMessage(
  targetPartyId: string,
  ...messageList: ComputeMessage[]
) {
  return messageList.filter((m) => m.destination === targetPartyId)
}
