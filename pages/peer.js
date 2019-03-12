import React, { Component } from 'react'
import io from 'socket.io-client';
export default class peer extends Component {

    state = {
        socket:null,
        room:'',
        localStream:null,
        pc1:null,
        pc2:null,
        servers:null,
        isInitiator:false,
        isChannelReady:false,
        isStarted:false,
        localUser:null,
        remoteUser:null
        
    }

    localVideo = React.createRef();
    remoteVideo = React.createRef();

    constraints = {
        video: {
          mandatory: {
          minWidth: 480,
          minHeight: 320,
          maxWidth: 1024,
          maxHeight: 768
          }
        },
      audio: false
      };

    initMedia = () => {

        navigator.getUserMedia = navigator.getUserMedia ||
        navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

        navigator.mediaDevices.getUserMedia(this.constraints)
                .then(this.gotUserMedia).catch((err)=>{
                  console.log('get user media err', err.name, err.message)
                })
    }

   
    gotUserMedia = (stream) => {
        let localVideo = this.localVideo.current
        if ("srcObject" in localVideo) {
            localVideo.srcObject = stream;
        } else {
        // Avoid using this in new browsers, as it is going away.
        localVideo.src = window.URL.createObjectURL(stream);
        }
        this.setState({
        //isChannleReady:true,
        localStream:stream
        })

        console.log('adding local stream')

        this.sendMessage('Got User Media')

       
    }

    handleIceCandidate = (pc1, eve) => {
        console.log('handle ice canddate', eve.candidate)
        if(eve.candidate){
            console.log('working handle ice canddate')
            this.sendMessage({
                type:'candidate',
                label:eve.candidate.sdpMLineIndex,
                id:eve.candidate.sdpMid,
                candidate:eve.candidate.candidate              
            })
        }
        else
        {
            console.log('end of candidate')
        }
    }

    gotRemoteStream = (eve) => {
        console.log('got remote stream',  eve.stream)
        let remoteVideo = this.remoteVideo.current
        if ("srcObject" in remoteVideo) {
            remoteVideo.srcObject = eve.stream;
        } else {
        // Avoid using this in new browsers, as it is going away.
        remoteVideo.src = window.URL.createObjectURL(eve.stream);
        }
    }


    createPeerConnection = () => {
    let { localStream } = this.state
        let servers = {
            'iceServers': [
                {'urls': 'stun:stun2.1.google.com:19302'},
                {'urls': 'stun:stun.1.google.com:19302'},
              ]
            }

            console.log('creating peer', pc1)
            let pc1 = new RTCPeerConnection(servers);

            localStream.getTracks().forEach(track=>{
                pc1.addTrack(track, localStream)
            })

            pc1.onicecandidate = eve => this.handleIceCandidate(pc1, eve)

            pc1.ontrack = this.gotRemoteStream

            
          
            this.setState({pc1:pc1})

    }


     checkAndStart() {
        console.log('check and start')
         let {localStream, isChannelReady, isStarted, isInitiator} = this.state
         console.log('check and start', localStream, isStarted, isChannelReady)
        if (!isStarted && localStream != null && isChannelReady) {
        console.log('check and start working')
        this.createPeerConnection();
        this.setState({
            isStarted:true
        })
        if (isInitiator) {
            console.log('initiator')
            this.doCall();
        }
        else{
            console.log('initiator not')
        }
       
           
        
    }
}

doAnswer = (dd) => {
    let { pc1 } = this.state
    console.log('doing answer', pc1, dd)
    pc1.createAnswer().then(desc => {
        console.log('here is answer',desc)
        pc1.setLocalDescription(desc)
        this.sendMessage(desc)
    }).catch(err=>{
        console.log('answer err', err)
    })
}

doCall = () => {
    let { pc1 } = this.state
    console.log('doing call')
    pc1.createOffer({offerToRecieveAudio:1, offerToRecieveVideo:1,}).then(desc=>{
        pc1.setLocalDescription(desc)
        this.sendMessage(desc)
    }).catch(err=>{
        console.log('create offer err', err)
    })
}

sendMessage = (data) => {
    let {socket, room} = this.state
    console.log('sending message', data, room)
    //io.to(room).emit('message', 'ready')
   socket.emit('message', data)
    //io.in(room).emit('message', data);
}

    componentDidMount(){

         let {isInitiator, isStarted, pc1} = this.state

        let socket = io()
        this.setState({socket})
        

        
        
        

            socket.on('created', (room, clientId)=>{
                console.log('created room ',room, clientId)
                this.setState({
                    isInitiator:true,
                    localUser:clientId
                })

                this.initMedia()
                this.checkAndStart()
            })

            socket.on('join', (room, clientId) => {
                this.setState({
                    isChannelReady:true,
                    remoteUser:clientId
                })
                console.log('join room ', room, clientId)
            });

            socket.on('joined', (room, clientId) => {
                this.setState({
                    isChannelReady:true,
                    remoteUser:clientId
                })
                console.log('joined room ', room, clientId)
                this.initMedia()
            });

            socket.on('message', data => {
                console.log('data', data)
                if(data === 'Got User Media'){
                    this.checkAndStart()
                }
                else if(data.type === 'offer'){
                    console.log('offer', data)
                    console.log('isssss', isInitiator, isStarted)
                    if(!isInitiator && !isStarted){
                        this.checkAndStart()
                    }
                   
                        console.log(' offer setting remote description', data)
                       this.state.pc1.setRemoteDescription(new RTCSessionDescription(data)).then(()=>{
                            this.doAnswer(data)
                       });
                        
                    
                    
                    

                }
                else if(data.type === 'answer' && isStarted){
                    console.log('answer')
                    pc1.setRemoteDescription(new RTCSessionDescription(data))

                }
                else if(data.type === 'candidate' && isStarted){
                    console.log('candidate')
                    let candidate = new RTCIceCandidate({sdpMLineIndex:data.label, candidate:data.candidate})
                    pc1.addIceCandidate(candidate)
                }
                
            })

            socket.on('full', (room) => {
                console.log('Message from client: Room ' + room + ' is full :^(');
            });
              
 
              

       
    }


    enterRoom = () => {
        let {socket} = this.state
        let room = prompt("Enter Room Name")
        if(room !== ''){
            this.setState({
                room
            })

            socket.emit('create or join', room)
        }
    }

  render() {
    return (
      <div>
        <video id="local" ref={this.localVideo} autoPlay></video>
        <video  id="remote" ref={this.remoteVideo} autoPlay></video>
        <button onClick={this.enterRoom}>Room</button>
        <button onClick={this.calling}>init</button>
      </div>
    )
  }
}
