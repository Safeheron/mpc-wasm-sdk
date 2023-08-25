import { webcrypto } from 'crypto'

import { MPC } from '../src/index.node'
import { p1 } from './mockData'
import readWasmFile from './readWasmFile'

describe('WASM Util Function Test', () => {
  let mpcHelper: MPC['mpcHelper']

  beforeAll(async () => {
    const { wasmFile } = await readWasmFile()

    const mpcInstance = await MPC.init(wasmFile)
    mpcHelper = mpcInstance.mpcHelper

    const res = await mpcHelper.setupRandomSeed()
    expect(res).toBeTruthy()
  })

  test('Generate prepare data', async () => {
    const res = await mpcHelper.prepare()
    expect(res).toHaveProperty('prepared_context_params')
  })

  test('Extract mnemonic from signKey', async () => {
    const signKey = p1.signKey
    const res = await mpcHelper.extractMnemonicFromSignKey(signKey)

    expect(res).toEqual({
      mnemo:
        'assume ignore pass grass teach include boss february squeeze very jelly acid ball abstract picnic excess gown calm tag prosper winner spread history water',
    })
  })

  test('Generate key pair', async () => {
    const res = await mpcHelper.createKeyPair()

    expect(res).toHaveProperty('priv')
    expect(res).toHaveProperty('pub')
    expect(res.priv).not.toBeNull()
    expect(res.pub).not.toBeNull()
    console.log('res: ', res)
  })

  test('Encrypt and Decrypt', async () => {
    const localKeyPair = await mpcHelper.createKeyPair()
    const remoteKeyPair = await mpcHelper.createKeyPair()

    const testData = {
      '500B': 'hello world',
      '1k': 'hello worldhello worldhello worldhello worldhello world',
      '10k': 'hello worldhello worldhello worldhello world',
      '100k': 'hello worldhello worldhello world',
      '500k': 'hello worldhello worldhello worldhello worldhello w',
      '1M': 'hello worldhello worldhello worldhello worldhello worldhello worldhello world',
    }

    for await (const plainText of Object.values(testData)) {
      const encrypted = await mpcHelper.encrypt(
        localKeyPair.priv,
        remoteKeyPair.pub,
        plainText,
      )

      expect(encrypted).toHaveProperty('cypher')
      const decrypted = await mpcHelper.decrypt(
        remoteKeyPair.priv,
        localKeyPair.pub,
        encrypted.cypher,
      )

      expect(decrypted.plain).toEqual(plainText)
    }
  })

  test('Sign and Verify', async () => {
    const keypair = await mpcHelper.createKeyPair()

    console.log('keypair: ', keypair)

    const digest = '11111111111111111111'
    const sigRes = await mpcHelper.sign(keypair.priv, digest)

    console.log('sigRes: ', sigRes)

    expect(sigRes.sig).not.toBeNull()

    const validTrue = await mpcHelper.verify(keypair.pub, digest, sigRes.sig)
    expect(validTrue).toEqual(true)

    const validFalse = await mpcHelper.verify(keypair.pub, digest, '000000')
    expect(validFalse).toEqual(false)
  })
})
