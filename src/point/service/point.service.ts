import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';

import {
  POINT_HISTORY_REPOSITORY,
  USER_POINT_REPOSITORY,
} from 'src/common/const';
import { IPointHistoryRepository, IUserPointRepository } from '../interfaces';
import { PointHistory, TransactionType, UserPoint } from '../point.model';
import { SequentialTaskHandler } from 'src/common/utils';

//TODO refactor: 전역 exception 생성
@Injectable()
export class PointService {
  constructor(
    @Inject(USER_POINT_REPOSITORY)
    private readonly userPointRepo: IUserPointRepository,
    @Inject(POINT_HISTORY_REPOSITORY)
    private readonly pointHistoryRepo: IPointHistoryRepository,
    private readonly sequentialTaskHandler: SequentialTaskHandler<any>,
  ) {}

  async getPointByUserId(id: number): Promise<UserPoint> {
    try {
      const point = await this.userPointRepo.selectById(id);

      return point;
    } catch (error) {
      console.error('유저 포인트 조회 실패:', error);
      throw new HttpException(
        '유저 포인트 조회 중 오류가 발생했습니다',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getHistory(id: number): Promise<PointHistory[]> {
    try {
      const histories = await this.pointHistoryRepo.selectAllByUserId(id);
      return histories;
    } catch (error) {
      console.error('포인트 내역 조회 실패:', error);
      throw new HttpException(
        '포인트 내역 조회 중 오류가 발생했습니다',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async chargePoint(id: number, amount: number): Promise<UserPoint> {
    return this.sequentialTaskHandler.queueTask(id, async () => {
      // 사용자 포인트 조회
      const storedPoint = await this.userPointRepo.selectById(id);

      const newPoint = storedPoint.point + amount;

      if (newPoint > 10000)
        throw new HttpException(
          '충전 한도를 초과했습니다',
          HttpStatus.BAD_REQUEST,
        );

      try {
        const [updatedPoint, _] = await Promise.all([
          this.userPointRepo.insertOrUpdate(id, newPoint),
          this.pointHistoryRepo.insert(
            id,
            amount,
            TransactionType.CHARGE,
            Date.now(),
          ),
        ]);

        return updatedPoint;
      } catch (error) {
        console.error('포인트 충전 실패:', error);
        throw new HttpException(
          '포인트 충전 중 오류가 발생했습니다',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    });
  }

  async usePoint(id: number, amount: number): Promise<UserPoint> {
    return this.sequentialTaskHandler.queueTask(id, async () => {
      const storedPoint = await this.userPointRepo.selectById(id);
      const difference = storedPoint.point - amount;

      // 잔액 부족 시 에러처리
      if (difference < 0)
        throw new HttpException(
          '잔액이 부족합니다',
          HttpStatus.PAYMENT_REQUIRED,
        );

      try {
        const [updatedPoint, _] = await Promise.all([
          this.userPointRepo.insertOrUpdate(id, difference),
          this.pointHistoryRepo.insert(
            id,
            amount,
            TransactionType.USE,
            Date.now(),
          ),
        ]);

        return updatedPoint;
      } catch (error) {
        console.error('포인트 사용 실패:', error);
        throw new HttpException(
          '포인트 사용 중 오류가 발생했습니다',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    });
  }
}
