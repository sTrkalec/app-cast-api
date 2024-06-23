import { Test, TestingModule } from '@nestjs/testing';
import { SuccessExceptionsService } from './success-exceptions.service';

describe('SuccessExceptionsService', () => {
  let service: SuccessExceptionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SuccessExceptionsService],
    }).compile();

    service = module.get<SuccessExceptionsService>(SuccessExceptionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
