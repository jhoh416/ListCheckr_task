const mongoose = require('mongoose');
const Work = require('./Work');
const Board = require('./Board');

const todoListSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    default: 'LIST1'
  },

  works: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Work',
    },
  ],
  board: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board',
    autoPopulate: { select: 'todoLists', maxDepth: 1},
  },
});

todoListSchema.pre('deleteOne', async function(next) {
  try {
    await Work.deleteMany({ _id: { $in: this.works } });

    next();
  } catch (error) {
    next(error);
  }
});
todoListSchema.plugin(require('mongoose-autopopulate'));

const TodoList = mongoose.model('TodoList', todoListSchema);

module.exports = TodoList;
