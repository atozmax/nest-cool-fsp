import { BadRequestException, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { Sorting } from '../types';

export const SwaggerSortingDecorator = (validParams: string[]) => {
    return (
        target: any,
        propertyKey: string | symbol,
        descriptor: PropertyDescriptor,
    ) => {
        const allValidParams = validParams
            .map(val => {
                return [`${val}:asc`, `${val}:desc`]
            })
            .flat()

        ApiQuery({
            name: 'sort',
            required: false,
            type: String,
            example: allValidParams.join(','),
            description: `<b>Sorting parameter in the format 'property:direction' where direction is 'asc' or 'desc'. Valid properties</b>: ${allValidParams.join(', ')}`,
        })(target, propertyKey, descriptor);
    };
};

export const SortingDecorator = createParamDecorator((validParams: string[], ctx: ExecutionContext): Sorting[] => {
    const req: Request = ctx.switchToHttp().getRequest();
    const sort = req.query.sort as string;
    if (!sort) return [];

    // check if the valid params sent is an array
    if (!Array.isArray(validParams)) throw new BadRequestException('Invalid sort parameter');

    const sortKeyValues = sort.split(',')

    const sortings: Sorting[] = []

    for (const sortKeyValue of sortKeyValues) {

        // check the format of the sort query param
        const sortPattern = /^([a-zA-Z0-9]+):(asc|desc)$/;
        if (!sortKeyValue.match(sortPattern)) throw new BadRequestException('Invalid sort parameter');

        // extract the property name and direction and check if they are valid
        const [property, direction] = sortKeyValue.split(':');

        if (!validParams.includes(property)) throw new BadRequestException(`Invalid sort property: ${property}`);

        sortings.push({ property, direction: direction.toLowerCase() })
    }

    return sortings;
});
