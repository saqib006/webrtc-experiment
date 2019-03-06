const app = require('express')();
const os = require('os')
const server = require('http').Server(app);
const io = require('socket.io')(server)
const next = require('next')
const bodyParser = require('body-parser');
const port = process.env.PORT || 5000
const dev = process.env.NODE_ENV !== 'production'
const nextapp = next({ dev })
const nextHandler = nextapp.getRequestHandler()


io.on('connection', socket  =>  {

  let localId;
  let remoteId;

      socket.on('create or join', room=>{
        var clientsInRoom = io.sockets.adapter.rooms[room];
        var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;

        console.log('numClients ' + numClients)
        
        if(numClients === 0) {
          socket.join(room)
          console.log('client id' + socket.id + 'created room' + room)
          localId = socket.id
          socket.emit('created', room, socket.id)
        }
        else if(numClients === 1){
          console.log('client id' + socket.id + 'joined room' + room)
          socket.join(room)
          remoteId = socket.id
          socket.emit('joined', room, socket.id)

          socket.broadcast.to(room).emit('broadcast: joined', + socket.id + ' joined channel '+ room);
          io.to(room).emit('message', 'ready')
        
        }else{
          socket.emit('full', room)
        }

      })

  

    socket.on('message', data => {
      console.log('server', data)
      io.to(room).emit('message', data)
     

    /*  if(remoteId){
        console.log('joined remote', data)
        socket.broadcast.to(room).emit('message', 'hello remote');
      }
      else{
        console.log('not joined')
      }*/
    })

       /* socket.on('ipaddr', ()=>{
        let ifaces = os.networkInterfaces();
        for(let dev in ifaces){
          ifaces[dev].forEach((details)=>{
            if(details.family === 'IPv4' && details.address !== '127.0.0.1'){
              socket.emit('ipaddr', details.address)
            }
          })
        }
      })*/
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