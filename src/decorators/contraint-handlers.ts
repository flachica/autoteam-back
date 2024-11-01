import { ConflictException } from '@nestjs/common';

export function HandleDabaseConstraints() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT') {
          throw new ConflictException(
            'No se cumplieron las restricciones de la base de datos. Compruebe el formulario y vuelva a intentarlo.',
          );
        } else {
          throw error;
        }
      }
    };

    return descriptor;
  };
}
