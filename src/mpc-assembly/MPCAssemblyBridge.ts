import type {
  AggregateKeyShardParams,
  AggregateKeyShardResult,
  AuthDecryptedParams,
  AuthDecryptedResult,
  AuthEncryptedParams,
  AuthEncryptedResult,
  C_Methods,
  Call_AggregateKeyShard,
  Call_AuthDecrypted,
  Call_AuthEncrypted,
  Call_DestroySingleContextForKeyRefresh,
  Call_EcdsaSign,
  Call_EcdsaVerify,
  Call_GenerateKeyPair,
  Call_GenerateMinimalKey,
  Call_GeneratePubAndZkp,
  Call_KeyGenContextAndRound0,
  Call_KeyGenRound,
  Call_KeyRecovery,
  Call_KeyRecoveryRound,
  Call_KeyRefreshContext,
  Call_KeyRefreshRound,
  Call_SignContextAndRound0,
  Call_SignRound,
  Call_type,
  EcdsaSignParams,
  EcdsaSignResult,
  EcdsaVerifyParams,
  GenerateKeyPairResult,
  GenerateMinimalKeyParams,
  GenerateMinimalKeyResult,
  GeneratePubAndZkpParams,
  GeneratePubAndZkpResult,
  KeyGenContextParams,
  KeyGenContextResult,
  KeyGenRoundParams,
  KeyRecoveryParams,
  KeyRecoveryRoundParams,
  KeyRefreshContextResult,
  KeyRefreshRoundParams,
  KeyRefreshRoundResult,
  SignContextParams,
  SignContextResult,
  SignRoundParams,
  SignRoundResult,
} from './mpc.types'
import {
  Call_ExtractMnemonicFromSignKey,
  Call_PrepareContextParams,
  Call_SetRandomSeed,
  KeyRefreshContextParams,
  PrepareContextResult,
} from './mpc.types'
import {
  int32ToUint8Array,
  stringToUint8Array,
  toHexString,
  uint8ArrayToInt32,
  uint8ArrayToString,
} from './mpcUtil'

let instance: MPCAssemblyBridge | null = null

class MPCAssemblyBridge {
  private readonly wasmInstance?: any

  readonly ssid = 'Safeheron_MPC_CMP'

  constructor(wasmInstance: WebAssembly.Instance) {
    this.wasmInstance = wasmInstance
    if (!instance) {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      instance = this
    }
    return instance
  }

  setupRandomSeed(): boolean {
    try {
      const buf = new Uint8Array(1024)
      const seed = crypto.getRandomValues(buf)
      return this.invokeWasmMethod<Call_SetRandomSeed>(
        '_SetSeed',
        toHexString(seed),
        8 * 1024,
        true,
      )
    } catch (e) {
      console.error('set random seed failed.', e)
      return false
    }
  }

  createContextGeneralParams(): PrepareContextResult {
    return this.invokeWasmMethod<Call_PrepareContextParams>(
      '_prepare_context',
      null,
      720 * 1024,
    )
  }

  extractMnemonicFromSignKey(signKey: string) {
    const params = { sign_key: signKey }
    return this.invokeWasmMethod<Call_ExtractMnemonicFromSignKey>(
      '_extract_mnemo_from_sign_key',
      params,
      64 * 1024,
    )
  }

  keyGenContextAndComputeRound(
    params: KeyGenContextParams,
  ): KeyGenContextResult {
    const keyGenParams = { ...params, ssid: this.ssid }
    return this.invokeWasmMethod<Call_KeyGenContextAndRound0>(
      '_kg_create_context_compute_round0',
      keyGenParams,
      720 * 1024,
    )
  }

  keyGenRound(params: KeyGenRoundParams) {
    return this.invokeWasmMethod<Call_KeyGenRound>(
      '_kg_compute_round1_3',
      params,
      720 * 1024,
    )
  }

  destroyKeyGenContexts() {
    this.wasmInstance._kg_destroy()
  }

  destroyKeyGenContextById(ctxId: number) {
    this.wasmInstance._kg_destroy_context(ctxId)
  }

  signContext(params: SignContextParams): SignContextResult {
    const signContextParams = { ...params, ssid: this.ssid }
    return this.invokeWasmMethod<Call_SignContextAndRound0>(
      '_sign_create_context_compute_round0',
      signContextParams,
      64 * 1024,
    )
  }

  signRound(params: SignRoundParams): SignRoundResult {
    return this.invokeWasmMethod<Call_SignRound>(
      '_sign_compute_round1_4',
      params,
      64 * 1024,
    )
  }

  destroySignContexts() {
    this.wasmInstance._sign_destroy()
  }

  destroySignContextById(ctxId: number) {
    this.wasmInstance._sign_destroy_context(ctxId)
  }

  generatePubAndZkp(mnemo: string): GeneratePubAndZkpResult {
    const params: GeneratePubAndZkpParams = {
      curve_type: 1,
      mnemo,
    }
    return this.invokeWasmMethod<Call_GeneratePubAndZkp>(
      '_generate_pub_zkp',
      params,
      10 * 1024,
    )
  }

  generateMinimalKey(
    params: GenerateMinimalKeyParams,
  ): GenerateMinimalKeyResult {
    return this.invokeWasmMethod<Call_GenerateMinimalKey>(
      '_generate_minimal_key',
      params,
      720 * 1024,
    )
  }

  keyRefreshContext(params: KeyRefreshContextParams): KeyRefreshContextResult {
    const keyRefreshParams = { ...params, ssid: this.ssid }
    return this.invokeWasmMethod<Call_KeyRefreshContext>(
      '_mkr_create_context_compute_round0',
      keyRefreshParams,
      720 * 1024,
    )
  }

  keyRefreshRound(params: KeyRefreshRoundParams): KeyRefreshRoundResult {
    return this.invokeWasmMethod<Call_KeyRefreshRound>(
      '_mkr_compute_round1_3',
      params,
      720 * 1024,
    )
  }

  destroyKeyRefreshContextById(ctxId: number) {
    return this.invokeWasmMethod<Call_DestroySingleContextForKeyRefresh>(
      '_mkr_destroy_context',
      ctxId,
      1024,
      true,
    )
  }

  createContextForKeyRecovery(params: KeyRecoveryParams) {
    return this.invokeWasmMethod<Call_KeyRecovery>(
      '_kr_create_context_compute_round0',
      params,
      64 * 1024,
    )
  }

  runRoundForKeyRecovery(params: KeyRecoveryRoundParams) {
    return this.invokeWasmMethod<Call_KeyRecoveryRound>(
      '_kr_compute_round1_3',
      params,
      64 * 1024,
    )
  }

  destroyKeyRecoveryContext() {
    return this.invokeWasmMethod('_kr_destroy', undefined, 0, true)
  }

  destroyKeyRecoveryContextById(contextId: number) {
    return this.invokeWasmMethod('_kr_destroy_context', contextId, 0, true)
  }

  aggregateKeyShard(
    partialShards: string[],
    X: string,
  ): AggregateKeyShardResult {
    const params: AggregateKeyShardParams = {
      partial_shards: partialShards,
      curve_type: 1,
      X,
    }
    return this.invokeWasmMethod<Call_AggregateKeyShard>(
      '_aggregate_partial_shard',
      params,
      1024,
    )
  }

  createKeyPair(): GenerateKeyPairResult {
    return this.invokeWasmMethod<Call_GenerateKeyPair>(
      '_generate_key_pair',
      2,
      1024,
    )
  }

  // TODO During the test, more than 1000k plaintext data encryption has a bug, which is basically determined to be related to memory operation, and the details of the problem are still being located
  encrypt(
    localPriv: string,
    remotePub: string,
    plain: string,
  ): AuthEncryptedResult {
    const params: AuthEncryptedParams = {
      local_priv: localPriv,
      remote_pub: remotePub,
      plain,
    }
    const byteArray = stringToUint8Array(JSON.stringify(params))
    const estimateResultSize = (byteArray.length + 300) * 2

    return this.invokeWasmMethod<Call_AuthEncrypted>(
      '_AuthEnc_encrypt',
      params,
      estimateResultSize,
    )
  }

  decrypt(
    localPriv: string,
    remotePub: string,
    cypher: string,
  ): AuthDecryptedResult {
    const params: AuthDecryptedParams = {
      local_priv: localPriv,
      remote_pub: remotePub,
      cypher,
    }

    const byteArray = stringToUint8Array(JSON.stringify(cypher))
    const estimateResultSize = byteArray.length

    return this.invokeWasmMethod<Call_AuthDecrypted>(
      '_AuthEnc_decrypt',
      params,
      estimateResultSize,
    )
  }

  sign(priv: string, digest: string): EcdsaSignResult {
    const params: EcdsaSignParams = { priv, digest }
    return this.invokeWasmMethod<Call_EcdsaSign>('_ecdsa_sign', params, 1024)
  }

  verify(pub: string, digest: string, sig: string): boolean {
    const params: EcdsaVerifyParams = { pub, digest, sig }
    return this.invokeWasmMethod<Call_EcdsaVerify>(
      '_ecdsa_verify',
      params,
      2 * 1024,
      true,
    )
  }

  private mallocByteBuffer(len: number): { ptr; uint8Array: Uint8Array } {
    const ptr = this.wasmInstance._malloc(len)
    return {
      ptr,
      uint8Array: new Uint8Array(this.wasmInstance.HEAPU8.buffer, ptr, len),
    }
  }

  /**
   * @param method  Wasm exported function method name
   * @param params  wasm exported function params
   * @param resultMemorySize  The maximum length of the function call result stored in the memory area, usually this length will be greater than the actual length used
   * @param plainOutput
   * @private
   */
  private invokeWasmMethod<T extends Call_type<C_Methods, any, any>>(
    method: T['method'],
    params: T['params'],
    resultMemorySize: number = 12 * 1024,
    plainOutput = false,
  ): T['result'] {
    let inputPtr, inputBuffer
    let wasmInvokeResult = -1

    const { ptr: outputPtr, uint8Array: outputBuffer } =
      this.mallocByteBuffer(resultMemorySize)

    const { ptr: outLenPtr, uint8Array: outLenBuff } = this.mallocByteBuffer(4)
    // Tell wasm how much space javascript allocates for output
    outLenBuff.set(int32ToUint8Array(resultMemorySize))

    console.time(`[Execute WASM]:(${method})`)
    if (Number.isInteger(params)) {
      wasmInvokeResult = this.wasmInstance[method](
        params,
        outputBuffer.byteOffset,
        outLenBuff.byteOffset,
      )
    } else if (!params) {
      wasmInvokeResult = this.wasmInstance[method](
        outputBuffer.byteOffset,
        outLenBuff.byteOffset,
      )
    } else {
      const inputData = stringToUint8Array(JSON.stringify(params))
      const inputSize = inputData.length

      const input = this.mallocByteBuffer(inputSize)
      inputBuffer = input.uint8Array
      inputPtr = input.ptr

      inputBuffer.set(inputData)
      wasmInvokeResult = this.wasmInstance[method](
        inputBuffer.byteOffset,
        inputData.byteLength,
        outputBuffer.byteOffset,
        outLenBuff.byteOffset,
      )
    }
    console.timeEnd(`[Execute WASM]:(${method})`)
    console.log(`WASM [${method}] execute result: ${wasmInvokeResult}`)

    // some method only return 0 for success, otherwise return other code
    if (plainOutput) {
      return wasmInvokeResult === 0
    }

    const outLen = uint8ArrayToInt32(outLenBuff)
    const outJsonString = uint8ArrayToString(outputBuffer, outLen)

    const copiedOutput = ''.concat(outJsonString)
    const outJson = JSON.parse(copiedOutput)

    inputPtr && this.wasmInstance._free(inputPtr)
    this.wasmInstance._free(outputPtr)
    this.wasmInstance._free(outLenPtr)

    return outJson as T['result']
  }
}

export default MPCAssemblyBridge
