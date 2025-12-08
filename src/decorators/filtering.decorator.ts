import { BadRequestException, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { FilteringInterface, FilteringRulesEnum } from 'src/types/filtering.type';

export const SwaggerFilteringDecorator = (validParams: string[]) => {
    return (
        target: any,
        propertyKey: string | symbol,
        descriptor: PropertyDescriptor,
    ) => {
        const filterExamples = validParams
            .map(param => Object.values(FilteringRulesEnum).map(rule => `${param}:${rule}:X`))
            .flat();

        ApiQuery({
            name: 'filter',
            required: false,
            type: String,
            example: filterExamples.join('|'),
            description: `<b>Filtering parameters in the format 'property:rule:value' (value is optional for isnull/isnotnull). Valid properties:</b> ${validParams.join(', ')}. <b>Valid rules:</b> ${Object.values(FilteringRulesEnum).join(', ')}`,
        })(target, propertyKey, descriptor);
    };
};

export const FilteringDecorator = createParamDecorator((validParams: string[], ctx: ExecutionContext): FilteringInterface[] => {
    const req: Request = ctx.switchToHttp().getRequest();
    const filter = req.query.filter as string;

    if (!filter) return [];

    // Ensure validParams is an array
    if (!Array.isArray(validParams)) throw new BadRequestException('Invalid filter parameter');

    const filterKeyValues = filter.split('|');
    const filters: FilteringInterface[] = [];

    for (const filterKeyValue of filterKeyValues) {
        // Validate the format
        const pattern = /^[a-zA-Z0-9_.]+:(eq|neq|gt|gte|lt|lte|like|nlike|in|nin|isnull|isnotnull|between)(:[+a-zA-Z0-9_,@:.\\-]+)?$/;
        if (!filterKeyValue.match(pattern)) {
            throw new BadRequestException('Invalid filter parameter format');
        }

        let splittedParts = filterKeyValue.split(':');
        if (splittedParts.length > 3) {
            splittedParts = [splittedParts[0], splittedParts[1], splittedParts.slice(2).join(':')]
        }

        const [property, rule, value] = splittedParts

        // Validate property name
        if (!validParams.includes(property)) throw new BadRequestException(`Invalid filter property: ${property}`);

        // Validate rule name
        if (!Object.values(FilteringRulesEnum).includes(rule as FilteringRulesEnum)) throw new BadRequestException(`Invalid filter rule: ${rule}`);

        // Push the filter object
        const isNested = property.includes('.')
        // const [nestedObject, nestedProperty] = property.split('.')


        filters.push({ property, rule, value, isNested });
    }

    return filters;
});