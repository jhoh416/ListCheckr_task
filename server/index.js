const koa = require('koa');
const cors = require('koa2-cors');
const bodyParser = require('koa-bodyparser');
const mongoose = require('mongoose');
const boardsRouter = require('../routes/Board');
const todoListRouter = require('../routes/TodoList');
const titleRouter = require('../routes/Title');
const workRouter = require('../routes/Work');

const app = new koa();
const PORT = 3001;

app.use(cors());
app.use(bodyParser());

mongoose.connect('mongodb://localhost:27015/todo', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.log(err));

app.use(boardsRouter.routes());
app.use(todoListRouter.routes());
app.use(titleRouter.routes());
app.use(workRouter.routes());

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
