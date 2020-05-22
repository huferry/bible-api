const createService = require('./bibleService')
const express = require('express')
const bodyParser = require('body-parser')

const app = express()
const port = 8080

createService().then(service => {
    console.log('Bible service is ready.')

    app.use(bodyParser.json())

    app.get('/verses', (req, res) => {
        try {
            if (!req.body || !req.body.query) {
                res.json([])
                return
            }
            const query = service.parse(req.body.query)
            const verses = query.length > 0 
                ? service.query(query[0])
                : []
                
            res.json({
                query: query[0],
                verses
            })
        } catch(err) {
            res.status(500).send(err)
        }
    })

    app.listen(port, () => console.log(`Application is listening on port ${port}.`))
})
