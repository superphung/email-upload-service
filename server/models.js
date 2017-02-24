import mongoose from 'mongoose'

const eventsSchema = mongoose.Schema({
  type: {type: String},
  user: {type: String},
  patterns: [{}],
  date: {type: Date}
})

const Events = mongoose.model('Event', eventsSchema)

export {
  Events
}
