import { IsInt, Min } from 'class-validator';

export class PointDto {
  @IsInt()
  @Min(1, { message: '포인트는 1 이상이어야 합니다.' })
  amount: number;
}
