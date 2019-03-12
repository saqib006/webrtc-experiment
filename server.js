const app = require('express')();
const os = require('os')
const fs = require('fs')
const server = require('http').createServer(app)
const io = require('socket.io')(server)
const next = require('next')
const bodyParser = require('body-parser');
const port = process.env.PORT || 5000
const dev = process.env.NODE_ENV !== 'production'
const nextapp = next({ dev })
const nextHandler = nextapp.getRequestHandler()


/*var httpsOptions = {
      key: fs.readFileSync('./ssl/localhost.key'),
      cert: fs.readFileSync('./ss/localhost.cert')
  };
*/
io.on('connection', socket  =>  {

  let users = {}

      socket.on('user', name=>{
        if(name != ''){
          users.id = socket.id
          users.name = name
        }
        socket.broadcast.emit('user', users)
        console.log('user', name)
      })

  

    socket.on('message', data => {
      console.log('server', data)
      socket.broadcast.emit('message', data)
     // io.to(roomName).emit('message', data)
     
    })

       
})




nextapp.prepare()
  .then(() => {

    app.use(bodyParser())
    app.use(bodyParser.urlencoded({ extended: false })) 
    app.use(bodyParser.json())

    app.use(function(req, res, next) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
      next();
    });



    app.get('/', (req, res) => {  
      nextapp.render(req, res, '/index')
    })


    app.get('*', (req, res) => {
      return nextHandler(req, res)
    })

    server.listen(port, (err) => {
      if (err) throw err
      console.log(`> Ready on http://localhost:${port}`)
    })
  })