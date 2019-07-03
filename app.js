const Tickets = require('./tickets')
const MongoDB = require('fastify-mongodb')
const JWT = require('fastify-jwt')

module.exports = async function (app, opts) {
    app.register(MongoDB, {
        useNewUrlParser: true,
        url: process.env.MONGODB_URL
    })
    app.register(JWT, {secret: process.env.JWT_SECRET})
    app.register(Tickets)
}
