import { UserPointTable } from 'src/database/userpoint.table';
import { IUserPointRepository } from '../interfaces';
import { UserPoint } from '../point.model';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserPointRepositoryImpl implements IUserPointRepository {
  constructor(private readonly userDb: UserPointTable) {}

  async selectById(id: number): Promise<UserPoint> {
    return await this.userDb.selectById(id);
  }
  async insertOrUpdate(id: number, amount: number): Promise<UserPoint> {
    return await this.userDb.insertOrUpdate(id, amount);
  }
}
