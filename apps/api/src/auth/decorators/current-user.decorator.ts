import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface JwtPayload {
  sub:      string;           // parentAccountId for parent, childId for child
  role:     'parent' | 'child';
  email?:   string;           // present for parent tokens
  name?:    string;           // parent display name (from ParentAccount.name)
  familyId?: string;          // present for both parent and child tokens
  scope?:   'task:action';    // present only on scoped deep-link tokens
  taskId?:  string;           // taskId bound to scoped token
  iat?:     number;
  exp?:     number;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as JwtPayload;
  },
);
