import { Test, TestingModule } from '@nestjs/testing';
import { AllExceptionsService } from './all-exceptions.service';

describe('AllExceptionsService', () => {
  let service: AllExceptionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AllExceptionsService],
    }).compile();

    service = module.get<AllExceptionsService>(AllExceptionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
