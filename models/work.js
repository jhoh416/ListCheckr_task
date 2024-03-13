// work.js

const mongoose = require('mongoose');

const workSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true,
  },
  detail: {
    type: String,
    default: '',
  },
  checked: {
    type: Boolean,
    default: false,
  },
  todoList: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TodoList',
    autoPopulate: { select: 'works', maxDepth: 1 },
  },
  board: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board',
    autoPopulate: { select: 'works', maxDepth: 1 },
  },
});

const Work = mongoose.model('Work', workSchema);

module.exports = Work;
