import type { Config } from '@jest/types'
export default async (): Promise<Config.InitialOptions> => {
  return {
    verbose: true,
    testRegex: 'test.*.test.(js|ts|tsx)?$',
  }
}
