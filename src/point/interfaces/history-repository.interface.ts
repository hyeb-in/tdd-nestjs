import { PointHistory, TransactionType } from '../point.model';

export interface IPointHistoryRepository {
  insert(
    userId: number,
    amount: number,
    transactionType: TransactionType,
    updateMillis: number,
  ): Promise<PointHistory>;
  selectAllByUserId(userId: number): Promise<PointHistory[]>;
}
