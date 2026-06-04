import { Injectable, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtPayload } from '../decorators/current-user.decorator';

@Injectable()
export class ScopedTaskGuard extends JwtAuthGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);

    const req = context.switchToHttp().getRequest();
    const user = req.user as JwtPayload;

    if (!user.scope) return true;

    if (user.scope !== 'task:action') throw new ForbiddenException('Token scope invalide');
    if (user.taskId !== req.params.id) throw new ForbiddenException('Token non valide pour cette tâche');
    return true;
  }
}
