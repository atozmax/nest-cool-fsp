## nest-cool-fsp

Helpers for **F**iltering, **S**orting, and **P**agination in NestJS controllers, plus utility functions to convert parsed query params into ORM-compatible `where` / `order` objects.

This package exports:

- **Decorators**: `FilteringDecorator`, `SortingDecorator`, `PaginationDecorator`
- **Swagger decorators**: `SwaggerFilteringDecorator`, `SwaggerSortingDecorator`, `SwaggerPaginationDecorator`
- **Functions**: `getWhere`, `getOrder`

## Installation

```bash
npm i nest-cool-fsp
```

## Quick example (Controller)

```ts
import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  FilteringDecorator,
  SortingDecorator,
  PaginationDecorator,
  SwaggerFilteringDecorator,
  SwaggerSortingDecorator,
  SwaggerPaginationDecorator,
  getWhere,
  getOrder,
  FilteringInterface,
  Sorting,
  Pagination,
  availableOrmEnum,
} from 'nest-cool-fsp';

@ApiTags('users')
@Controller('users')
export class UsersController {
  @Get()
  @SwaggerPaginationDecorator()
  @SwaggerSortingDecorator(['id', 'email', 'profile.name'])
  @SwaggerFilteringDecorator(['id', 'email', 'createdAt', 'profile.name'])
  async list(
    @PaginationDecorator() pagination: Pagination,
    @SortingDecorator(['id', 'email']) sorting: Sorting[],
    @FilteringDecorator(['id', 'email', 'createdAt', 'profile.name']) filters: FilteringInterface[],
  ) {
    const where = getWhere(filters, {
      orm: availableOrmEnum.typeorm,
      dateFields: ['createdAt'],
    });
    const order = getOrder(sorting);

    // Use `pagination.offset` + `pagination.limit` with your ORM query.
    // Use `where` and `order` with your ORM query.
    return { pagination, where, order };
  }
}
```

## Pagination

### `PaginationDecorator`

Reads query params:

- `**page**`: non-negative integer, defaults to `0` if omitted/empty
- `**size**`: required; must be one of the allowed sizes (see `pageSizes`)

Returns:

- `**page**`: number
- `**size**`: page size
- `**limit**`: equals `size`
- `**offset**`: `page * limit`

Example request:

- `GET /users?page=0&size=25`

### `SwaggerPaginationDecorator`

Adds Swagger (`@nestjs/swagger`) query docs for `page` and `size`.

## Sorting

### Query format

Use the `**sort**` query parameter:

- **Single sort**: `sort=property:asc`
- **Multiple sorts**: `sort=property1:asc,property2:desc`

Example:

- `GET /users?sort=id:desc,email:asc`

### `SortingDecorator(validParams)`

- `**validParams`** must be an array of allowed properties.
- Parses `sort` into `Sorting[]` (`{ property, direction }`).
- Validates each sort item matches `^([a-zA-Z0-9]+):(asc|desc)$`.
- Throws `BadRequestException` on invalid format or invalid property.

Notes:

- Only alphanumeric property names are accepted by the regex (no `_` / `.` in sorting).
- Directions are normalized to lowercase (`asc` / `desc`).

### `SwaggerSortingDecorator(validParams)`

Adds Swagger docs for the `sort` query param, generating examples from `validParams`.

## Filtering

### Query format

Use the `**filter**` query parameter.

- Each filter item is: `**property:rule:value**`
- Multiple filter items are separated by `|` (pipe).
- For `isnull` / `isnotnull`, `value` is optional.

Examples:

- `GET /users?filter=email:ilike:gmail.com`
- `GET /users?filter=createdAt:between:2026-01-01,2026-01-31|profile.name:like:amir`
- `GET /users?filter=deletedAt:isnull`

### Supported rules (`FilteringRulesEnum`)

```txt
eq, neq, gt, gte, lt, lte,
like, ilike, nlike, nilike,
sw, isw, nsw, nisw,
ew, iew, new, niew,
in, nin,
between, nbetween,
isnull, isnotnull
```

### `FilteringDecorator(validParams)`

- `**validParams**` must be an array of allowed properties.
- Parses `filter` into `FilteringInterface[]` (`{ property, rule, value, isNested }`).
- Validates the overall filter string format and validates:
  - property is within `validParams`
  - rule is within `FilteringRulesEnum`

Nested fields:

- If `property` includes a dot (example: `profile.name`) then `isNested` is set to `true`.

### `SwaggerFilteringDecorator(validParams)`

Adds Swagger docs for the `filter` query param, generating examples from:

- every property in `validParams`
- every value in `FilteringRulesEnum`

## ORM utilities

### `getOrder(sorting)`

Converts `Sorting[]` into a plain object:

- Input: `[{ property: 'id', direction: 'desc' }]`
- Output: `{ id: 'desc' }`

This is typically compatible with TypeORM `order`, and can also be adapted for other ORMs.

### `getWhere(filters, options?)`

Builds an ORM-friendly `where` object from `FilteringInterface[]`.

#### Options

- `**orm**`: `'typeorm' | 'sequelize' | 'mikroorm'` (default: `typeorm`)
  - `mongoose` exists in the type but is **not implemented** and will throw.
- `**dateFields`**: list of properties that should be treated as dates

#### Date fields

If `options.dateFields` includes the filter property:

- for most rules, the value is converted to a `Date` (and throws if invalid)
- for `between` / `nbetween`, both `start,end` are parsed as dates

#### Nested fields

If `filter.isNested` is `true` and property is like `profile.name`, `getWhere` produces:

```ts
{ profile: { name: /* built value */ } }
```

#### ORM behavior

- **TypeORM (`orm: 'typeorm'`)**: uses `IsNull`, `Not`, `In`, `Between`, `Like`, `ILike`, `MoreThan`, etc.
- **Sequelize (`orm: 'sequelize'`)**: uses `Op.`* operators
- **MikroORM (`orm: 'mikroorm'`)**: uses `$eq`, `$ne`, `$in`, `$gte/$lte`, `$like`, `$ilike`, etc.

#### Passing `getWhere(...)` output to ORM find methods

Below are minimal examples of using `getWhere` + `getOrder` with popular ORMs.

##### TypeORM (`Repository.find`)

```ts
import { Repository } from 'typeorm';
import { getWhere, getOrder, availableOrmEnum } from 'nest-cool-fsp';

// filters: FilteringInterface[] (typically from @FilteringDecorator)
// sorting: Sorting[] (typically from @SortingDecorator)
// pagination: Pagination (typically from @PaginationDecorator)

const where = getWhere(filters, {
  orm: availableOrmEnum.typeorm,
  dateFields: ['createdAt'],
});

const order = getOrder(sorting); // { id: 'desc', email: 'asc' }

const users = await userRepository.find({
  where: where as any,
  order: order as any,
  skip: pagination.offset,
  take: pagination.limit,
})
```

##### MikroORM (`EntityManager.find`)

```ts
import { EntityManager } from '@mikro-orm/core';
import { getWhere, getOrder, availableOrmEnum } from 'nest-cool-fsp';

const where = getWhere(filters, {
  orm: availableOrmEnum.mikroorm,
  dateFields: ['createdAt'],
});

const orderBy = getOrder(sorting); // MikroORM accepts an object for orderBy

const users = await em.find(UserEntity, where as any, {
  orderBy: orderBy as any,
  limit: pagination.limit,
  offset: pagination.offset,
});
```

##### Sequelize (`Model.findAll`)

```ts
import { getWhere, getOrder, availableOrmEnum } from 'nest-cool-fsp';

const where = getWhere(filters, {
  orm: availableOrmEnum.sequelize,
  dateFields: ['createdAt'],
});

// Sequelize `order` is usually an array of tuples. Convert `getOrder` output:
const order = Object.entries(getOrder(sorting)).map(([field, direction]) => [
  field,
  String(direction).toUpperCase(),
]);

const users = await UserModel.findAll({
  where: where as any,
  order: order as any,
  limit: pagination.limit,
  offset: pagination.offset,
});
```

