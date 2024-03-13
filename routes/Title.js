const Board = require('../models/Board');
const TodoList = require('../models/TodoList');
const Router = require('koa-router');

const router = new Router();

router.post('/api/boards/:boardId/todolist/:todolistId/title', async (ctx) => {
  try {
    const { boardId, todoListId } = ctx.params;
    const { title } = ctx.request.body;

    const board = await Board.findById(boardId);
    const todolist = await TodoList.findById(todoListId);

    if (!board || !todolist) {
      ctx.status = 404;
      ctx.body = { error: 'Board or TodoList not found' };
      return;
    }
    todolist.title = title;
    await todolist.save();

    ctx.status = 200;
    ctx.body = { message: 'Title updated successfully' };
  } catch (error) {
    console.error('Error updating title:', error);
    ctx.status = 500;
    ctx.body = { error: 'Internal Server Error' };
  }
});

router.get('/api/boards/:boardId/todolist/:todolistId/title', async (ctx) => {

  try {
    const { boardId, todolistId } = ctx.params;

    const todolist = await TodoList.findById(todolistId);

    if (!todolist) {
      ctx.status = 404;
      ctx.body = { error: 'TodoList not found' };
      return;
    }

    ctx.status = 200;
    ctx.body = { title: todolist.title };
  } catch (error) {
    console.error('Error retrieving title:', error);
    ctx.status = 500;
    ctx.body = { error: 'Internal Server Error' };
  }
});

router.patch('/api/boards/:boardId/todolist/:todolistId/title', async (ctx) => {
  try {
    const { boardId, todolistId } = ctx.params;
    const { title } = ctx.request.body;

    const board = await Board.findById(boardId);
    const todolist = await TodoList.findById(todolistId);

    if (!board || !todolist) {
      ctx.status = 404;
      ctx.body = { error: 'Board or TodoList not found' };
      return;
    }

    todolist.title = title;
    await todolist.save();

    ctx.status = 200;
    ctx.body = { message: 'Title updated successfully' };
  } catch (error) {
    console.error('Error updating title:', error);
    ctx.status = 500;
    ctx.body = { error: 'Internal Server Error' };
  }
});
module.exports = router;