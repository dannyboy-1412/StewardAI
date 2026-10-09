import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module.js'
import { CollabService } from './modules/collab/collab.service.js'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: true })
  const origins = (process.env.WEB_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  app.enableCors({
    origin: origins,
    credentials: true,
  })
  app.enableShutdownHooks()

  const port = Number(process.env.PORT ?? 4000)
  await app.listen(port)
  const httpServer = app.getHttpServer()
  app.get(CollabService).attach(httpServer)
  console.log(`PenPal AI API listening on ${port}`)
}

bootstrap()
