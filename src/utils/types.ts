import { ConditionalKeys } from 'type-fest'

import MPCAssemblyBridge from '../mpc-assembly/MPCAssemblyBridge'

export interface ResponseMessage {
  callId: string
  method: string
  result?: any
  err?: any
}

export interface RequestMessage {
  callId: string
  method: string
  params?: any
}

export type MPCAssemblyBridgeMethods = ConditionalKeys<
  MPCAssemblyBridge,
  (...props: any) => any
>

type UnpackedPromise<T> = T extends Promise<infer U> ? U : T
type GenericFunction<TS extends any[], R> = (...args: TS) => R
export type Promisify<T> = {
  [K in keyof T]: T[K] extends GenericFunction<infer TS, infer R>
    ? (...args: TS) => Promise<UnpackedPromise<R>>
    : never
}
export type PromisedMPCAssemblyBridge = Promisify<MPCAssemblyBridge>
