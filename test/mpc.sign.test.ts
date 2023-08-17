import { MPC } from '../src/index.node'
import { toHexString } from '../src/mpc-assembly/mpcUtil'
import { p1, p2 } from './mockData'
import readWasmFile, { filterMessage } from './readWasmFile'

describe('MPC Signer Test', function () {
  test('2/3 MPC Signer', async () => {
    const { wasmFile } = await readWasmFile()

    const mpc1 = await MPC.init(wasmFile)
    const mpc2 = await MPC.init(wasmFile)

    const signer1 = mpc1.Signer.getCoSigner()
    const signer2 = mpc2.Signer.getCoSigner()

    await signer1.setupLocalCpkp()
    await signer2.setupLocalCpkp()

    /**
     * This message will be an ethereum serialized transaction string
     * in actual business scenarios.
     */
    const message = toHexString(new Uint8Array(32).fill(1))

    let m1: any = await signer1.createContext(
      message,
      p1.signKey,
      [p1.party_id, p2.party_id],
      { partyId: p2.party_id, pub: signer2.localCommunicationPub },
    )
    let m2: any = await signer2.createContext(
      message,
      p2.signKey,
      [p1.party_id, p2.party_id],
      { partyId: p1.party_id, pub: signer1.localCommunicationPub },
    )

    let round = 0
    while (!(signer1.isComplete && signer2.isComplete)) {
      const res1 = await signer1.runRound(filterMessage(p1.party_id, ...m2))
      const res2 = await signer2.runRound(filterMessage(p2.party_id, ...m1))

      console.log('res round', round, m1)

      round++
      m1 = res1
      m2 = res2
    }

    console.log(signer1.getSignature())

    expect(signer1.getSignature()).toEqual(signer2.getSignature())
  })
})
