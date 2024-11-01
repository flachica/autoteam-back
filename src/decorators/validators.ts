import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function Is24HourFormat(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'is24HourFormat',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
          return regex.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be in the format HH:mm (24-hour format)`;
        },
      },
    });
  };
}