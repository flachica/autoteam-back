import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

export function ApiEntityTags(entity: string) {
  return applyDecorators(ApiTags(entity));
}

export function ApiCreateResponse(entity: any) {
  return applyDecorators(
    ApiBody({ type: entity }),
    ApiResponse({
      status: 201,
      description: `The ${entity.name.toLowerCase()} has been successfully created.`,
      type: entity,
    }),
    ApiResponse({ status: 400, description: 'Bad Request.' }),
  );
}

export function ApiFindAllResponse(entity: any) {
  return applyDecorators(
    ApiResponse({
      status: 200,
      description: `Return all ${entity.name.toLowerCase()}s.`,
      type: [entity],
    }),
  );
}

export function ApiFindOneResponse(entity: any) {
  return applyDecorators(
    ApiParam({
      name: 'id',
      type: Number,
      description: `The ID of the ${entity.name.toLowerCase()}`,
    }),
    ApiResponse({
      status: 200,
      description: `Return the ${entity.name.toLowerCase()} with the given ID.`,
      type: entity,
    }),
    ApiResponse({ status: 404, description: `${entity.name} not found.` }),
  );
}

export function ApiUpdateResponse(entity: any) {
  return applyDecorators(
    ApiParam({
      name: 'id',
      type: Number,
      description: `The ID of the ${entity.name.toLowerCase()}`,
    }),
    ApiBody({ type: entity }),
    ApiResponse({
      status: 200,
      description: `The ${entity.name.toLowerCase()} has been successfully updated.`,
      type: entity,
    }),
    ApiResponse({ status: 400, description: 'Bad Request.' }),
    ApiResponse({ status: 404, description: `${entity.name} not found.` }),
  );
}

export function ApiDeleteResponse(entity: any) {
  return applyDecorators(
    ApiParam({
      name: 'id',
      type: Number,
      description: `The ID of the ${entity.name.toLowerCase()}`,
    }),
    ApiResponse({
      status: 200,
      description: `Remove the ${entity.name.toLowerCase()} with the given ID.`,
      type: entity,
    }),
    ApiResponse({ status: 404, description: `${entity.name} not found.` }),
  );
}
