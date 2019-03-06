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
        localUser:null,
        remoteUser:null,
        isChannelReady:false,
        isStarted:false
    }


  

    localVideo = React.createRef();
    remoteVideo = React.createRef();


    initMedia = () => {
        console.log('requesting media stream')
        navigator.mediaDevices.getUserMedia({video:true, audio:false})
        .then(this.gotUserMedia).catch((err)=>{
          console.log('get user media err', err.name)
        })
    }

    gotUserMedia = (stream) => {
        this.localVideo.current.srcObject = stream
        this.setState({
        localStream:stream
        })

        this.createPeerConnection()
    }

    handleIceCandidate = (eve) => {
        console.log(' ice canddate', eve)
        if(eve.candidate){
            this.sendMessage({
                type:candidate,
                label:eve.candidate.sdpMlineIndex,
                id:eve.candidate.sdpMid,
                candidate:eve.candidate.candidate
                        
            })
        }else{
            console.log('end of candidate')
        }
    }

    gotRemoteStream = (eve) => {
        console.log('got remote stream')
        let remoteVideo = this.remoteVideo.current
        if(remoteVideo.srcObject !== eve.streams[0]){
          remoteVideo.srcObject = eve.streams[0]
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

            let pc1 = new RTCPeerConnection(servers);

            localStream.getTracks().forEach(track=>{
                pc1.addTrack(track, localStream)
            })

            pc1.onicecandidate = this.handleIceCandidate

            pc1.ontrack = this.gotRemoteStream

            console.log('creating peer', pc1)
          
            this.setState({pc1:pc1})

    }


     checkAndStart() {
         let {localStream, isChannelReady, isStarted, isInitiator} = this.state
        if (!isStarted && localStream != null && isChannelReady) {
            console.log('check and start working')
        this.createPeerConnection();
        this.setState({
            isStarted:true
        })
        if (isInitiator) {
            this.doCall();
        }
       
            console.log('check and start faild')
        
    }
}

doAnswer = () => {
    let {pc1} = this.state
    pc1.createAnswer().then(desc => {
        pc1.setLocalDescription(desc)
    }).catch(err=>{
        console.log('answer err', err)
    })
}

doCall = () => {
let {pc1} = this.state
    pc1.createOffer({offerToRecieveAudio:1, offerToRecieveVideo:1,}).then(desc=>{
        pc1.setLocalDescription(desc)
        this.sendMessage(desc)
    }).catch(err=>{
        console.log('create offer err', err)
    })
}

sendMessage = (data) => {
    let {socket, room} = this.state
    console.log('sending message')
    socket.broadcast.to(room).room(message, data);
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
            })

            socket.on('joined', (room, clientId) => {
                console.log('joined room ', room, clientId)
                this.setState({
                    isInitiator:false,
                    remoteUser:clientId,
                    isChannleReady:true
                })

                this.initMedia()
            });

            socket.on('message', data => {
                console.log('data', data)
                if(data === 'Got User Media'){

                }
                else if(data.type === 'offer'){
                    if(!isInitiator && !isStarted){
                        this.checkAndStart()
                    }
                    pc1.setRemoteDescription(new RTCSessionDescription(data));
                    this.doAnswer()

                }
                else if(data.type === 'answer' && isStarted){
                    pc1.setRemoteDescription(new RTCSessionDescription(data))

                }
                else if(data.type === 'candidate' && isStarted){
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
        <video style={{width:300, height:150}} id="local" ref={this.localVideo} autoPlay></video>
        <video style={{width:300, height:150}} id="remote" ref={this.remoteVideo} autoPlay></video>
        <button onClick={this.enterRoom}>Room</button>
        <button onClick={this.initMedia}>init</button>
      </div>
    )
  }
}
