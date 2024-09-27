import { Test, TestingModule } from '@nestjs/testing';
import { PointController } from './point.controller';
import { PointService } from '../service/point.service';
import { SequentialTaskHandler } from 'src/common/utils/sequential.task.handler';
import { UserPointTable } from 'src/database/userpoint.table';
import { PointHistoryTable } from 'src/database/pointhistory.table';
import { PointDto } from '../dto';
import {
  POINT_HISTORY_REPOSITORY,
  USER_POINT_REPOSITORY,
} from 'src/common/const';
import {
  PointHistoryRepositoryImpl,
  UserPointRepositoryImpl,
} from '../repositories';
import { TransactionType } from '../point.model';

describe('PointController (Integration)', () => {
  let controller: PointController;
  let service: PointService;
  let userPointTable: UserPointTable;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PointController],
      providers: [
        PointService,
        SequentialTaskHandler,
        UserPointTable,
        PointHistoryTable,
        {
          provide: USER_POINT_REPOSITORY,
          useClass: UserPointRepositoryImpl,
        },
        {
          provide: POINT_HISTORY_REPOSITORY,
          useClass: PointHistoryRepositoryImpl,
        },
      ],
    }).compile();

    controller = module.get<PointController>(PointController);
    service = module.get<PointService>(PointService);
    userPointTable = module.get<UserPointTable>(UserPointTable);
  });

  describe('GET /point/:id', () => {
    it('특정 유저의 포인트를 조회해야 한다', async () => {
      // given
      const userId = 1;
      const initialPoint = 5000;
      await userPointTable.insertOrUpdate(userId, initialPoint);

      // when
      const result = await controller.point(userId.toString());

      // then
      expect(result).toEqual({
        id: userId,
        point: initialPoint,
        updateMillis: expect.any(Number),
      });
    });
  });

  describe('GET /point/:id/histories', () => {
    it('특정 유저의 포인트 내역을 조회해야 한다', async () => {
      // given
      const userId = 1;
      await service.chargePoint(userId, 100); // 충전하여 히스토리 남기기

      // when
      const result = await controller.history(userId.toString());

      // then
      expect(result).toHaveLength(1);
      expect(result[0].amount).toBe(100);
      expect(result[0].type).toBe(TransactionType.CHARGE);
    });
  });

  describe('PATCH /point/:id/charge', () => {
    it('특정 유저의 포인트를 충전해야 한다', async () => {
      // given
      const userId = 1;
      const pointDto: PointDto = { amount: 1000 };
      await userPointTable.insertOrUpdate(userId, 5000);

      // when
      const result = await controller.charge(userId.toString(), pointDto);

      // then
      expect(result.point).toBe(6000); // 5000 + 1000 = 6000
    });
  });

  describe('PATCH /point/:id/use', () => {
    it('특정 유저의 포인트를 사용해야 한다', async () => {
      // given
      const userId = 1;
      const pointDto: PointDto = { amount: 500 };
      await userPointTable.insertOrUpdate(userId, 1000);

      // when
      const result = await controller.use(userId, pointDto);

      // then
      expect(result.point).toBe(500); // 1000 - 500 = 500
    });
  });
});
