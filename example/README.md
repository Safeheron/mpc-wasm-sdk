# 2/3 MPC demo of DKG Protocol and Sign Protocol

## Disclaimer

This demo code is only used for trial. We shall not be liable for the
consequences of any act of using the code in this demo
in a production environment.

## Introduction

This is a JavaScript demo of {2,3}-threshold ECDSA. It relies on WebAssembly
which is compiled on [C++ implements](https://github.com/Safeheron/multi-party-ecdsa-cpp) including MPC CMP protocol.

⚠️⚠️⚠️ Since it is a trial demo, it currently only includes the MPC DKG protocol and
the MPC Sign protocol. The current demo runs the three-party MPC DKG,
which takes a long time (about 220 seconds) to run, please be patient for a while.
We are optimizing it 💪💪.

This demo contains four files:

- SafeheronCMP.wasm  WebAssembly implementation of the algorithm
- index.js  SDK of JavaScript
- index.html & demo.js  Sample code, with these two files, you can learn how to use the SDK

## How to run the demo

You can use your preferred tool that can serve a static site. e.g.

- [serve](https://github.com/vercel/serve)

```shell
npm install --global serve

serve -p 8080
```

- python2

```shell
python -m SimpleHTTPServer 8000
```

- python3

```shell
python -m http.server 8000
```

We recommend that you run the demo on the Chrome browser locally.

## Usage

You can find the SDK usage in demo.js.

1. We need to instantiate an MPC instance

```javascript
const mpc = await window.MPC.init('SafeheronCMP.wasm')
```

2. Minimal Key Generation

```javascript
const keyGen = mpc.KeyGen.getCoSigner()


const party = keyGen.createParty(CUSTOM_PARTY_ID)
let message = keyGen.createContext([REMOTE_PARTY_1, REMOTE_PARTY_2])


// Run multi-round compute, at the end we can get secret share
while(!keyGen.isComplete){
 message = keyGen.runRound(REMOTE_ROUND_MESSAGE_FROM_OTHER_PARTIES)
}


console.log('minimalKey: ', message)
```

3. Auxiliary Info and Key Refresh

```javascript
const keyRefresh = mpc.KeyRefresh.getCoSigner()

// MINIMAL_KEY is the result of the previous step
let message = keyRefresh.createContext(MINIMAL_KEY)


// Run multi-round compute, at the end, we can get a secret share which can be used
// to execute the MPC protocol "Sign".
while(!keyRefresh.isComplete){
 message = keyRefresh.runRound(REMOTE_ROUND_MESSAGE_FROM_OTHER_PARTIES)
}


// !!! Important. SignKey needs to be stored safely, don't leak it.
console.log('signKey: ', message)
```

4. Sign

```javascript


// This will be the message we are going to sign
const messageToBeSign =
 '0101010101010101010101010101010101010101010101010101010101010101'


const signer = mpc.Sign.getCoSigner(messageToBeSign)

// SIGN_KEY is the result of the previous step
let message = signer.createContext(SIGN_KEY, [PARTY_ID_ONE, PARTY_ID_ANOTHER])


// Run multi-round compute, at the end we will get the signature.
while(!signer.isComplete){
 message = signer.runRound(REMOTE_ROUND_MESSAGE_FROM_OTHER_PARTIES)
}


console.log('signature: ', message)
```
