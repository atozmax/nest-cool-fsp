export const pageSizes = [5, 10, 25, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 750, 1000];
export type PageSizeType = 5 | 10 | 25 | 50 | 100 | 150 | 200 | 250 | 300 | 350 | 400 | 450 | 500 | 750 | 1000;

export interface Pagination {
    page: number;
    limit: PageSizeType;
    size: PageSizeType;
    offset: number;
}

export type PaginatedResource<T> = {
    totalItems: number;
    items: T[];
    page: number;
    size: number;
};
