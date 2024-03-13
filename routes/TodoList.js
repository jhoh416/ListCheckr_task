const Router = require('koa-router');
const Board = require('../models/Board');
const TodoList = require('../models/TodoList');
const Work = require('../models/Work');
const { isNotNullOrUndefined, isNotBlank, isNotDuplicated } = require('../middleware/Validation');

const router = new Router();

router.post('/api/boards/:boardId/todolist', async (ctx) => {
  const { boardId } = ctx.params;
  const { title } = ctx.request.body;

  try {
    const board = await Board.findById(boardId);
    if (!board) {
      ctx.status = 404;
      ctx.body = { error: 'Board not found' };
      return;
    }

    const newTodoList = new TodoList({ title, board });
    await newTodoList.save();

    board.todoLists.push(newTodoList);
    await board.save();

    ctx.status = 201;
    console.log(`새로운 todo가 추가되었습니다: ${title}`);
    const todoLists = await TodoList.find({ board: board._id});
    console.log('TodoLists:', todoLists);
  } catch (error) {
    console.error('할 일 목록 추가 중 에러 발생:', error);
    ctx.status = 500;
  }
});

router.get('/api/boards/:boardId/todolist', async (ctx) => {
  const { boardId } = ctx.params;

  try {
    const board = await Board.findById(boardId).populate('todoLists');
    if (!board) {
      ctx.status = 404;
      ctx.body = { error: 'Board not found' };
      return;
    }

    ctx.body = board.todoLists;
    ctx.status = 200;
  } catch (error) {
    console.error('할 일 목록 조회 중 에러 발생:', error);
    ctx.status = 500;
  }
});
router.delete('/api/boards/:boardId/todolist/:todoListId', async (ctx) => {
  const { boardId, todoListId } = ctx.params;

  try {

    const board = await Board.findById(boardId);
    if (!board) {
      ctx.status = 404;
      ctx.body = { error: 'Board not found' };
      return;
    }

    const todoList = await TodoList.findById(todoListId);
    if (!todoList) {
      ctx.status = 404;
      ctx.body = { error: 'TodoList not found' };
      return;
    }

    const worksToDelete = todoList.works.map(work => work._id);
    await Work.deleteMany({ _id: { $in: worksToDelete } });

    board.works.pull(...worksToDelete);
    await board.save();

    await todoList.deleteOne({ _id: todoList._id });
    board.todoLists.pull(todoList);
    await board.save();
    ctx.status = 204;
  } catch (error) {
    console.error('할 일 목록 삭제 중 에러 발생:', error);
    ctx.status = 500;
  }
});
module.exports = router;