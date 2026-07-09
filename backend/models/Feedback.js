const mongoose = require('mongoose')

const feedbackSchema = new mongoose.Schema(
  {
    remedyTitle: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '' },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Feedback', feedbackSchema)
