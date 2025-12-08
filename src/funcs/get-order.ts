import { Sorting } from "src/types";

export const getOrder = (sorting: Sorting[], defaulSort = false): Record<string, "ASC" | "DESC" | "asc" | "desc"> => {
    const allSorts: any = sorting && Array.isArray(sorting) && sorting.length > 0 ? sorting.reduce((acc, cv) => ({ ...acc, [cv.property]: cv.direction }), {}) : {};

    return allSorts
}