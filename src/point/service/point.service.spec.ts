import { Test, TestingModule } from '@nestjs/testing';
import { IPointHistoryRepository, IUserPointRepository } from '../interfaces';
import {
  POINT_HISTORY_REPOSITORY,
  USER_POINT_REPOSITORY,
} from 'src/common/const';
import { PointHistory, TransactionType, UserPoint } from '../point.model';
import { SequentialTaskHandler } from 'src/common/utils/sequential.task.handler';
import { HttpException } from '@nestjs/common';
import { PointService } from './point.service';

describe('PointService (Unit)', () => {
  let service: PointService;
  let userPointRepo: jest.Mocked<IUserPointRepository>;
  let pointHistoryRepo: jest.Mocked<IPointHistoryRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PointService,
        SequentialTaskHandler,
        {
          provide: USER_POINT_REPOSITORY,
          useValue: {
            selectById: jest.fn(),
            insertOrUpdate: jest.fn(),
          },
        },
        {
          provide: POINT_HISTORY_REPOSITORY,
          useValue: {
            insert: jest.fn(),
            selectAllByUserId: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PointService>(PointService);
    userPointRepo = module.get(USER_POINT_REPOSITORY);
    pointHistoryRepo = module.get(POINT_HISTORY_REPOSITORY);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPointByUserId', () => {
    it('포인트를 조회해서 반환한다', async () => {
      //given
      const userId = 1;

      const mockUserPoint: UserPoint = {
        id: userId,
        point: 10000,
        updateMillis: Date.now(),
      };

      userPointRepo.selectById.mockResolvedValue(mockUserPoint);

      //when
      const result = await service.getPointByUserId(userId);

      expect(result).toEqual(mockUserPoint);
    });
  });

  describe('getHistory', () => {
    it('포인트 적립, 사용 내역을 조회해서 반환한다', async () => {
      //given
      const userId = 1;
      const mockHistory: PointHistory[] = [
        {
          id: 1,
          userId: userId,
          amount: 500,
          type: TransactionType.CHARGE,
          timeMillis: Date.now(),
        },
        {
          id: 2,
          userId: userId,
          amount: 300,
          type: TransactionType.USE,
          timeMillis: Date.now(),
        },
      ];

      pointHistoryRepo.selectAllByUserId.mockResolvedValue(mockHistory);

      // when
      const result = await service.getHistory(userId);

      // then
      expect(result).toEqual(mockHistory); // 정상적으로 히스토리 반환 확인
      expect(pointHistoryRepo.selectAllByUserId).toHaveBeenCalledWith(userId);
    });
  });
  describe('chargePoint', () => {
    /**
     * 포인트가 정상적으로 충전된다.
     */

    it('포인트 충전 시 최대 잔고(10000)를 초과하면 BAD_REQUEST 예외를 발생시킨다', async () => {
      //given
      const userId = 1;
      const amount = 5000;
      const mockUserPoint: UserPoint = {
        id: userId,
        point: 10000,
        updateMillis: Date.now(),
      };

      userPointRepo.selectById.mockResolvedValue(mockUserPoint);

      //when & then
      await expect(service.chargePoint(userId, amount)).rejects.toThrow(
        HttpException,
      );
    });

    it('포인트를 충전하면 업데이트된 포인트 정보를 반환한다', async () => {
      //given
      const userId = 1;
      const initialPoint = 1000;
      const amount = 500;
      const expectedUpdatedPoint = initialPoint + amount;

      const storedPoint: UserPoint = {
        id: userId,
        point: initialPoint,
        updateMillis: Date.now(),
      };
      const updatedPoint: UserPoint = {
        id: userId,
        point: expectedUpdatedPoint,
        updateMillis: Date.now(),
      };

      userPointRepo.selectById.mockResolvedValue(storedPoint);
      userPointRepo.insertOrUpdate.mockResolvedValue(updatedPoint);
      pointHistoryRepo.insert.mockResolvedValue({
        id: 1,
        userId,
        amount,
        type: TransactionType.CHARGE,
        timeMillis: Date.now(),
      });

      //when
      const result = await service.chargePoint(userId, amount);

      //then
      expect(result).toEqual(updatedPoint);

      expect(pointHistoryRepo.insert).toHaveBeenCalledWith(
        userId,
        amount,
        TransactionType.CHARGE,
        expect.any(Number),
      );
    });
  });

  describe('usePoint', () => {
    /**
     * 포인트가 정상적으로 사용된다.
     */

    it('잔액이 부족하면 PAYMENT_REQUIRED 예외를 발생 시킨다', async () => {
      //given
      const id = 1;
      const amount = 1000;
      const mockStoredPoint: UserPoint = {
        id,
        point: 300,
        updateMillis: Date.now(),
      };

      userPointRepo.selectById.mockResolvedValue(mockStoredPoint);

      //when & then
      await expect(service.usePoint(id, amount)).rejects.toThrow(HttpException);
    });

    it('포인트를 차감해서 사용 내역을 저장한다.', async () => {
      //given
      const userId = 1;
      const initialPoint = 1000;
      const amount = 500;
      const expectedUpdatedPoint = initialPoint - amount;

      const storedPoint: UserPoint = {
        id: userId,
        point: initialPoint,
        updateMillis: Date.now(),
      };
      const updatedPoint: UserPoint = {
        id: userId,
        point: expectedUpdatedPoint,
        updateMillis: Date.now(),
      };

      userPointRepo.selectById.mockResolvedValue(storedPoint);
      userPointRepo.insertOrUpdate.mockResolvedValue(updatedPoint);
      pointHistoryRepo.insert.mockResolvedValue({
        id: 1,
        userId,
        amount,
        type: TransactionType.CHARGE,
        timeMillis: Date.now(),
      });

      //when
      const result = await service.usePoint(userId, amount);

      //then
      expect(result).toEqual(updatedPoint);

      expect(pointHistoryRepo.insert).toHaveBeenCalledWith(
        userId,
        amount,
        TransactionType.USE,
        expect.any(Number),
      );
    });
  });
});
