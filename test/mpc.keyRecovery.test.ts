import { MPC } from '../src/index.node'
import readWasmFile from './readWasmFile'

describe('MPC Key Recovery test', function () {
  test('2/3 MPC Key Recovery', async () => {
    const party1 = {
      party_id: 'A',
      index: '1',
    }
    const party2 = {
      party_id: 'B',
      index: '2',
    }
    const party3 = {
      party_id: 'C',
      index: '3',
    }

    const mnemo1 =
      'velvet dust fan enforce okay pulp coyote buffalo left rely extend panic unveil dirt kidney frame loyal lock biology hole grain clip grape this'
    const mnemo2 =
      'sail bar inherit clinic labor enough bone potato caution swing film enhance hurdle inmate grab away reveal slab gadget thrive law imitate soap ankle'
    const mnemo3 =
      'mechanic they network around future trick absurd critic ski actor fortune vocal vague prepare exotic session unaware bar poem fiber north response cube common'

    const { wasmFile } = await readWasmFile()

    console.time('KeyRecovery')

    const mpc1 = await MPC.init(wasmFile)
    const mpc2 = await MPC.init(wasmFile)

    const recovery1 = mpc1.KeyRecovery.getCoSigner()
    const recovery2 = mpc2.KeyRecovery.getCoSigner()

    await recovery1.setupLocalCpkp()
    await recovery2.setupLocalCpkp()

    const { priv: lostPartyPriv, pub: lostPartyPub } =
      await mpc1.mpcHelper.createKeyPair()

    let [m1, m2] = await Promise.all([
      recovery1.createContext({
        localMnemonic: mnemo1,
        localParty: {
          partyId: party1.party_id,
          index: party1.index,
        },
        remoteParty: {
          partyId: party2.party_id,
          index: party2.index,
          pub: recovery2.localCommunicationPub,
        },
        lostParty: {
          partyId: party3.party_id,
          index: party3.index,
          pub: lostPartyPub,
        },
      }),
      recovery2.createContext({
        localMnemonic: mnemo2,
        localParty: {
          partyId: party2.party_id,
          index: party2.index,
        },
        remoteParty: {
          partyId: party1.party_id,
          index: party1.index,
          pub: recovery1.localCommunicationPub,
        },
        lostParty: {
          partyId: party3.party_id,
          index: party3.index,
          pub: lostPartyPub,
        },
      }),
    ])

    while (!recovery1.isComplete && !recovery2.isComplete) {
      ;[m1, m2] = await Promise.all([
        recovery1.runRound(m2),
        recovery2.runRound(m1),
      ])
    }

    const X1 = recovery1.pubKeyOfThreeParty
    const X2 = recovery2.pubKeyOfThreeParty

    expect(X1).toEqual(X2)

    const pub1 = recovery1.pub
    const pub2 = recovery2.pub

    expect(pub1).toEqual(pub2)

    const s1 = await recovery1.getEncryptedPartySecretKey()
    const s2 = await recovery2.getEncryptedPartySecretKey()

    console.log('X>>>', X1)
    console.log('pub>>>', pub1)
    console.log('party secret>>>', s1, s2)

    const { plain: decryptedS1 } = await mpc1.mpcHelper.decrypt(
      lostPartyPriv,
      recovery1.localCommunicationPub,
      s1,
    )
    const { plain: decryptedS2 } = await mpc1.mpcHelper.decrypt(
      lostPartyPriv,
      recovery2.localCommunicationPub,
      s2,
    )

    const thirdMnemo = await mpc1.mpcHelper.aggregateKeyShard(
      [decryptedS1, decryptedS2],
      X1,
    )

    console.log('thirdMnemo', thirdMnemo.mnemo)

    expect(thirdMnemo.mnemo).toEqual(mnemo3)
    console.timeEnd('KeyRecovery')
  })
})
