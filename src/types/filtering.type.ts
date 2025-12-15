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
    NOT_LIKE = 'nlike',
    IN = 'in',
    NOT_IN = 'nin',
    IS_NULL = 'isnull',
    IS_NOT_NULL = 'isnotnull',
    BETWEEN = 'between',
}

export type availableOrms = 'typeorm' | 'sequelize' | 'mongoose';

export enum availableOrmEnum {
    typeorm = 'typeorm',
    sequelize = 'sequelize',
    mongoose = 'mongoose'
}

export interface WhereOptions {
    orm?: availableOrms;
}