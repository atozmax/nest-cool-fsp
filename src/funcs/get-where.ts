import { IsNull, Not, LessThan, LessThanOrEqual, MoreThan, MoreThanOrEqual, ILike, In, Between, Like } from "typeorm";
import { availableOrmEnum, FilteringInterface, FilteringRulesEnum, WhereOptions } from '../types'
import { Op } from "sequelize";

export function getWhere(
    filters: FilteringInterface[],
    options?: WhereOptions
) {
    const { orm = availableOrmEnum.typeorm, dateFields = [] } = options || {}

    const buildValueFunction = getOrmBuildFunction(typeof orm === 'string' ? availableOrmEnum[orm] : orm)
    const combinedRules = {};

    for (const filter of filters) {
        getFilters(buildValueFunction, combinedRules, filter, dateFields)
    }

    return combinedRules;
};

const buildTypeOrmFilters = (property: string, rule: string, value: string, filterValue: string | Date, isDateField: boolean) => {
    switch (rule) {
        case FilteringRulesEnum.IS_NULL:
            return IsNull();
        case FilteringRulesEnum.IS_NOT_NULL:
            return Not(IsNull());
        case FilteringRulesEnum.EQUALS:
            return filterValue;
        case FilteringRulesEnum.NOT_EQUALS:
            return Not(filterValue);
        case FilteringRulesEnum.GREATER_THAN:
            return MoreThan(filterValue);
        case FilteringRulesEnum.GREATER_THAN_OR_EQUALS:
            return MoreThanOrEqual(filterValue);
        case FilteringRulesEnum.LESS_THAN:
            return LessThan(filterValue);
        case FilteringRulesEnum.LESS_THAN_OR_EQUALS:
            return LessThanOrEqual(filterValue);
        case FilteringRulesEnum.LIKE:
            return Like(`%${value}%`);
        case FilteringRulesEnum.ILIKE:
            return ILike(`%${value}%`);
        case FilteringRulesEnum.NOT_LIKE:
            return Not(ILike(`%${value}%`));
        case FilteringRulesEnum.NOT_ILIKE:
            return Not(Like(`%${value}%`));
        case FilteringRulesEnum.STARTS_WITH:
            return Like(`${value}%`);
        case FilteringRulesEnum.ISTARTS_WITH:
            return ILike(`${value}%`);
        case FilteringRulesEnum.NOT_STARTS_WITH:
            return Not(Like(`${value}%`));
        case FilteringRulesEnum.NOT_ISTARTS_WITH:
            return Not(ILike(`${value}%`));
        case FilteringRulesEnum.ENDS_WITH:
            return Like(`%${value}`);
        case FilteringRulesEnum.IENDS_WITH:
            return ILike(`%${value}`);
        case FilteringRulesEnum.NOT_ENDS_WITH:
            return Not(Like(`%${value}`));
        case FilteringRulesEnum.NOT_IENDS_WITH:
            return Not(ILike(`%${value}`));
        case FilteringRulesEnum.IN:
            return In(value.split(','));
        case FilteringRulesEnum.NOT_IN:
            return Not(In(value.split(',')));
        case FilteringRulesEnum.BETWEEN: {
            const [start, end] = value.split(',');
            if (!start || !end) {
                throw new Error(`Invalid range for property ${property}`);
            }
            if (isDateField) {
                const startValue = new Date(start);
                const endValue = new Date(end);
                if (isNaN(startValue.getTime()) || isNaN(endValue.getTime())) {
                    throw new Error(`Invalid date range for property ${property}`);
                }
                return Between(startValue, endValue);
            } else {
                return Between(+start, +end);
            }
        }
        case FilteringRulesEnum.NOT_BETWEEN: {
            const [start, end] = value.split(',');
            if (!start || !end) {
                throw new Error(`Invalid range for property ${property}`);
            }
            if (isDateField) {
                const startValue = new Date(start);
                const endValue = new Date(end);
                if (isNaN(startValue.getTime()) || isNaN(endValue.getTime())) {
                    throw new Error(`Invalid date range for property ${property}`);
                }
                return Not(Between(startValue, endValue));
            } else {
                return Not(Between(+start, +end));
            }
        }
        default:
            throw new Error(`Unsupported filtering rule: ${rule}`);
    }
}

const getTypeOrmWhereFilters = (
    combinedRules: Object,
    filter: FilteringInterface,
    dateFields: Array<string>
) => {
    const { isNested, property, rule, value } = filter;
    const isDateField = dateFields.includes(property);

    let filterValue: string | Date = value;

    if (isDateField && value && rule !== FilteringRulesEnum.BETWEEN) {
        filterValue = new Date(value);
        if (isNaN(filterValue.getTime())) {
            throw new Error(`Invalid date format for field ${property}`);
        }
    }

    const valueToSet = buildTypeOrmFilters(property, rule, value, filterValue, isDateField);

    if (isNested) {
        const [relation, nestedProperty] = property.split('.');
        if (!combinedRules[relation])
            combinedRules[relation] = {};

        combinedRules[relation][nestedProperty] = valueToSet;
    } else {
        combinedRules[property] = valueToSet;
    }
}

const buildSequelizeValue = (property: string, rule: string, value: string, filterValue: string | Date, isDateField: boolean) => {
    switch (rule) {
        case FilteringRulesEnum.IS_NULL:
            return { [Op.eq]: null };
        case FilteringRulesEnum.IS_NOT_NULL:
            return { [Op.ne]: null };
        case FilteringRulesEnum.EQUALS:
            return filterValue;
        case FilteringRulesEnum.NOT_EQUALS:
            return { [Op.ne]: filterValue };
        case FilteringRulesEnum.GREATER_THAN:
            return { [Op.gt]: filterValue };
        case FilteringRulesEnum.GREATER_THAN_OR_EQUALS:
            return { [Op.gte]: filterValue };
        case FilteringRulesEnum.LESS_THAN:
            return { [Op.lt]: filterValue };
        case FilteringRulesEnum.LESS_THAN_OR_EQUALS:
            return { [Op.lte]: filterValue };
        case FilteringRulesEnum.LIKE:
            return { [Op.like]: `%${value}%` };
        case FilteringRulesEnum.ILIKE:
            return { [Op.iLike]: `%${value}%` }; // PostgreSQL only
        case FilteringRulesEnum.NOT_LIKE:
            return { [Op.notLike]: `%${value}%` };
        case FilteringRulesEnum.NOT_ILIKE:
            return { [Op.notILike]: `%${value}%` }; // PostgreSQL only
        case FilteringRulesEnum.STARTS_WITH:
            return { [Op.like]: `${value}%` };
        case FilteringRulesEnum.ISTARTS_WITH:
            return { [Op.iLike]: `${value}%` };
        case FilteringRulesEnum.NOT_STARTS_WITH:
            return { [Op.notLike]: `${value}%` };
        case FilteringRulesEnum.NOT_ISTARTS_WITH:
            return { [Op.notILike]: `${value}%` };
        case FilteringRulesEnum.ENDS_WITH:
            return { [Op.like]: `%${value}` };
        case FilteringRulesEnum.IENDS_WITH:
            return { [Op.iLike]: `%${value}` };
        case FilteringRulesEnum.NOT_ENDS_WITH:
            return { [Op.notLike]: `%${value}` };
        case FilteringRulesEnum.NOT_IENDS_WITH:
            return { [Op.notILike]: `%${value}` };
        case FilteringRulesEnum.IN:
            return { [Op.in]: value.split(',') };
        case FilteringRulesEnum.NOT_IN:
            return { [Op.notIn]: value.split(',') };
        case FilteringRulesEnum.BETWEEN: {
            const [start, end] = value.split(',');
            if (!start || !end) {
                throw new Error(`Invalid range for property ${property}`);
            }
            if (isDateField) {
                const startValue = new Date(start);
                const endValue = new Date(end);
                if (isNaN(startValue.getTime()) || isNaN(endValue.getTime())) {
                    throw new Error(`Invalid date range for property ${property}`);
                }
                return { [Op.between]: [startValue, endValue] };
            } else {
                return { [Op.between]: [+start, +end] };
            }
        }

        case FilteringRulesEnum.NOT_BETWEEN: {
            const [start, end] = value.split(',');
            if (!start || !end) {
                throw new Error(`Invalid range for property ${property}`);
            }
            if (isDateField) {
                const startValue = new Date(start);
                const endValue = new Date(end);
                if (isNaN(startValue.getTime()) || isNaN(endValue.getTime())) {
                    throw new Error(`Invalid date range for property ${property}`);
                }
                return { [Op.notBetween]: [startValue, endValue] };
            } else {
                return { [Op.notBetween]: [+start, +end] };
            }
        }
        default:
            throw new Error(`Unsupported filtering rule: ${rule}`);
    }
};

const getSequelizeFilters = (
    combinedRules: Record<string, any>,
    filter: FilteringInterface,
    dateFields: string[]
) => {
    const { isNested, property, rule, value } = filter;
    const isDateField = dateFields.includes(property);

    let filterValue: string | Date = value;

    if (isDateField && value && rule !== FilteringRulesEnum.BETWEEN) {
        filterValue = new Date(value);
        if (isNaN(filterValue.getTime())) {
            throw new Error(`Invalid date format for field ${property}`);
        }
    }

    const valueToSet = buildSequelizeValue(property, rule, value, filterValue, isDateField);

    if (isNested) {
        const [relation, nestedProperty] = property.split('.');
        if (!combinedRules[relation])
            combinedRules[relation] = {};

        combinedRules[relation][nestedProperty] = valueToSet;
    } else {
        combinedRules[property] = valueToSet;
    }
};

const buildMikroOrmValue = (
    property: string,
    rule: string,
    value: string,
    filterValue: string | Date,
    isDateField: boolean
) => {
    switch (rule) {
        case FilteringRulesEnum.IS_NULL:
            return { $eq: null };

        case FilteringRulesEnum.IS_NOT_NULL:
            return { $ne: null };

        case FilteringRulesEnum.EQUALS:
            return filterValue;

        case FilteringRulesEnum.NOT_EQUALS:
            return { $ne: filterValue };

        case FilteringRulesEnum.GREATER_THAN:
            return { $gt: filterValue };

        case FilteringRulesEnum.GREATER_THAN_OR_EQUALS:
            return { $gte: filterValue };

        case FilteringRulesEnum.LESS_THAN:
            return { $lt: filterValue };

        case FilteringRulesEnum.LESS_THAN_OR_EQUALS:
            return { $lte: filterValue };

        case FilteringRulesEnum.LIKE:
            return { $like: `%${value}%` };

        case FilteringRulesEnum.ILIKE:
            return { $ilike: `%${value}%` }; // PostgreSQL only

        case FilteringRulesEnum.NOT_LIKE:
            return { $not: { $like: `%${value}%` } };

        case FilteringRulesEnum.NOT_ILIKE:
            return { $not: { $ilike: `%${value}%` } };

        case FilteringRulesEnum.STARTS_WITH:
            return { $like: `${value}%` };

        case FilteringRulesEnum.ISTARTS_WITH:
            return { $ilike: `${value}%` };

        case FilteringRulesEnum.NOT_STARTS_WITH:
            return { $not: { $like: `${value}%` } };

        case FilteringRulesEnum.NOT_ISTARTS_WITH:
            return { $not: { $ilike: `${value}%` } };

        case FilteringRulesEnum.ENDS_WITH:
            return { $like: `%${value}` };

        case FilteringRulesEnum.IENDS_WITH:
            return { $ilike: `%${value}` };

        case FilteringRulesEnum.NOT_ENDS_WITH:
            return { $not: { $like: `%${value}` } };

        case FilteringRulesEnum.NOT_IENDS_WITH:
            return { $not: { $ilike: `%${value}` } };

        case FilteringRulesEnum.IN:
            return { $in: value.split(',') };

        case FilteringRulesEnum.NOT_IN:
            return { $nin: value.split(',') };

        case FilteringRulesEnum.BETWEEN: {
            const [start, end] = value.split(',');
            if (!start || !end) {
                throw new Error(`Invalid range for property ${property}`);
            }
            if (isDateField) {
                const startValue = new Date(start);
                const endValue = new Date(end);

                if (
                    isNaN(startValue.getTime()) || isNaN(endValue.getTime())
                ) {
                    throw new Error(`Invalid date range for property ${property}`);
                }
                return {
                    $gte: startValue,
                    $lte: endValue,
                };
            }

            return {
                $gte: +start,
                $lte: +end,
            };
        }

        case FilteringRulesEnum.NOT_BETWEEN: {
            const [start, end] = value.split(',');
            if (!start || !end) {
                throw new Error(`Invalid range for property ${property}`);
            }
            if (isDateField) {
                const startValue = new Date(start);
                const endValue = new Date(end);

                if (
                    isNaN(startValue.getTime()) || isNaN(endValue.getTime())
                ) {
                    throw new Error(`Invalid date range for property ${property}`);
                }
                return {
                    $not: {
                        $gte: startValue,
                        $lte: endValue,
                    },
                };
            }

            return {
                $not: {
                    $gte: +start,
                    $lte: +end,
                },
            };
        }

        default:
            throw new Error(`Unsupported filtering rule: ${rule}`);
    }
};

const getMikroOrmFilters = (
    combinedRules: Record<string, any>,
    filter: FilteringInterface,
    dateFields: string[]
) => {
    const { isNested, property, rule, value } = filter;
    const isDateField = dateFields.includes(property);

    let filterValue: string | Date = value;

    if (isDateField && value && rule !== FilteringRulesEnum.BETWEEN) {
        filterValue = new Date(value);
        if (isNaN(filterValue.getTime())) {
            throw new Error(`Invalid date format for field ${property}`);
        }
    }

    const valueToSet = buildMikroOrmValue(property, rule, value, filterValue, isDateField);

    if (isNested) {
        const [relation, nestedProperty] = property.split('.');
        if (!combinedRules[relation])
            combinedRules[relation] = {};

        combinedRules[relation][nestedProperty] = valueToSet;
    } else {
        combinedRules[property] = valueToSet;
    }
};

const getFilters = (
    buildValueFunction: (...args: any[]) => any,
    combinedRules: Object,
    filter: FilteringInterface,
    dateFields: Array<string>
) => {
    const { isNested, property, rule, value } = filter;
    const isDateField = dateFields.includes(property);

    let filterValue: string | Date = value;

    if (isDateField && value && rule !== FilteringRulesEnum.BETWEEN) {
        filterValue = new Date(value);
        if (isNaN(filterValue.getTime())) {
            throw new Error(`Invalid date format for field ${property}`);
        }
    }

    let valueToSet = buildValueFunction(property, rule, value, filterValue, isDateField)

    if (isNested) {
        const [relation, nestedProperty] = property.split('.');
        if (!combinedRules[relation])
            combinedRules[relation] = {};

        combinedRules[relation][nestedProperty] = valueToSet;
    } else {
        combinedRules[property] = valueToSet;
    }
}

const getOrmBuildFunction = (orm: availableOrmEnum) => {
    switch (orm) {
        case availableOrmEnum.typeorm:
            return buildTypeOrmFilters

        case availableOrmEnum.sequelize:
            return buildSequelizeValue

        case availableOrmEnum.mikroorm:
            return buildMikroOrmValue

        default:
            throw new Error(`no support for orm ${orm} yet`)
    }

}