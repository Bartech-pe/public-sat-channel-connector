import { Test, TestingModule } from '@nestjs/testing';
import { ChatsatGateway } from './chatsat.gateway';
import { ChatsatService } from './chatsat.service';

describe('ChatsatGateway', () => {
  let gateway: ChatsatGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatsatGateway, ChatsatService],
    }).compile();

    gateway = module.get<ChatsatGateway>(ChatsatGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
