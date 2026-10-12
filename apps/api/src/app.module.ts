import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ConfigModule } from '@nestjs/config'
import { DatabaseModule } from './infrastructure/database/database.module.js'
import { StorageModule } from './infrastructure/storage/storage.module.js'
import { AiInfraModule } from './infrastructure/ai/ai.module.js'
import { TranscriptionModule } from './infrastructure/transcription/transcription.module.js'
import { UsersModule } from './modules/users/users.module.js'
import { DocumentsModule } from './modules/documents/documents.module.js'
import { FilesModule } from './modules/files/files.module.js'
import { AiModule } from './modules/ai/ai.module.js'
import { CitationsModule } from './modules/citations/citations.module.js'
import { CollabModule } from './modules/collab/collab.module.js'
import { HealthController } from './modules/health/health.controller.js'
import { AuthGuard } from './auth/auth.guard.js'

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
    CitationsModule,
    CollabModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
})
export class AppModule {}
