import { Module }           from '@nestjs/common';
import { TypeOrmModule }    from '@nestjs/typeorm';
import { Family }           from './family.entity';
import { ParentAccount }    from './parent-account.entity';
import { FamiliesController } from './families.controller';
import { FamiliesService }    from './families.service';

@Module({
  imports:     [TypeOrmModule.forFeature([Family, ParentAccount])],
  controllers: [FamiliesController],
  providers:   [FamiliesService],
  exports:     [FamiliesService, TypeOrmModule],
})
export class FamiliesModule {}
