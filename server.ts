import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

let board: ("X" | "O" | null)[] = Array(9).fill(null);
let currentPlayer: "X" | "O" = "X";

io.on("connection", (socket: Socket) => {
  console.log("Novo jogador conectado");
  socket.emit("updateBoard", { newBoard: board, nextPlayer: currentPlayer });

  socket.on(
    "play",
    ({ index, player }: { index: number; player: "X" | "O" }) => {
      if (board[index] || player !== currentPlayer) return;
      board[index] = player;
      currentPlayer = player === "X" ? "O" : "X";

      io.emit("updateBoard", { newBoard: board, nextPlayer: currentPlayer });

      const { winner, winningCells } = checkWinner();
      if (winner || !board.includes(null)) {
        io.emit("gameOver", { winner: winner || "Empate", winningCells });
        board = Array(9).fill(null);
        currentPlayer = "X";
      }
    }
  );
  socket.on("disconnect", () => console.log("Jogador desconectado"));

  socket.on("newGame", () => {
    board = Array(9).fill(null);
    currentPlayer = "X";
    io.emit("updateBoard", { newBoard: board, nextPlayer: currentPlayer });
  });
});

const checkWinner = (): {
  winner: "X" | "O" | null;
  winningCells: number[];
} => {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (const line of lines) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], winningCells: line };
    }
  }
  return { winner: null, winningCells: [] };
};

server.listen(3000, () =>
  console.log("Servidor WebSocket rodando na porta 3000")
);
