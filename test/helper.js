'use strict'

// This file contains code that we reuse
// between our tests.

const Fastify = require('fastify')
const fp = require('fastify-plugin')
const Tickets = require('../tickets')
const MongoDB = require('fastify-mongodb')
const jwt = require('fastify-jwt')


const clean = require('mongo-clean')
const {MongoClient} = require('mongodb')
const {beforeEach, tearDown, test} = require('tap')
const url = 'mongodb://localhost:27017'
const database = 'tests'

let client

beforeEach(async function () {
    if (!client) {
        client = await MongoClient.connect(url, {
            w: 1,
            useNewUrlParser: true
        })
    }
    await clean(client.db(database))
})

tearDown(async function () {
    if (client) {
        await client.close()
        client = null
    }
})

// Fill in this config with all the configurations
// needed for testing the application
function config() {
    return {
        auth: {
            secret: 'averyverylongsecret'
        },
        mongodb: {
            client,
            database
        }
    }
}

// automatically build and tear down our instance
function build(t) {
    const app = Fastify()

    const _conf = config()
    app.register(MongoDB, _conf.mongodb)
    app.register(jwt, {secret: 'random123'})

    // fastify-plugin ensures that all decorators
    // are exposed for testing purposes, this is
    // different from the production setup
    app.register(fp(Tickets), _conf)

    // tear down our app after we are done
    t.tearDown(app.close.bind(app))

    return app
}

async function createUser(t, app, {username}) {
    await app.ready()
    return app.jwt.sign({username})
}

function testWithLogin(name, fn) {
    test(name, async (t) => {
        const app = build(t)

        const token = await createUser(t, app, {
            username: 'matteo',
            password: 'matteo'
        })

        function inject(opts) {
            opts = opts || {}
            opts.headers = opts.headers || {}
            opts.headers.authorization = `Bearer ${token}`

            return app.inject(opts)
        }

        return fn(t, inject)
    })
}

module.exports = {
    config,
    build,
    createUser,
    testWithLogin
}
