const express = require('express');
require('./db/mongoose')

const userRouter = require('./routers/user')
const productRouter =  require('./routers/product')
const clientRouter = require('./routers/client')
const employeeRouter = require('./routers/employee')
const hierarchyRouter = require('./routers/hierarchy')

const app = express()

app.use(express.json())
app.use(userRouter)
app.use(productRouter)
app.use(clientRouter)
app.use(employeeRouter)
app.use(hierarchyRouter)


module.exports = app