import { Test, TestingModule } from '@nestjs/testing';
import { PointService } from './point.service';
import { IUserPointRepository } from '../interfaces';

import { SequentialTaskHandler } from 'src/common/utils/sequential.task.handler';
import {
  PointHistoryRepositoryImpl,
  UserPointRepositoryImpl,
} from '../repositories';
import { UserPointTable } from 'src/database/userpoint.table';
import { PointHistoryTable } from 'src/database/pointhistory.table';
import {
  POINT_HISTORY_REPOSITORY,
  USER_POINT_REPOSITORY,
} from 'src/common/const';

describe('PointService (Integration)', () => {
  let service: PointService;
  let userPointRepo: IUserPointRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PointService,
        {
          provide: USER_POINT_REPOSITORY,
          useClass: UserPointRepositoryImpl,
        },
        {
          provide: POINT_HISTORY_REPOSITORY,
          useClass: PointHistoryRepositoryImpl,
        },
        UserPointTable,
        PointHistoryTable,
        SequentialTaskHandler,
      ],
    }).compile();

    service = module.get<PointService>(PointService);
    userPointRepo = module.get<IUserPointRepository>(USER_POINT_REPOSITORY);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('chargePoint', () => {
    it('동시 다발적인 10개의 포인트 충전 요청이 순차적으로 처리되어야 한다', async () => {
      //given
      const userId = 1;

      //when
      const chargePromises = Array.from(
        { length: 10 },
        (_, i) => service.chargePoint(userId, (i + 1) * 100), // 100, 200, ... 1000 충전
      );

      //10개 동시 포인트 충전 요청
      await Promise.all(chargePromises);

      //then: 최종 잔고 및 각 결과 검증
      const finalPoint = await service.getPointByUserId(userId);
      expect(finalPoint.point).toBe(5500); // 총 5500 충전
    });
  });

  describe('usePoint', () => {
    it('동시 다발적인 10개의 포인트 사용 요청이 순차적으로 처리되어야 한다', async () => {
      // given
      const userId = 1;
      const initialAmount = 10000; // 포인트 10000 설정
      await userPointRepo.insertOrUpdate(userId, initialAmount);

      // when
      const usePromises = Array.from(
        { length: 10 },
        (_, i) => service.usePoint(userId, (i + 1) * 100), // 100, 200, ... 1000 사용
      );

      await Promise.all(usePromises);

      // then
      const finalPoint = await service.getPointByUserId(userId);
      expect(finalPoint.point).toBe(4500); // 총 5500 사용. 최종 잔고는 5500
    });
  });

  describe('chargePoint & usePoint', () => {
    it('포인트 충전과 사용 요청이 순차적으로 처리되어야 한다', async () => {
      //given
      const userId = 1;
      const initialAmount = 5000;
      await userPointRepo.insertOrUpdate(userId, initialAmount); // 초기 포인트 5000 설정

      //when
      const transactionPromises = [
        service.chargePoint(userId, 1000), // 6000
        service.usePoint(userId, 500), // 5500
        service.chargePoint(userId, 1000), // 6500
        service.usePoint(userId, 1000), // 5500
        service.chargePoint(userId, 500), // 6000
      ];

      await Promise.all(transactionPromises);

      //then
      const finalPoint = await service.getPointByUserId(userId);
      expect(finalPoint.point).toBe(6000); // 최종 잔고는 6000
    });
  });
});
