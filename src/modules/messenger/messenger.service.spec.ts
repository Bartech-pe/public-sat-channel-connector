import { Test, TestingModule } from '@nestjs/testing';
import { FacebookMessengerService } from './messenger.service';

describe('MessengerService', () => {
  let service: FacebookMessengerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FacebookMessengerService],
    }).compile();

    service = module.get<FacebookMessengerService>(FacebookMessengerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
