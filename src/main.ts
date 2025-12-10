import { NestFactory } from "@nestjs/core";
import { Module } from '@nestjs/common';
import { showTest } from "./index"

@Module({
})
class AppModule { }

async function bootstrap() {
    showTest()
    const app = await NestFactory.create(AppModule);
    await app.listen(1000);

}

bootstrap();
