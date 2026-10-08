import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { DatabaseModule } from './infrastructure/database/database.module.js'
import { StorageModule } from './infrastructure/storage/storage.module.js'
import { AiInfraModule } from './infrastructure/ai/ai.module.js'
import { TranscriptionModule } from './infrastructure/transcription/transcription.module.js'
import { UsersModule } from './modules/users/users.module.js'
import { DocumentsModule } from './modules/documents/documents.module.js'
import { FilesModule } from './modules/files/files.module.js'
import { AiModule } from './modules/ai/ai.module.js'
import { CollabModule } from './modules/collab/collab.module.js'
import { HealthController } from './modules/health/health.controller.js'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    StorageModule,
    AiInfraModule,
    TranscriptionModule,
    UsersModule,
    DocumentsModule,
    FilesModule,
    AiModule,
    CollabModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
