const koa = require('koa');
const cors = require('koa2-cors');
const bodyParser = require('koa-bodyparser');
const mongoose = require('mongoose');
const boardsRouter = require('../routes/Board');
const todoListRouter = require('../routes/TodoList');
const titleRouter = require('../routes/Title');
const workRouter = require('../routes/Work');
const jwtMiddleware = require('../middleware/JsonWebToken');
const pgPool = require('../middleware/postgreConnect');
const http = require('http');
const webSocket = require('koa-websocket');

const app = webSocket(new koa());
const PORT = 3001;

app.use(cors());
app.use(bodyParser());
app.use(jwtMiddleware());

const io = require('socket.io')(app.server);
io.on('connection', (socket) => {
    console.log('Socket.IO connected: ', socket.id);

    socket.on('message', (data) => {
        console.log('socket data: ', data);
        socket.broadcast.emit('message', data);
    })
    socket.on('disconnect', () => {
        console.log('Socket.IO disconnected:', socket.id);
    })
})
mongoose.connect('mongodb://localhost:27015/todo', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.log(err));

pgPool.connect()
  .then(() => console.log('PostgreSQL Connected...'))
  .catch(err => console.error('Error connecting to PostgreSQL:', err));

app.use(boardsRouter.routes());
app.use(todoListRouter.routes());
app.use(titleRouter.routes());
app.use(workRouter.routes());

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
