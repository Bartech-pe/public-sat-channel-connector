import { Test, TestingModule } from '@nestjs/testing';
import { ChatsatController } from './chatsat.controller';

describe('ChatsatController', () => {
  let controller: ChatsatController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatsatController],
    }).compile();

    controller = module.get<ChatsatController>(ChatsatController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
