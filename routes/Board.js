const Router = require('koa-router');
const Board = require('../models/Board');
const TodoList = require('../models/TodoList');
const Work = require('../models/Work');
const jwtMiddleware = require('../middleware/JsonWebToken');
const pgPool = require('../middleware/postgreConnect');


const { isNotNullOrUndefined, isNotBlank, isNotDuplicated } = require('../middleware/Validation');

const router = new Router();

router.use(jwtMiddleware());

async function getBoardGroupId(user) {
  const query = 'SELECT bid FROM board_group WHERE uid = $1';
  return pgPool.query(query, [user]);
}
async function getMasterUid(id) {
  const query = 'SELECT masteruid FROM board_group WHERE bid = $1';
  return pgPool.query(query, [id]);
}
async function checkMasterUid(ctx, id, user) {
  try {
    const masterUidResult = await getMasterUid(id);
    const masterUid = masterUidResult.rows[0].masteruid;
    console.log("마스터:", masterUid)
    console.log("user : ", user)
    if (user !== masterUid) {
      return { error: 'unmatchedMaster' }
    }
  } catch (error) {
    console.error('마스터 UID 확인 중 에러 발생:', error);
    ctx.status = 500;
  }
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
    const nextIdQuery = 'SELECT nextval(\'board_group_seq\') AS next_id';
    const nextIdResult = await pgPool.query(nextIdQuery);
    const nextId = nextIdResult.rows[0].next_id;

    const query = 'INSERT INTO board_group (id, bid, masteruid, uid) VALUES ($1, $2, $3, $4)';
    await pgPool.query(query, [nextId, newBoardId, user, user]);
    console.log('board_group 입력 완료');
  } catch (error) {
    console.error('board_group 입력중 에러발생 :',error);
    throw error;
  }
}
async function deleteBoardGroup(id){
  try {
    const query = 'delete from board_group where bid=($1)';
    await pgPool.query(query, [id]);
    console.log('board_group 삭제 완료');
  } catch (error) {
    console.error('board_group 삭제중 에러발생 : ', error);
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

async function checkDuplicateBoardName(user, mainBoard) {
  const bidResult = await getBoardGroupId(user);
  const bids = bidResult.rows.map(row => row.bid);
  const existingMainBoards = await getMainBoardsByBid(bids);
  return existingMainBoards.includes(mainBoard);
}

async function handleBoardCreation(ctx, mainBoard, user) {
  if (isNotNullOrUndefined(mainBoard) && isNotBlank(mainBoard)) {
    const isDuplicate = await checkDuplicateBoardName(user, mainBoard);
    if (!isDuplicate) {
      await createNewBoard(mainBoard, user);
      ctx.status = 201;
    } else {
      ctx.status = 400;
      ctx.body = { error: 'existingBoard' };
    }
  } else {
    ctx.status = 400;
  }
}

async function handleBoardUpdate(ctx, id, mainBoard, user) {
  const error = await checkMasterUid(ctx, id, user);
  if (error) {
    if (error.error === 'unmatchedMaster') {
      ctx.status = 403;
      ctx.body = { error: 'unmatchedMaster' };
    } else {
      ctx.status = 500;
      ctx.body = { error: 'serverError' };
    }
    return;
  }

  const isDuplicate = await checkDuplicateBoardName(user, mainBoard);
  if (!isDuplicate) {
    const updatedBoard = await updateBoardName(id, mainBoard);
    if (updatedBoard) {
      ctx.body = updatedBoard;
      ctx.status = 200;
    } else {
      ctx.status = 404;
    }
  } else {
    ctx.status = 400;
    ctx.body = { error: 'existingBoard', message: '이미 존재하는 보드입니다.' };
  }
}
async function createNewBoard(mainBoard, user) {
  try {
    const newBoard = new Board({ mainBoard });
    await newBoard.save();
    const newBoardId = newBoard.id;
    console.log(`새로운 보드가 추가되었습니다: ${mainBoard}`);
    await insertBoardGroup(newBoardId, user);
    console.log('newBoardID : ',newBoardId, user);
  } catch (error) {
    console.error('보드 추가 중 에러 발생:', error);
    throw error;
  }
}

async function updateBoardName(id, mainBoard) {
  try {
    const updatedBoard = await Board.findByIdAndUpdate(id, { mainBoard }, { new: true });
    return updatedBoard;
  } catch (error) {
    console.error('보드 이름 변경 중 에러 발생:', error);
    throw error;
  }
}
router.post('/api/boards', async (ctx) => {
  const { mainBoard } = ctx.request.body;
  const { user } = ctx.state;
  try {
    await handleBoardCreation(ctx, mainBoard, user);
  } catch (error) {
    console.error('보드 추가 중 에러 발생:', error);
    ctx.status = 500;
  }
});

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
  try {
    await handleBoardUpdate(ctx, id, mainBoard, user);
  } catch (error) {
    console.error('보드 이름 변경 중 에러 발생:', error);
    ctx.status = 500;
  }
});


router.delete('/api/boards/:id', async (ctx) => {
  const { id } = ctx.params;
  const { user } = ctx.state;

  const error = await checkMasterUid(ctx, id, user);
  if (error) {
    if (error.error === 'unmatchedMaster') {
      ctx.status = 405;
      ctx.body = { error: 'unmatchedMaster' };
    } else {
      ctx.status = 500;
      ctx.body = { error: 'serverError' };
    }
    return;
  }
  try {
    const board = await Board.findById( { _id: id});
    if (!board) {
      ctx.status = 404;
      ctx.body = { error: 'Board not found' };
      return;
    }
    await deleteBoardGroup(id);
    await TodoList.deleteMany({ _id: { $in: board.todoLists } });
    await Work.deleteMany({_id: { $in: board.works } });


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
