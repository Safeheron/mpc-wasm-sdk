import { ComputeMessage } from '../mpc-assembly/mpc.types'
import { PromisedMPCAssemblyBridge } from '../utils/types'

export type KeyPair = { priv: string; pub: string }

export abstract class AbstractCoSigner {
  protected readonly mpcAssemblyBridge: PromisedMPCAssemblyBridge

  protected contextId: number
  protected lastRoundIndex = 0

  isComplete = false

  // Communication keypair
  protected localCpkp: KeyPair

  // Communication public keys of remote parties
  protected remoteCpks: Record<string, string> = {}

  constructor(mpcBridge: PromisedMPCAssemblyBridge) {
    this.mpcAssemblyBridge = mpcBridge
  }

  get localCommunicationPriv() {
    return this.localCpkp.priv
  }

  get localCommunicationPub() {
    return this.localCpkp.pub
  }

  get isContextCreated() {
    return Boolean(this.contextId)
  }

  get lastIndex() {
    return this.lastRoundIndex
  }

  async setupLocalCpkp(keypair?: KeyPair) {
    if (keypair && keypair.priv && keypair.pub) {
      this.localCpkp = keypair
      return
    }
    const result = await this.mpcAssemblyBridge.createKeyPair()
    if (result.err) throw result.err

    this.localCpkp = {
      priv: result.priv,
      pub: result.pub,
    }
  }

  addRemoteCpk(partyId: string, pub: string) {
    this.remoteCpks[partyId] = pub
  }

  getRemoteCpk(partyId: string) {
    return this.remoteCpks[partyId]
  }

  checkCommunicationKey() {
    if (!this.localCpkp) {
      throw `Local Communication keypair not exist.`
    }
  }

  async decryptMPCMessage(
    mpcMessages: ComputeMessage[],
  ): Promise<ComputeMessage[]> {
    if (!mpcMessages || mpcMessages.length === 0) {
      return mpcMessages
    }

    const result: ComputeMessage[] = []

    for await (const message of mpcMessages) {
      const remotePub = this.getRemoteCpk(message.source)
      const decryptedP2PMessage = await this.decryptAsNeeded(
        message.p2p_message,
        remotePub,
      )
      const decryptedBroadcastMessage = await this.decryptAsNeeded(
        message.broadcast_message,
        remotePub,
      )
      result.push({
        ...message,
        p2p_message: decryptedP2PMessage,
        broadcast_message: decryptedBroadcastMessage,
      })
    }

    return result
  }

  async encryptMPCMessage(
    mpcMessages: ComputeMessage[],
  ): Promise<ComputeMessage[]> {
    if (!mpcMessages || mpcMessages.length === 0) {
      return mpcMessages
    }

    const result: ComputeMessage[] = []

    for await (const message of mpcMessages) {
      const remotePub = this.getRemoteCpk(message.destination)
      const encryptedP2PMessage = await this.encryptAsNeeded(
        message.p2p_message,
        remotePub,
      )
      const encryptedBroadcastMessage = await this.encryptAsNeeded(
        message.broadcast_message,
        remotePub,
      )
      result.push({
        ...message,
        p2p_message: encryptedP2PMessage,
        broadcast_message: encryptedBroadcastMessage,
      })
    }
    return result
  }

  private async encryptAsNeeded(message: string, pub: string) {
    if (!message) return message

    const result = await this.mpcAssemblyBridge.encrypt(
      this.localCpkp.priv,
      pub,
      message,
    )

    if (result.err) throw result.err

    return result.cypher
  }

  private async decryptAsNeeded(message: string, pub: string) {
    if (!message) return message
    const result = await this.mpcAssemblyBridge.decrypt(
      this.localCpkp.priv,
      pub,
      message,
    )

    if (result.err) throw result.err

    return result.plain
  }
}
