const mongoose = require('mongoose')

const RemedySchema = new mongoose.Schema({
  title: String,
  category: String,
  symptoms: [String],
  ingredients: [String],
  instructions: String,
  benefits: String,
  source: String,
  keywords: [String],
})

module.exports = mongoose.model('Remedy', RemedySchema)
