const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    topic: { type: String, required: true, index: true },
    name: { type: String, required: true },
    link: { type: String, default: '' },
    isDone: { type: Boolean, default: false },
    isStarred: { type: Boolean, default: false },
    notes: { type: String, default: '' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Question', questionSchema);
