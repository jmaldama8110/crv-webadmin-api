const express = require('express');
require('./db/mongoose')
// require('./db/connSQL')
require('./db/populateData');
require('./db/connCouch');

const userRouter = require('./routers/user');
const productRouter =  require('./routers/product');
const clientRouter = require('./routers/client');
const employeeRouter = require('./routers/employee');
const hierarchyRouter = require('./routers/hierarchy');
const usersRouter = require('./routers/users');
const catalogRouter = require('./routers/catalog');
const branchRouter = require('./routers/branch');
const neighborhoodRouter = require('./routers/neighborhood');
const loanRouter = require('./routers/loan');
const notificationRouter = require('./routers/notification');
const paymentIntermediareRouter = require('./routers/paymentIntermediarie');
const attachedFileRouter = require('./routers/attachedFile');
const signUpRouter =  require('./routers/signup');
// const contractRouter = require('./routers/contract');
const rccFycoRouter =  require('./routers/rccfyco');
const guaranteeRouter = require('./routers/guarantee');
const identityRouter = require('./routers/identityimg');
const socioeconomicRouter = require('./routers/socioeconomic');
const emailsWebSiteRouter = require('./routers/emailsWebSite');
const coundbRouter = require('./routers/couchdb');

const app = express()
app.use(express.json({limit: '50mb'}))
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
app.use(notificationRouter)
app.use(paymentIntermediareRouter)
app.use(attachedFileRouter)
app.use(signUpRouter)
// app.use(contractRouter)
app.use(rccFycoRouter)
app.use(guaranteeRouter)
app.use(identityRouter)
app.use(socioeconomicRouter)
app.use(emailsWebSiteRouter)

app.use(coundbRouter);


module.exports = app