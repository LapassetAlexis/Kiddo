import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: ('parent' | 'child')[]) => SetMetadata(ROLES_KEY, roles);
