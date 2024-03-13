const Router = require('koa-router');
const Board = require('../models/Board');
const TodoList = require('../models/TodoList');
const Work = require('../models/Work');

const { isNotNullOrUndefined, isNotBlank, isNotDuplicated } = require('../middleware/Validation');

const router = new Router();

router.post('/api/boards', async (ctx) => {
  const { mainBoard } = ctx.request.body;

  if (isNotNullOrUndefined(mainBoard) && isNotBlank(mainBoard)) {
    try {
      const existingBoards = await Board.find();

      if (isNotDuplicated(mainBoard, existingBoards.map(board => board.mainBoard))) {
        const newBoard = new Board({ mainBoard });
        await newBoard.save();
        console.log(`새로운 보드가 추가되었습니다: ${mainBoard}`);
        ctx.status = 201;
      } else {
        ctx.status = 400;
        ctx.body = { error: 'existingBoard' };
      }
    } catch (error) {
      console.error('보드 추가 중 에러 발생:', error);
      ctx.status = 500;
    }
  } else {
    ctx.status = 400;
  }
});

router.get('/api/boards', async (ctx) => {
  try {
    const boards = await Board.find();
    ctx.body = boards;
    ctx.status = 200; // OK
  } catch (error) {
    console.error('보드 목록 조회 중 에러 발생:', error);
    ctx.status = 500;
  }
});

router.patch('/api/boards/:id', async (ctx) => {
  const { id } = ctx.params;
  const { mainBoard } = ctx.request.body;

  if (isNotNullOrUndefined(mainBoard) && isNotBlank(mainBoard)) {
    try {
      const existingBoards = await Board.find();

      if (isNotDuplicated(mainBoard, existingBoards.map(board => board.mainBoard))) {
        const updatedBoard = await Board.findByIdAndUpdate(id, { mainBoard }, { new: true });

        if (updatedBoard) {
          console.log(`보드 이름이 성공적으로 변경되었습니다: ${mainBoard}`);
          ctx.body = updatedBoard;
          ctx.status = 200; // OK
        } else {
          ctx.status = 404; // Not Found
        }
      } else {
        ctx.status = 400;
        ctx.body = { error: 'existingBoard' };
      }
    } catch (error) {
      console.error('보드 이름 변경 중 에러 발생:', error);
      ctx.status = 500;
    }
  } else {
    ctx.status = 400;
  }
});
router.delete('/api/boards/:id', async (ctx) => {
  const { id } = ctx.params;

  try {
    const board = await Board.findById(id);
    if (!board) {
      ctx.status = 404;
      ctx.body = { error: 'Board not found' };
      return;
    }

    await TodoList.deleteMany({ _id: { $in: board.todoLists } });
    await Work.deleteMany({_id: { $in: board.works } });

    // 보드 삭제
    const deletedBoard = await board.deleteOne();

    if (deletedBoard) {
      console.log(`보드가 성공적으로 삭제되었습니다: ${deletedBoard.mainBoard}`);
      ctx.body = deletedBoard;
      ctx.status = 200; // OK
    } else {
      ctx.status = 404; // Not Found
    }
  } catch (error) {
    console.error('보드 삭제 중 에러 발생:', error);
    ctx.status = 500;
  }
});


module.exports = router;
