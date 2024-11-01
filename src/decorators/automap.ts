import 'reflect-metadata';

export function AutoMap() {
  return function (target: any, propertyKey: string) {
    const properties = Reflect.getMetadata('automap:properties', target) || [];
    properties.push(propertyKey);
    Reflect.defineMetadata('automap:properties', properties, target);
  };
}

export function mapDtoToEntity<T>(dto: any, entity: T): T {
  const properties = Reflect.getMetadata('automap:properties', entity) || [];
  properties.forEach((property: string) => {
    if (dto[property] !== undefined) {
      entity[property] = dto[property];
    }
  });
  return entity;
}
