const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
require('dotenv').config()

// Models
const Remedy = require('./models/Remedy')
const Feedback = require('./models/Feedback')

// Data
const remediesData = require('./data/remedies.json')

const app = express()
app.use(cors())
app.use(express.json())

// 🔴 MongoDB connection string (hardcoded for now)
const MONGO_URI =
   process.env.MONGO_URI


// ---------------- START SERVER ----------------
async function startServer() {
  try {
    console.log('⏳ Connecting to MongoDB...')
    await mongoose.connect(MONGO_URI)
    console.log('✅ MongoDB connected')

    // Insert remedies only once
    const count = await Remedy.countDocuments()
    if (count === 0) {
      await Remedy.insertMany(remediesData)
      console.log('✅ Remedies inserted')
    }

    app.listen(5000, () => {
      console.log('🚀 Server running on http://localhost:5000')
    })
  } catch (err) {
    console.error('❌ MongoDB error:', err)
  }
}

startServer()

// ---------------- ROUTES ----------------

// GET remedies
app.get('/api/remedies', async (req, res) => {
  const { q, category } = req.query
  const filter = {}

  if (category) filter.category = category

  if (q) {
    filter.$or = [
      { title: new RegExp(q, 'i') },
      { keywords: { $in: [new RegExp(q, 'i')] } },
      { symptoms: { $in: [new RegExp(q, 'i')] } },
    ]
  }

  const remedies = await Remedy.find(filter)
  res.json(remedies)
})

// POST feedback
app.post('/api/feedback', async (req, res) => {
  try {
    const { remedyTitle, rating, comment } = req.body

    if (!remedyTitle || !rating) {
      return res.status(400).json({ message: 'Invalid data' })
    }

    const feedback = new Feedback({
      remedyTitle,
      rating,
      comment,
    })

    await feedback.save()
    res.status(201).json({ message: 'Feedback saved' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

// GET feedback for a remedy
app.get('/api/feedback/:title', async (req, res) => {
  try {
    const feedback = await Feedback.find({
      remedyTitle: req.params.title,
    }).sort({ createdAt: -1 })

    res.json(feedback)
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})
