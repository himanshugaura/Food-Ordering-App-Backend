import { Server } from "socket.io";
import { Server as HttpServer } from "http";

interface ServerToClientEvents {
  placeOrder: (payload: { data: any; message: string }) => void;
  orderUpdated: (payload: { data: any; message: string }) => void;
}

interface ClientToServerEvents {
  joinRoom: (room: string) => void;
}

let io: Server<ClientToServerEvents, ServerToClientEvents>;

export const initSocket = (httpServer: HttpServer) => {
  io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    },
    transports: ["websocket"], 
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("joinRoom", (room) => {
      socket.join(room);
      console.log(`Socket ${socket.id} joined room: ${room}`);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
};

export const emitPlaceOrder = (order: any) => {
  const storeRoom = `store:orders`; 
  io.to(storeRoom).emit("placeOrder", {
    data: order,
    message: `New order placed`,
  });
};

export const emitOrderUpdated = (order: any) => {
  const userRoom = `user:${order.userId}`;
  io.to(userRoom).emit("orderUpdated", {
    data: order,
    message: `Order #${order.orderNo} status updated to ${order.status}`,
  });
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
};
