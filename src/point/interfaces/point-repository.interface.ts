import { UserPoint } from '../point.model';

export interface IUserPointRepository {
  selectById(id: number): Promise<UserPoint>;
  insertOrUpdate(id: number, amount: number): Promise<UserPoint>;
}
