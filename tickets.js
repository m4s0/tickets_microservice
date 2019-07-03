'use strict'

module.exports = async function (fastify, opts) {
    const tickets = fastify.mongo.db.collection('tickets')
    const {ObjectId} = fastify.mongo

    fastify.addHook('preHandler', function (request, reply) {
        return request.jwtVerify()
    })

    const ticketSchema = {
        type: 'object',
        required: ['title', 'body'],
        properties: {
            _id: {type:'string'},
            title: {type: 'string'},
            body: {type: 'string'}
        }
    }


    const schema = {
        body: ticketSchema
    }

    fastify.post('/', {schema}, async function (request, reply) {
        const data = await tickets.insertOne(
            Object.assign({
                    username: request.user.username
                },
                request.body)
        )

        const _id = data.ops[0]._id

        reply
            .code(201)
            .header('location', `${this.prefix}/${_id}`)

        return Object.assign({
            _id
        }, request.body)
    })

    fastify.get('/',
        {
            schema: {
                response: {
                    '2xx': {
                        type: 'object',
                        properties: {
                            tickets: {
                                type: 'array',
                                items: ticketSchema
                            }
                        }
                    }
                }
            }
        }, async function (request, reply) {
            const array = await tickets.find({
                username: request.user.username
            }).sort({
                _id: -1
            }).toArray()

            return {tickets: array}
        })

    fastify.get('/:id',
        {
            schema: {
                response: {
                    '2xx': ticketSchema
                }
            }
        }, async function (request, reply) {
            const id = request.params.id

            const data = await tickets.findOne({
                _id: new ObjectId(id),
                username: request.user.username
            })

            if (!data) {
                reply.code(404)
                return {status: 'not ok'}
            }

            return data
        })
}

module.exports.autoPrefix = '/tickets'
