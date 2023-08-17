function filterMessage(targetPartyId, ...messageList) {
  return messageList.filter((m) => m.destination === targetPartyId)
}

const workerSDKJSPath = '../lib/mpc-worker-sdk.js'
async function getKeyGenInstance(useWorker) {
  let keyGenP1, keyGenP2, keyGenP3
  if (useWorker) {
    const mpc1 = await window.WorkerMPC.init(workerSDKJSPath)
    const mpc2 = await window.WorkerMPC.init(workerSDKJSPath)
    const mpc3 = await window.WorkerMPC.init(workerSDKJSPath)

    // ----------- Get three Participant for key gen--------------
    keyGenP1 = mpc1.KeyGen.getCoSigner()
    keyGenP2 = mpc2.KeyGen.getCoSigner()
    keyGenP3 = mpc3.KeyGen.getCoSigner()
  } else {
    const mpc = await window.MPC.init('SafeheronCMP.wasm')

    // ----------- Get three Participant for key gen--------------
    keyGenP1 = mpc.KeyGen.getCoSigner()
    keyGenP2 = mpc.KeyGen.getCoSigner()
    keyGenP3 = mpc.KeyGen.getCoSigner()
  }
  return { keyGenP1, keyGenP2, keyGenP3 }
}

async function runKeyGenTest(useWorker) {
  const { keyGenP1, keyGenP2, keyGenP3 } = await getKeyGenInstance(useWorker)

  // ----------- Create each party --------------
  const party1 = await keyGenP1.createParty('party1')
  const party2 = await keyGenP2.createParty('party2')
  const party3 = await keyGenP3.createParty('party3')

  console.log(
    '================== parties ==================\n',
    party1,
    party2,
    party3,
  )

  await keyGenP1.setupLocalCpkp()
  await keyGenP2.setupLocalCpkp()
  await keyGenP3.setupLocalCpkp()

  const p1Pub = keyGenP1.localCommunicationPub
  const p2Pub = keyGenP2.localCommunicationPub
  const p3Pub = keyGenP3.localCommunicationPub

  console.time('DKG')

  // Create Context
  let [m1, m2, m3] = await Promise.all([
    keyGenP1.createContext([
      { ...party2, pub: p2Pub },
      { ...party3, pub: p3Pub },
    ]),
    keyGenP2.createContext([
      { ...party1, pub: p1Pub },
      { ...party3, pub: p3Pub },
    ]),
    keyGenP3.createContext([
      { ...party1, pub: p1Pub },
      { ...party2, pub: p2Pub },
    ]),
  ])

  // Run MPC Round
  const isKeyGenComplete = () =>
    keyGenP1.isComplete && keyGenP2.isComplete && keyGenP3.isComplete
  while (!isKeyGenComplete()) {
    ;[m1, m2, m3] = await Promise.all([
      keyGenP1.runRound(filterMessage(party1.party_id, ...m2, ...m3)),
      keyGenP2.runRound(filterMessage(party2.party_id, ...m1, ...m3)),
      keyGenP3.runRound(filterMessage(party3.party_id, ...m1, ...m2)),
    ])
  }

  const [signKey1, signKey2, signKey3] = [
    keyGenP1.getSignKey(),
    keyGenP2.getSignKey(),
    keyGenP3.getSignKey(),
  ]
  const pubKey = keyGenP1.getPubKey()

  console.log(`========  sign keys begin ==========`)
  console.log('signKey1>>>', signKey1)
  console.log('signKey2>>>', signKey2)
  console.log('signKey3>>>', signKey3)
  console.log(`========  sign keys end ==========`)

  console.log('pub-key>>>', pubKey)

  console.timeEnd('DKG')
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function runSignTest(useWorker) {
  const signKey1Input = document.getElementById('signKeyInput1')
  const signKey2Input = document.getElementById('signKeyInput2')
  const partyId1Input = document.getElementById('party1Input')
  const partyId2Input = document.getElementById('party2Input')

  const signKey1 = signKey1Input.value
  const signKey2 = signKey2Input.value

  const partyId1 = partyId1Input.value
  const partyId2 = partyId2Input.value

  console.time('MPC_SIGN')
  const message =
    '0101010101010101010101010101010101010101010101010101010101010101'

  let signerP1, signerP2
  if (useWorker) {
    const mpc1 = await window.WorkerMPC.init(workerSDKJSPath)
    const mpc2 = await window.WorkerMPC.init(workerSDKJSPath)

    signerP1 = mpc1.Signer.getCoSigner()
    signerP2 = mpc2.Signer.getCoSigner()
  } else {
    const mpc = await window.MPC.init('SafeheronCMP.wasm')
    signerP1 = mpc.Signer.getCoSigner()
    signerP2 = mpc.Signer.getCoSigner()
  }

  await signerP1.setupLocalCpkp()
  await signerP2.setupLocalCpkp()

  // ----------- Create each sign context --------------
  const participants = [partyId1, partyId2]
  let [sm1, sm2] = await Promise.all([
    signerP1.createContext(message, signKey1, participants, {
      partyId: partyId2,
      pub: signerP2.localCommunicationPub,
    }),
    signerP2.createContext(message, signKey2, participants, {
      partyId: partyId1,
      pub: signerP1.localCommunicationPub,
    }),
  ])

  // ----------- Switch each message and run sign round --------------
  const isSignComplete = () => signerP1.isComplete && signerP2.isComplete
  while (!isSignComplete()) {
    ;[sm1, sm2] = await Promise.all([
      signerP1.runRound(filterMessage(partyId1, ...sm2)),
      signerP2.runRound(filterMessage(partyId2, ...sm1)),
    ])
  }

  console.log(
    '=================signature============ \n',
    signerP1.getSignature(),
    signerP2.getSignature(),
  )
  console.timeEnd('MPC_SIGN')
}

async function runRecoverTest(useWorker) {
  let wmpc1, wmpc2, wmpc3
  const mpc = await window.MPC.init('SafeheronCMP.wasm')
  if (useWorker) {
    wmpc1 = await window.WorkerMPC.init(workerSDKJSPath)
    wmpc2 = await window.WorkerMPC.init(workerSDKJSPath)
    wmpc3 = await window.WorkerMPC.init(workerSDKJSPath)
  }

  const element1 = document.getElementById('recovery1')
  const element2 = document.getElementById('recovery2')
  const element3 = document.getElementById('recovery3')
  const party1 = {
    party_id: element1.querySelector('.partyId').innerHTML,
    index: element1.querySelector('.partyIndex').innerHTML,
  }
  const party2 = {
    party_id: element2.querySelector('.partyId').innerHTML,
    index: element2.querySelector('.partyIndex').innerHTML,
  }
  const party3 = {
    party_id: element3.querySelector('.partyId').innerHTML,
    index: element3.querySelector('.partyIndex').innerHTML,
  }

  const mnemo1 = element1.querySelector('.mnemo').innerHTML
  const mnemo2 = element2.querySelector('.mnemo').innerHTML

  console.time('========Recovery========')
  let recovery1, recovery2

  if (useWorker) {
    recovery1 = wmpc1.KeyRecovery.getCoSigner()
    recovery2 = wmpc2.KeyRecovery.getCoSigner()
  } else {
    recovery1 = mpc.KeyRecovery.getCoSigner()
    recovery2 = mpc.KeyRecovery.getCoSigner()
  }

  await recovery1.setupLocalCpkp()
  await recovery2.setupLocalCpkp()

  const { priv: lostPartyPriv, pub: lostPartyPub } =
    await mpc.mpcHelper.createKeyPair()

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

  const s1 = await recovery1.getEncryptedPartySecretKey()
  const s2 = await recovery2.getEncryptedPartySecretKey()

  const { plain: decryptedS1 } = await mpc.mpcHelper.decrypt(
    lostPartyPriv,
    recovery1.localCommunicationPub,
    s1,
  )
  const { plain: decryptedS2 } = await mpc.mpcHelper.decrypt(
    lostPartyPriv,
    recovery2.localCommunicationPub,
    s2,
  )

  let thirdMnemo, keyRefresh1, keyRefresh2, keyRefresh3

  thirdMnemo = await mpc.mpcHelper.aggregateKeyShard(
    [decryptedS1, decryptedS2],
    X1,
  )
  if (useWorker) {
    keyRefresh1 = await wmpc1.KeyRefresh.getCoSigner()
    keyRefresh2 = await wmpc2.KeyRefresh.getCoSigner()
    keyRefresh3 = await wmpc3.KeyRefresh.getCoSigner()
  } else {
    keyRefresh1 = await mpc.KeyRefresh.getCoSigner()
    keyRefresh2 = await mpc.KeyRefresh.getCoSigner()
    keyRefresh3 = await mpc.KeyRefresh.getCoSigner()
  }

  console.timeEnd('========Recovery========')

  await keyRefresh1.setupLocalCpkp()
  await keyRefresh2.setupLocalCpkp()
  await keyRefresh3.setupLocalCpkp()

  console.log('thirdMnemo', thirdMnemo)

  console.time('========= Refresh ============')
  const [pubAndZkp1, pubAndZkp2, pubAndZkp3] = await Promise.all([
    keyRefresh1.generatePubAndZkp(mnemo1),
    keyRefresh2.generatePubAndZkp(mnemo2),
    keyRefresh3.generatePubAndZkp(thirdMnemo.mnemo),
  ])

  await Promise.all([
    keyRefresh1.generateMinimalKey(
      party1,
      [
        { ...party2, ...pubAndZkp2 },
        { ...party3, ...pubAndZkp3 },
      ],
      [
        { partyId: party2.party_id, pub: keyRefresh2.localCommunicationPub },
        { partyId: party3.party_id, pub: keyRefresh3.localCommunicationPub },
      ],
    ),
    keyRefresh2.generateMinimalKey(
      party2,
      [
        { ...party1, ...pubAndZkp1 },
        { ...party3, ...pubAndZkp3 },
      ],
      [
        { partyId: party1.party_id, pub: keyRefresh1.localCommunicationPub },
        { partyId: party3.party_id, pub: keyRefresh3.localCommunicationPub },
      ],
    ),
    keyRefresh3.generateMinimalKey(
      party3,
      [
        { ...party2, ...pubAndZkp2 },
        { ...party1, ...pubAndZkp1 },
      ],
      [
        { partyId: party1.party_id, pub: keyRefresh1.localCommunicationPub },
        { partyId: party2.party_id, pub: keyRefresh2.localCommunicationPub },
      ],
    ),
  ])

  let [nm1, nm2, nm3] = await Promise.all([
    keyRefresh1.createContext(),
    keyRefresh2.createContext(),
    keyRefresh3.createContext(),
  ])

  while (
    !(
      keyRefresh1.isComplete &&
      keyRefresh2.isComplete &&
      keyRefresh3.isComplete
    )
  ) {
    ;[nm1, nm2, nm3] = await Promise.all([
      keyRefresh1.runRound(filterMessage(party1.party_id, ...nm2, ...nm3)),
      keyRefresh2.runRound(filterMessage(party2.party_id, ...nm1, ...nm3)),
      keyRefresh3.runRound(filterMessage(party3.party_id, ...nm2, ...nm1)),
    ])
  }

  const pubKey1 = keyRefresh1.getPub()
  const pubKey2 = keyRefresh2.getPub()
  const pubKey3 = keyRefresh3.getPub()

  console.timeEnd('========= Refresh ============')

  console.log('pubkeys>>>', pubKey1, pubKey2, pubKey3)
}
