// work.js

const Router = require('koa-router');
const Work = require('../models/Work');
const TodoList = require('../models/TodoList');
const Board = require('../models/Board')

const router = new Router();

// Work 추가
router.post('/api/boards/:boardId/todolist/:todoListId/work', async (ctx) => {
  try {
    const { todoListId, boardId } = ctx.params;
    const { subject, detail } = ctx.request.body;

    // Work 모델에 저장
    const newWork = new Work({
      subject,
      detail: detail || '',
      todoList: todoListId,
      board: boardId,
    });

    await newWork.save();

    const todoList = await TodoList.findById(todoListId);
    todoList.works.push(newWork);
    await todoList.save();

    const board = await  Board.findById(boardId);
    board.works.push(newWork);
    await board.save();

    ctx.status = 201;
    ctx.body = newWork;
  } catch (error) {
    console.error('Work 추가 중 에러 발생:', error);
    ctx.status = 500;
    ctx.body = { error: 'Internal Server Error' };
  }
});

router.get('/api/boards/:boardId/todolist/:todoListId/work', async (ctx) => {
  const { todoListId } = ctx.params;

  try {
    const todoList = await TodoList.findById(todoListId).populate('works');
    if (!todoList) {
      ctx.status = 404;
      ctx.body = { error: 'TodoList not found' };
      return;
    }

    ctx.body = todoList.works;
    ctx.status = 200;
  } catch (error) {
    console.error('워크 조회 중 에러 발생:', error);
    ctx.status = 500;
  }
});
router.delete('/api/boards/:boardId/todolist/:todoListId/work/:workId', async (ctx) => {
  const { boardId, todoListId, workId } = ctx.params;
  console.log("워크 : ", workId);
  try {
    const work = await Work.findById(workId);
    if (!work) {
      ctx.status = 404;
      ctx.body = { error: 'work not found' };
      return;
    }

    const board = await Board.findById(boardId);
    if (board) {
      board.works.pull(workId);
      await board.save();
    }

    const todoList = await TodoList.findById(todoListId);
    if (todoList) {
      todoList.works.pull(workId);
      await todoList.save();
    }

    await work.deleteOne();

    ctx.status = 200;
    ctx.body = { message: 'Work deleted successfully' };

  } catch (error) {
    console.error('work 삭제중 에러 발생: ',error);
    ctx.status = 500;
    ctx.body = { error: 'Internal Server Error' };
  }

});
router.patch('/api/:workId/subject', async (ctx) => {
  try {
    const { workId } = ctx.params;
    const { subject } = ctx.request.body;

    const work = await Work.findById(workId);

    if(!work){
      ctx.status = 404;
      ctx.body = { error: 'work not fount' };
      return;
    }

    work.subject = subject;
    await work.save();

    ctx.status = 200;
    ctx.body = { message: 'Subject updated sucessfully' };
  } catch (error) {
    console.error('error updating subject:', error);
    ctx.status = 500;
    ctx.body = { error: 'Internal Server Error' };
  }
});
router.patch('/api/:workId/detail', async (ctx) => {
  try {
    const { workId } = ctx.params;
    const { detail } = ctx.request.body;

    const work = await Work.findById(workId);

    if(!work){
      ctx.status = 404;
      ctx.body = { error: 'work not fount' };
      return;
    }

    work.detail = detail;
    await work.save();

    ctx.status = 200;
    ctx.body = { message: 'Detail updated sucessfully' };
  } catch (error) {
    console.error('error updating detail:', error);
    ctx.status = 500;
    ctx.body = { error: 'Internal Server Error' };
  }
});
router.patch('/api/boards/:boardId/todolist/:todoListId/work/:workId/checked', async (ctx) => {
  try {
    const { workId } = ctx.params;
    const { checked } = ctx.request.body;

    const work = await Work.findById(workId);

    if(!work){
      ctx.status = 404;
      ctx.body = { error: 'work not fount' };
      return;
    }

    work.checked = checked;
    await work.save();

    ctx.status = 200;
    ctx.body = { message: 'checked updated sucessfully' };
  } catch (error) {
    console.error('error updating checked:', error);
    ctx.status = 500;
    ctx.body = { error: 'Internal Server Error' };
  }
});
module.exports = router;
