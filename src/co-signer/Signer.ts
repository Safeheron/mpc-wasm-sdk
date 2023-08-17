import {
  ComputeMessage,
  SignContextParams,
  SignRoundParams,
  SignRoundResult,
} from '../mpc-assembly/mpc.types'
import { AbstractCoSigner } from './AbstractCoSigner'

export class Signer extends AbstractCoSigner {
  private message: string

  private signature: SignRoundResult['signature']

  getSignature() {
    return this.signature
  }

  async createContext(
    message: string,
    signKey: string,
    participantsPartyIds: string[],
    remotePub: { partyId: string; pub: string },
  ): Promise<ComputeMessage[]> {
    this.checkCommunicationKey()
    this.addRemoteCpk(remotePub.partyId, remotePub.pub)

    this.message = message
    const params: SignContextParams = {
      participants: participantsPartyIds,
      pending_message: this.message,
      sign_key: signKey,
    }
    const contextResult = await this.mpcAssemblyBridge.signContext(params)

    if (contextResult.err) {
      throw new Error(
        `Create sign context occur an error:
        code: ${contextResult.err.err_code}, message: ${contextResult.err.err_msg} `,
      )
    }

    this.contextId = contextResult.context

    return await this.encryptMPCMessage(contextResult.out_message_list)
  }

  async runRound(
    remoteMessageList: ComputeMessage[],
  ): Promise<ComputeMessage[]> {
    remoteMessageList = await this.decryptMPCMessage(remoteMessageList)

    const params: SignRoundParams = {
      context: this.contextId,
      last_round_index: this.lastRoundIndex,
      in_message_list: remoteMessageList,
    }

    const roundResult = await this.mpcAssemblyBridge.signRound(params)

    this.lastRoundIndex++
    if (roundResult.err) {
      throw new Error(
        `sign round: [${this.lastRoundIndex}] occur an error:
        code: ${roundResult.err.err_code}, message: ${roundResult.err.err_msg} `,
      )
    }

    const isComplete = !!roundResult.signature

    if (isComplete) {
      this.isComplete = true
      this.signature = roundResult.signature
      await this.destroy()
    }

    return await this.encryptMPCMessage(roundResult.out_message_list)
  }

  private async destroy() {
    await this.mpcAssemblyBridge.destroySignContextById(this.contextId)
    this.contextId = 0
    this.lastRoundIndex = 0
  }
}
