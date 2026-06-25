import { Module, Global } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';

@Global() // @Global dekoratörü sayesinde bu modülü diğer servislerde tek tek import etmeden doğrudan kullanabiliriz
@Module({
  providers: [SocketGateway],
  exports: [SocketGateway],
})
export class SocketModule {}
