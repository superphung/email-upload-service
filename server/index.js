import body from 'body-parser'
var amqp = require('amqplib/callback_api')
import mongoose from 'mongoose'
import * as db from './models'
import jwtMiddleware from 'express-jwt'
import cors from 'cors'
import app from './app'

const SECRET = process.env.SECRET
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost/eventdb'
const amqpUrl = process.env.AMQP_URL || 'amqp://localhost'

mongoose.connect(MONGO_URL)

app.use(cors())

amqp.connect(amqpUrl, function (err, conn) {
  if (err) {
    console.log('err', err)
    process.exit(1)
  }
  conn.createChannel(function (err, ch) {
    if (err) {
      console.log('err', err)
      process.exit(1)
    }
    const q = 'event'

    ch.assertQueue(q)

    app.use(body.json())
    app.use(body.urlencoded({extended: true}))

    app.use((req, res, next) => {
      req.ch = ch
      next()
    })

    app.post('/updatePattern', jwtMiddleware({secret: SECRET}), async (req, res) => {
      const {patterns} = req.body
      if (!patterns) {
        res.status(400).send('missing params')
      }
      const filtered = patterns
        .filter(pattern => pattern && pattern.company && pattern.city && pattern.pattern)
        .map(p => {
          const {company, city, pattern} = p
          return {company, city, pattern}
        })
      if (filtered.length === 0) {
        return res.status(200).json({message: 'ok'})
      }
      await db.Events.create({
        type: 'upload',
        user: req.user.sub,
        patterns: filtered,
        date: new Date()
      })
      console.log('sent', JSON.stringify(filtered))
      req.ch.sendToQueue(q, new Buffer(JSON.stringify(filtered)))
      return res.status(200).json({message: 'ok'})
    })

    app.listen(3001)
  })
})

