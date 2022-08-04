const express = require('express');
require('./db/mongoose')
// require('./db/connSQL')
require('./db/populateData');

const userRouter = require('./routers/user')
const productRouter =  require('./routers/product')
const clientRouter = require('./routers/client')
const employeeRouter = require('./routers/employee')
const hierarchyRouter = require('./routers/hierarchy')
const usersRouter = require('./routers/users');
const catalogRouter = require('./routers/catalog');
const branchRouter = require('./routers/branch');
const neighborhoodRouter = require('./routers/neighborhood');
const loanRouter = require('./routers/loan');

const app = express()
app.use(express.json({limit: '1mb'}))
app.use(userRouter)
app.use(productRouter)
app.use(clientRouter)
app.use(employeeRouter)
app.use(hierarchyRouter)
app.use(usersRouter)
app.use(catalogRouter)
app.use(branchRouter)
app.use(neighborhoodRouter)
app.use(loanRouter)


module.exports = app