import { IsNull, Not, LessThan, LessThanOrEqual, MoreThan, MoreThanOrEqual, ILike, In, Between, Like } from "typeorm";
import { availableOrmEnum, FilteringInterface, FilteringRulesEnum, WhereOptions } from '../types'
import { Op } from "sequelize";

export function getWhere(
    filters: FilteringInterface[],
    options?: WhereOptions
) {
    const { orm = availableOrmEnum.typeorm, dateFields = [] } = options || {}

    const combinedRules = {};

    for (const filter of filters) {
        switch (orm) {
            case availableOrmEnum.typeorm: {
                getTypeOrmWhereFilters(combinedRules, filter, dateFields)
                break;
            }

            case availableOrmEnum.sequelize: {
                getSequelizeFilters(combinedRules, filter, dateFields)
                break;
            }

            default:
                throw new Error(`no support for orm ${orm} yet`)
        }
    }

    return combinedRules;
};

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

    if (isNested) {
        const [relation, nestedProperty] = property.split('.');

        if (!combinedRules[relation]) {
            combinedRules[relation] = {};
        }

        switch (rule) {
            case FilteringRulesEnum.IS_NULL:
                combinedRules[relation][nestedProperty] = IsNull();
                break;
            case FilteringRulesEnum.IS_NOT_NULL:
                combinedRules[relation][nestedProperty] = Not(IsNull());
                break;
            case FilteringRulesEnum.EQUALS:
                combinedRules[relation][nestedProperty] = filterValue;
                break;
            case FilteringRulesEnum.NOT_EQUALS:
                combinedRules[relation][nestedProperty] = Not(filterValue);
                break;
            case FilteringRulesEnum.GREATER_THAN:
                combinedRules[relation][nestedProperty] = MoreThan(filterValue);
                break;
            case FilteringRulesEnum.GREATER_THAN_OR_EQUALS:
                combinedRules[relation][nestedProperty] = MoreThanOrEqual(filterValue);
                break;
            case FilteringRulesEnum.LESS_THAN:
                combinedRules[relation][nestedProperty] = LessThan(filterValue);
                break;
            case FilteringRulesEnum.LESS_THAN_OR_EQUALS:
                combinedRules[relation][nestedProperty] = LessThanOrEqual(filterValue);
                break;
            case FilteringRulesEnum.LIKE:
                combinedRules[relation][nestedProperty] = Like(`%${value}%`);
                break;
            case FilteringRulesEnum.ILIKE:
                combinedRules[relation][nestedProperty] = ILike(`%${value}%`);
                break;

            case FilteringRulesEnum.NOT_ILIKE:
                combinedRules[relation][nestedProperty] = Not(ILike(`%${value}%`));
                break;
            case FilteringRulesEnum.NOT_ILIKE:
                combinedRules[relation][nestedProperty] = Not(Like(`%${value}%`));
                break;

            case FilteringRulesEnum.STARTS_WITH:
                combinedRules[relation][nestedProperty] = Like(`${value}%`);
                break;
            case FilteringRulesEnum.ISTARTS_WITH:
                combinedRules[relation][nestedProperty] = ILike(`${value}%`);
                break;

            case FilteringRulesEnum.NOT_STARTS_WITH:
                combinedRules[relation][nestedProperty] = Not(Like(`${value}%`));
                break;
            case FilteringRulesEnum.NOT_ISTARTS_WITH:
                combinedRules[relation][nestedProperty] = Not(ILike(`${value}%`));
                break;

            case FilteringRulesEnum.ENDS_WITH:
                combinedRules[relation][nestedProperty] = Like(`%${value}`);
                break;
            case FilteringRulesEnum.IENDS_WITH:
                combinedRules[relation][nestedProperty] = ILike(`%${value}`);
                break;

            case FilteringRulesEnum.NOT_ENDS_WITH:
                combinedRules[relation][nestedProperty] = Not(Like(`%${value}`));
                break;
            case FilteringRulesEnum.NOT_IENDS_WITH:
                combinedRules[relation][nestedProperty] = Not(ILike(`%${value}`));
                break;

            case FilteringRulesEnum.IN:
                combinedRules[relation][nestedProperty] = In(value.split(','));
                break;

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
                    combinedRules[relation][nestedProperty] = Between(startValue, endValue);
                } else {
                    combinedRules[relation][nestedProperty] = Between(+start, +end);
                }
                break;
            }
            case FilteringRulesEnum.NOT_IN:
                combinedRules[relation][nestedProperty] = Not(In(value.split(',')));
                break;
        }
    } else {
        switch (rule) {
            case FilteringRulesEnum.IS_NULL:
                combinedRules[property] = IsNull();
                break;
            case FilteringRulesEnum.IS_NOT_NULL:
                combinedRules[property] = Not(IsNull());
                break;
            case FilteringRulesEnum.EQUALS:
                combinedRules[property] = filterValue;
                break;
            case FilteringRulesEnum.NOT_EQUALS:
                combinedRules[property] = Not(filterValue);
                break;
            case FilteringRulesEnum.GREATER_THAN:
                combinedRules[property] = MoreThan(filterValue);
                break;
            case FilteringRulesEnum.GREATER_THAN_OR_EQUALS:
                combinedRules[property] = MoreThanOrEqual(filterValue);
                break;
            case FilteringRulesEnum.LESS_THAN:
                combinedRules[property] = LessThan(filterValue);
                break;
            case FilteringRulesEnum.LESS_THAN_OR_EQUALS:
                combinedRules[property] = LessThanOrEqual(filterValue);
                break;
            case FilteringRulesEnum.LIKE:
                combinedRules[property] = Like(`%${value}%`);
                break;
            case FilteringRulesEnum.ILIKE:
                combinedRules[property] = ILike(`%${value}%`);
                break;
            case FilteringRulesEnum.NOT_LIKE:
                combinedRules[property] = Not(Like(`%${value}%`));
                break;
            case FilteringRulesEnum.NOT_ILIKE:
                combinedRules[property] = Not(ILike(`%${value}%`));
                break;


            case FilteringRulesEnum.STARTS_WITH:
                combinedRules[property] = Like(`${value}%`);
                break;
            case FilteringRulesEnum.ISTARTS_WITH:
                combinedRules[property] = ILike(`${value}%`);
                break;

            case FilteringRulesEnum.NOT_STARTS_WITH:
                combinedRules[property] = Not(Like(`${value}%`));
                break;
            case FilteringRulesEnum.NOT_ISTARTS_WITH:
                combinedRules[property] = Not(ILike(`${value}%`));
                break;

            case FilteringRulesEnum.ENDS_WITH:
                combinedRules[property] = Like(`%${value}`);
                break;
            case FilteringRulesEnum.IENDS_WITH:
                combinedRules[property] = ILike(`%${value}`);
                break;

            case FilteringRulesEnum.NOT_ENDS_WITH:
                combinedRules[property] = Not(Like(`%${value}`));
                break;
            case FilteringRulesEnum.NOT_IENDS_WITH:
                combinedRules[property] = Not(ILike(`%${value}`));
                break;

            case FilteringRulesEnum.IN:
                combinedRules[property] = In(value.split(','));
                break;
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
                    combinedRules[property] = Between(startValue, endValue);
                } else {
                    combinedRules[property] = Between(+start, +end);
                }
                break;
            }
            case FilteringRulesEnum.NOT_IN:
                combinedRules[property] = Not(In(value.split(',')));
                break;
        }
    }
}

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

    const buildValue = () => {
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
            default:
                throw new Error(`Unsupported filtering rule: ${rule}`);
        }
    };

    const valueToSet = buildValue();

    if (isNested) {
        const [relation, nestedProperty] = property.split('.');
        if (!combinedRules[relation]) combinedRules[relation] = {};
        combinedRules[relation][nestedProperty] = valueToSet;
    } else {
        combinedRules[property] = valueToSet;
    }
};
