const Router = require('koa-router');
const Board = require('../models/Board');
const TodoList = require('../models/TodoList');
const Work = require('../models/Work');
const jwtMiddleware = require('../middleware/JsonWebToken');
const pgPool = require('../middleware/postgreConnect');


const { isNotNullOrUndefined, isNotBlank, isNotDuplicated } = require('../middleware/Validation');

const router = new Router();

router.use(jwtMiddleware());

router.post('/api/boards', async (ctx) => {
  const { mainBoard } = ctx.request.body;
  const { user } = ctx.state;

  if (isNotNullOrUndefined(mainBoard) && isNotBlank(mainBoard)) {
    try {
      const bidResult = await getBoardGroupId(user);
      const bids = bidResult.rows.map(row => row.bid);
      console.log('bids: ',bids);
      // if (!bids || bids.length === 0) {
      //   throw new Error('일치하는 bid 못찾음');
      // }

      const existingMainBoards = await getMainBoardsByBid(bids);

      let isDuplicate = false;
      for (const existingMainBoard of existingMainBoards) {
        if (existingMainBoard === mainBoard) {
          isDuplicate = true;
          break;
        }
      }


      if (!isDuplicate) {
        const newBoard = new Board({ mainBoard });
        await newBoard.save();
        const newBoardId = newBoard.id;
        console.log(`새로운 보드가 추가되었습니다: ${mainBoard}`);

        await insertBoardGroup(newBoardId, user);
        console.log('newBoardID : ',newBoardId, user);
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
async function getBoardGroupId(user) {
  const query = 'SELECT bid FROM board_group WHERE uid = $1';
  return pgPool.query(query, [user]);
}
async function getMainBoardsByBid(bids) {
  try {
    const mainBoards = [];
    for (const bid of bids) {
      const board = await Board.findOne({ _id : bid });
      if (board !== null) {
        mainBoards.push(board.mainBoard);
      }
    }

    return mainBoards;
  } catch (error) {
    console.error('다수 mainBoard 가져오기 중 에러 발생:', error);
    throw error;
  }
}
async function insertBoardGroup(newBoardId, user){
  try {
    const query = 'INSERT INTO board_group (bid, uid, master_uid)' +
      'VALUES ($1, $2, $3)';
    await pgPool.query(query, [newBoardId, user, user]);
    console.log('board_group 입력 완료');
  } catch (error) {
    console.error('board_group 입력중 에러발생 :',error);
    throw error;
  }
}
async function getBoardsByBid(bids) {
  try {
    const boards = [];
    for (const bid of bids) {
      const board = await Board.findOne({ _id : bid });
      if (board !== null) {
        boards.push(board);
      }
    }

    return boards;
  } catch (error) {
    console.error('다수 mainBoard 가져오기 중 에러 발생:', error);
    throw error;
  }
}
router.get('/api/boards', async (ctx) => {
  const { user } = ctx.state;

  try {
    const bidResult = await getBoardGroupId(user);
    const bids = bidResult.rows.map(row => row.bid);
    console.log("보드 : ", bids);

    const boards = await getBoardsByBid(bids);

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
  const { user } = ctx.state;

  if (isNotNullOrUndefined(mainBoard) && isNotBlank(mainBoard)) {
    try {
      const existingBoards = await Board.find( { user });

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
  const { user } = ctx.state;

  try {
    const board = await Board.findById( { _id: id, user});
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
