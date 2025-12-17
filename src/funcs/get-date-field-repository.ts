import { ObjectLiteral, Repository } from "typeorm"
import { EntitySchema } from "typeorm/browser";

export function getTypeOrmDateFieldsRepository<T extends EntitySchema>(
  repository: Repository<T>
): (keyof T & string)[] {
  return repository.metadata.columns
    .filter(column =>
      column.type === Date ||
      column.type === 'timestamp' ||
      column.type === 'datetime'
    )
    .map(column => column.propertyName as keyof T & string);
}