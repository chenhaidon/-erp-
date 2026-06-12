import { OnGatewayConnection, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import type { Server, Socket } from "socket.io";

@WebSocketGateway({ cors: true, namespace: "/events" })
export class EventsGateway implements OnGatewayConnection {
  @WebSocketServer()
  private server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  handleConnection(client: Socket) {
    // Authentication is handled via the 'authenticate' message
    client.data.authenticated = false;
  }

  @SubscribeMessage("authenticate")
  async handleAuthenticate(client: Socket, payload: { token: string; factoryId: string }) {
    try {
      const secret = this.configService.get<string>("JWT_ACCESS_SECRET");
      const decoded = this.jwtService.verify<{ tenantId: string; factoryId: string }>(payload.token, { secret });
      const factoryId = payload.factoryId || decoded.factoryId;
      const room = `tenant:${decoded.tenantId}:factory:${factoryId}`;
      await client.join(room);
      client.data.authenticated = true;
      client.data.room = room;
      client.emit("authenticated", { room });
    } catch {
      client.emit("auth_error", { message: "Invalid token" });
      client.disconnect();
    }
  }

  emit(room: string, event: string, data: unknown) {
    this.server.to(room).emit(event, data);
  }
}
