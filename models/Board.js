const mongoose = require('mongoose');
const TodoList = require('./TodoList');
const Work = require('./Work');

const boardSchema = new mongoose.Schema({
  mainBoard: {
    type: String,
    required: true,
  },
  todoLists: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TodoList',
    },
  ],
  works: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Work',
    },
  ],
  // user: {
  //   type: String,
  //   ref: 'User',
  //   required: true,
  // },
});

boardSchema.pre('deleteOne', async function(next) {
  try {

    await TodoList.deleteMany({ _id: { $in: this.todoLists } });
    await Work.deleteMany({ _id: { $in: this.works } });
    next();
  } catch (error) {
    next(error);
  }
});

const Board = mongoose.model('Board', boardSchema);

module.exports = Board;