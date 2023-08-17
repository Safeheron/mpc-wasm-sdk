import MPC from '../../src/webview/mpc.client.webview'

describe('Instantiate a webview client instance', () => {
  test('create a proxy instance successful', () => {
    const mpc = MPC.init({})

    expect(mpc).toHaveProperty('onMessageCallback')
  })
})
