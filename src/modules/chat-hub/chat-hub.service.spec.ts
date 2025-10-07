import { Test, TestingModule } from '@nestjs/testing';
import { ChatHubService } from './chat-hub.service';

describe('ChatHubService', () => {
  let service: ChatHubService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatHubService],
    }).compile();

    service = module.get<ChatHubService>(ChatHubService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
