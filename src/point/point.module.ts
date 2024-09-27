import { Module } from '@nestjs/common';

import { DatabaseModule } from 'src/database/database.module';
import { PointController } from './controller/point.controller';
import { PointService } from './service/point.service';
import {
  POINT_HISTORY_REPOSITORY,
  USER_POINT_REPOSITORY,
} from 'src/common/const';
import {
  PointHistoryRepositoryImpl,
  UserPointRepositoryImpl,
} from './repositories';
import { SequentialTaskHandler } from 'src/common/utils';

@Module({
  imports: [DatabaseModule],
  controllers: [PointController],
  providers: [
    PointService,
    {
      provide: USER_POINT_REPOSITORY,
      useClass: UserPointRepositoryImpl,
    },
    { provide: POINT_HISTORY_REPOSITORY, useClass: PointHistoryRepositoryImpl },
    SequentialTaskHandler,
  ],
})
export class PointModule {}
