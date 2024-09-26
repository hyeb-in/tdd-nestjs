import { IPointHistoryRepository } from '../interfaces';
import { PointHistoryTable } from 'src/database/pointhistory.table';
import { TransactionType, PointHistory } from '../point.model';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PointHistoryRepositoryImpl implements IPointHistoryRepository {
  constructor(private readonly historyDb: PointHistoryTable) {}

  async insert(
    userId: number,
    amount: number,
    transactionType: TransactionType,
    updateMillis: number,
  ): Promise<PointHistory> {
    return await this.historyDb.insert(
      userId,
      amount,
      transactionType,
      updateMillis,
    );
  }

  async selectAllByUserId(userId: number): Promise<PointHistory[]> {
    return await this.historyDb.selectAllByUserId(userId);
  }
}
