
const app = require('./app')

const port = process.env.PORT || 3000

app.listen(port, ()=>{
    console.log('Secure server 🔑 🚀 is up and running...at ' + port)
})

