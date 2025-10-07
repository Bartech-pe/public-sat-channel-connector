import { Test, TestingModule } from '@nestjs/testing';
import { ChatsatService } from './chatsat.service';

describe('ChatsatService', () => {
  let service: ChatsatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatsatService],
    }).compile();

    service = module.get<ChatsatService>(ChatsatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
