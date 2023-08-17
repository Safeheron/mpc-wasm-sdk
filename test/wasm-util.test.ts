import { webcrypto } from 'crypto'

import MPCAssemblyBridge from '../src/mpc-assembly/MPCAssemblyBridge'
import { p1, p2, p3 } from './mockData'
import { loadWebAssemblyInstance } from './readWasmFile'

describe('call wasm util function', () => {
  let assemblyBridge: MPCAssemblyBridge
  beforeAll(async () => {
    // @ts-ignore
    global.crypto = webcrypto
    // @ts-ignore
    global.window = {}

    const wasmInstance = await loadWebAssemblyInstance()
    assemblyBridge = new MPCAssemblyBridge(wasmInstance)

    const res = assemblyBridge.setupRandomSeed()
    expect(res).toBeTruthy()
  })

  test('set random seed', async () => {
    const res = assemblyBridge.setupRandomSeed()
    expect(res).toBeTruthy()
  })

  test('generate prepare params', async () => {
    const res = await assemblyBridge.createContextGeneralParams()
    expect(res).toHaveProperty('prepared_context_params')
  })

  test('extract mnemonic from signKey', async () => {
    const signKey = p1.signKey
    const res = await assemblyBridge.extractMnemonicFromSignKey(signKey)

    expect(res).toEqual({
      mnemo:
        'assume ignore pass grass teach include boss february squeeze very jelly acid ball abstract picnic excess gown calm tag prosper winner spread history water',
    })
  })

  test('generate key pair', async () => {
    const res = await assemblyBridge.createKeyPair()

    expect(res).toHaveProperty('priv')
    expect(res).toHaveProperty('pub')
    expect(res.priv).not.toBeNull()
    expect(res.pub).not.toBeNull()
    console.log('res: ', res)
  })

  test('encrypt and decrypt', async () => {
    const localKeyPair = await assemblyBridge.createKeyPair()
    const remoteKeyPair = await assemblyBridge.createKeyPair()

    const plainText = 'hello world'

    const encrypted = await assemblyBridge.encrypt(
      localKeyPair.priv,
      remoteKeyPair.pub,
      plainText,
    )

    expect(encrypted).toHaveProperty('cypher')
    console.log('encrypted:', encrypted)

    const decrypted = await assemblyBridge.decrypt(
      remoteKeyPair.priv,
      localKeyPair.pub,
      encrypted.cypher,
    )

    console.log('decrypted: ', decrypted)
    expect(decrypted.plain).toEqual(plainText)
  })

  test('sign and verify', async () => {
    const keypair = await assemblyBridge.createKeyPair()

    console.log('keypair: ', keypair)

    const digest = '11111111111111111111'
    const sigRes = await assemblyBridge.sign(keypair.priv, digest)

    console.log('sigRes: ', sigRes)

    expect(sigRes.sig).not.toBeNull()

    const validTrue = assemblyBridge.verify(keypair.pub, digest, sigRes.sig)
    expect(validTrue).toBeTruthy()

    const validFalse = assemblyBridge.verify(keypair.pub, digest, '000000')
    expect(validFalse).toBeFalsy()
  })
})
