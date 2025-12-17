export interface FilteringInterface {
    property: string;
    rule: string;
    value: string;
    isNested: boolean;
}

export enum FilteringRulesEnum {
    EQUALS = 'eq',
    NOT_EQUALS = 'neq',
    GREATER_THAN = 'gt',
    GREATER_THAN_OR_EQUALS = 'gte',
    LESS_THAN = 'lt',
    LESS_THAN_OR_EQUALS = 'lte',
    LIKE = 'like',
    ILIKE = 'ilike',

    NOT_LIKE = 'nlike',
    NOT_ILIKE = 'nilike',

    IN = 'in',
    NOT_IN = 'nin',
    IS_NULL = 'isnull',
    IS_NOT_NULL = 'isnotnull',
    BETWEEN = 'between',

    STARTS_WITH = 'sw',
    ENDS_WITH = 'ew',
    ISTARTS_WITH = 'isw',
    IENDS_WITH = 'iew',

    NOT_STARTS_WITH = 'nsw',
    NOT_ENDS_WITH = 'new',
    NOT_ISTARTS_WITH = 'nisw',
    NOT_IENDS_WITH = 'niew',
}

export type availableOrms = 'typeorm' | 'sequelize' | 'mongoose';

export enum availableOrmEnum {
    typeorm = 'typeorm',
    sequelize = 'sequelize',
    mongoose = 'mongoose'
}

export interface WhereOptions {
    orm?: availableOrms;
    dateFields: string[];
}

export const FILTERING_RULES_STRING = Object.values(FilteringRulesEnum).join('|');
