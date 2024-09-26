import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PointModule } from 'src/point/point.module';

describe('PointController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PointModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('/point/:id (GET)', () => {
    it('유저의 포인트를 조회한다.', async () => {
      const userId = 1;

      const response = await request(app.getHttpServer()).get(
        `/point/${userId}`,
      );

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('point');
    });
  });

  describe('/point/:id/histories (GET)', () => {
    it('유저의 포인트 내역을 조회한다.', async () => {
      const userId = 1;

      const response = await request(app.getHttpServer()).get(
        `/point/${userId}/histories`,
      );

      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('/point/:id/charge (PATCH)', () => {
    it('유저의 포인트를 충전한다.', async () => {
      const userId = 1;
      const amount = 1000;

      const response = await request(app.getHttpServer())
        .patch(`/point/${userId}/charge`)
        .send({ amount });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('point');
    });

    describe('4xx 에러 검증', () => {
      it('amount가 없으면 400 에러를 반환한다.', async () => {
        const userId = 1;

        const response = await request(app.getHttpServer()).patch(
          `/point/${userId}/charge`,
        );

        expect(response.statusCode).toBe(400);
      });

      it('amount가 0보다 작으면 400 에러를 반환한다.', async () => {
        const userId = 1;
        const amount = -100;

        const response = await request(app.getHttpServer())
          .patch(`/point/${userId}/charge`)
          .send({ amount });

        expect(response.statusCode).toBe(400);
      });
    });
  });

  describe('/point/:id/use (PATCH)', () => {
    it('유저의 포인트를 사용한다.', async () => {
      const userId = 1;
      const amount = 100;

      await request(app.getHttpServer()).patch(`/point/${userId}/charge`).send({
        amount: 200,
      });
      const response = await request(app.getHttpServer())
        .patch(`/point/${userId}/use`)
        .send({ amount });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('point'); // 사용 후 포인트가 반환되는지 확인
    });

    describe('4xx 에러 검증', () => {
      it('amount가 없으면 400 에러를 반환해야 합니다.', async () => {
        const userId = 1;

        const response = await request(app.getHttpServer()).patch(
          `/point/${userId}/use`,
        );

        expect(response.statusCode).toBe(400);
      });

      it('amount가 0보다 작으면 400 에러를 반환해야 합니다.', async () => {
        const userId = 1;
        const amount = -100;

        const response = await request(app.getHttpServer())
          .patch(`/point/${userId}/use`)
          .send({ amount });

        expect(response.statusCode).toBe(400);
      });
    });
  });
});
