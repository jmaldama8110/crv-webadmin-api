const express = require('express');
require('./db/mongoose')

const userRouter = require('./routers/user')
const productRouter =  require('./routers/product')
const clientRouter = require('./routers/client')
const employeeRouter = require('./routers/employee')
const positionRouter = require('./routers/positions')

const app = express()

app.use( express.json() )
app.use(userRouter)
app.use(productRouter)
app.use(clientRouter)
app.use(employeeRouter)
app.use(positionRouter)


module.exports = app