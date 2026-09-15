import { Injectable } from '@nestjs/common';

@Injectable()
export class ChatService {
  // NestJS tarafında socket nesnelerini genellikle Gateway yönetir, 
  // ancak servise bir mantık kuracaksanız buraya yazabilirsiniz.
  
  constructor() {}

  getHello(): string {
    return 'Chat Service Çalışıyor';
  }
}
