import { NestFactory } from "@nestjs/core";
import { Module } from '@nestjs/common';
import { getWhere } from "./funcs";

@Module({
})
class AppModule { }

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    await app.listen(1000);

    const result = getWhere(
        [
            {
                isNested: false,
                property: 'name',
                rule: 'ilike',
                value: 'test'
            }
        ]
    )

    console.log(
        // @ts-ignore
        result.name,
        Object.keys(result)
    )
}

bootstrap();
