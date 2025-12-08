import { IsNull, Not, LessThan, LessThanOrEqual, MoreThan, MoreThanOrEqual, ILike, In, Repository, Between } from "typeorm";
import { FilteringInterface, FilteringRulesEnum } from "src/types";

export const getWhere = (filters: FilteringInterface[], repository: Repository<any>) => {
    const combinedRules = {};

    const dateFields = repository.metadata.columns
        .filter(column => column.type === 'timestamp' || column.type === 'datetime' || column.type === Date)
        .map(column => column.propertyName);

    for (const filter of filters) {
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

            // Initialize the relation object if it doesn't exist
            if (!combinedRules[relation]) {
                combinedRules[relation] = {};
            }

            // Apply the filter to the nested property
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
                    combinedRules[relation][nestedProperty] = ILike(`%${value}%`);
                    break;
                case FilteringRulesEnum.NOT_LIKE:
                    combinedRules[relation][nestedProperty] = Not(ILike(`%${value}%`));
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
            // Handle non-nested properties
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
                    combinedRules[property] = ILike(`%${value}%`);
                    break;
                case FilteringRulesEnum.NOT_LIKE:
                    combinedRules[property] = Not(ILike(`%${value}%`));
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

    return combinedRules;
};