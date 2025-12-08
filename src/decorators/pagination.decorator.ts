import { BadRequestException, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { pageSizes, PageSizeType, Pagination } from 'src/types/pagionation.type';

export const SwaggerPaginationDecorator = () => {
    return (
        target: any,
        propertyKey: string | symbol,
        descriptor: PropertyDescriptor,
    ) => {
        ApiQuery({ name: 'page', required: true, type: Number, example: 0, description: 'Page number (starts from 0)' })(
            target,
            propertyKey,
            descriptor,
        );
        ApiQuery({
            name: 'size',
            required: true,
            type: Number,
            example: 10,
            description: 'Page size (allowed values: 5, 10, 25, 50, 100, 500)',
            enum: pageSizes,
        })(target, propertyKey, descriptor);
    };
};

export const PaginationDecorator = createParamDecorator(
    (data, ctx: ExecutionContext): Pagination => {
        const req: Request = ctx.switchToHttp().getRequest();
        const page = parseInt(req.query.page as string) || 0;
        const size = parseInt(req.query.size as string) as PageSizeType;

        if (isNaN(page) || page < 0) {
            throw new BadRequestException('Invalid pagination params: page must be a non-negative integer');
        }

        if (isNaN(size) || !pageSizes.includes(size)) {
            throw new BadRequestException(
                `Invalid pagination params: size must be one of these values: ${pageSizes.join(', ')}`,
            );
        }

        const limit = size;
        const offset = page * limit;
        return { page, limit, size, offset };
    },
);
