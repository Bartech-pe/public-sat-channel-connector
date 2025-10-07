import { Test, TestingModule } from '@nestjs/testing';
import { ChatHubGateway } from './chat-hub.gateway';

describe('ChatHubGateway', () => {
  let gateway: ChatHubGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatHubGateway],
    }).compile();

    gateway = module.get<ChatHubGateway>(ChatHubGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
