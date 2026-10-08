import { Global, Module } from '@nestjs/common'
import { ModelProvider } from './model.provider.js'

@Global()
@Module({
  providers: [ModelProvider],
  exports: [ModelProvider],
})
export class AiInfraModule {}
