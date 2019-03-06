import React, { Component } from 'react';
import { setTimeout } from 'timers';
export default class rtc extends Component {

  state = {
    startBtn:false,
    callBtn:true,
    hangupBtn:true,
    localStream:null,
    pc1:null,
    pc2:null,
    servers:null,
    socket:null,
    name:'',
    connectedUser:null,
    isChannelReady:false,
    isInitiator:false,
    isStarted:false
  }

  static getDerivedStateFromProps(props, state){
    return {
        socket:props.socket
    }
}

  localVideo = React.createRef();
  remoteVideo = React.createRef();




changeHandler = (eve) => {
  this.setState({
    [eve.target.name]:eve.target.value
  })
}

loginHandler = () => {
  let {name} = this.state
  this.sendData({
    type:"login",
    name:name
  })
}


  componentDidMount(){

    

    setTimeout(()=>{
      let {socket, isInitiator, isStarted} = this.state
      
      socket.on('created', room => {
        console.log('created room', + room)
        this.setState({
          isInitiator:true
        })

        navigator.mediaDevices.getUserMedia({video:true, audio:false})
      .then(this.gotUserMedia).catch((err)=>{
        console.log('get user media err', err.name)
      })
      console.log('getting user media')

      })


      socket.on('full', function (room){
        console.log('Room ' + room + ' is full');
        });

        socket.on('join', function (room){
          console.log('Another peer made a request to join room ' + room);
          console.log('This peer is the initiator of room ' + room + '!');
          this.setState({
            isChannelReady:true
          })
       
          });


          socket.on('joined', function (room){
            console.log('This peer has joined room ' + room);
            this.setState({
              isChannelReady:true
            })
            // Call getUserMedia()
            navigator.mediaDevices.getUserMedia({video:true, audio:false})
            .then(this.gotUserMedia).catch((err)=>{
              console.log('get user media err', err.name)
            })
            console.log('Getting user media with constraints');
            });

            socket.on('log', function (array){
              console.log.apply(console, array);
              });


              socket.on('message', function (message){
                console.log('Received message:', message);
                if (message === 'got user media') {
                checkAndStart();
                } else if (message.type === 'offer') {
                if (!isInitiator && !isStarted) {
                checkAndStart();
                }
                pc.setRemoteDescription(new RTCSessionDescription(message));
                doAnswer();
                } else if (message.type === 'answer' && isStarted) {
                pc.setRemoteDescription(new RTCSessionDescription(message));
                } else if (message.type === 'candidate' && isStarted) {
                var candidate = new RTCIceCandidate({sdpMLineIndex:message.label,
                candidate:message.candidate});
                pc.addIceCandidate(candidate);
                } else if (message === 'bye' && isStarted) {
                handleRemoteHangup();
                }
                });
      


    },200)    
  }

  onLogin = () => {
    this.start()
  }



  start = () => {
    let {socket} = this.state
    let room = prompt("Enter room name")
    if(room !== ''){
        console.log('creating room', room)
        socket.emit('create or join', room)
    }
      console.log('adding local stream')
      this.sendMessage('got user media')
      
  }

  sendMessage(message){
    console.log('Sending message: ', message);
    socket.emit('message', message);
    }


    checkAndStart() {
      let {isStarted, localStream, isChannelReady, isInitiator} = this.state
      if (!isStarted && typeof localStream != 'undefined' && isChannelReady) {
      this.call();
      this.setState({
        isStarted:true
      })
      if (isInitiator) {
      doCall();
      }
      }
      }

  call = () =>{
      this.setState({
        callBtn:true,
        hangupBtn:false,
      })

      let {localStream} = this.state
    console.log('starting call')

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
    pc1.onicecandidate = eve => this.onIceCandidate(pc1, eve)
    console.log('created rtc peer connection')  

    pc2.ontrack = this.gotRemoteStream
    let pc2 = new RTCPeerConnection(servers);

  

    pc2.onicecandidate = eve => this.onIceCandidate(pc2, eve)

    pc1.oniceconnectionstatechange = eve => this.onIceStateChange(pc1, eve)
    pc2.oniceconnectionstatechange = eve => this.onIceStateChange(pc2, eve)

   

    

    pc1.createOffer({offerToRecieveAudio:1, offerToRecieveVideo:1,})
    .then(this.onCreateOfferSuccess, err => {console.log('create offer err', err.toString())})

    this.setState({
      servers,
      pc1,
      pc2,
      localStream
    })
  }

  hangup = ()=>{

  }

  gotUserMedia = (stream) => {
    this.localVideo.current.srcObject = stream
    this.setState({
      startBtn:true,
      callBtn:false,
      localStream:stream
    })
  }

  gotRemoteStream = (eve) => {
    let remoteVideo = this.remoteVideo.current
    if(remoteVideo.srcObject !== eve.streams[0]){
      remoteVideo.srcObject = eve.streams[0]
    }
  }
  onIceCandidate = (pc, eve) => {
    let {pc1, pc2} = this.state
    let otherPc = pc === pc1 ? pc2 : pc1
      otherPc.addIceCandidate(eve.candidate)
      .then(()=> console.log('addice candidate success'), err => console.log('addice candidate failed', err.toString()))
     
  }

  onIceStateChange = (pc, eve) => {
    console.log("ICE state:", pc.iceConnectionState);
  }

  onCreateOfferSuccess = (desc) => {
    let {pc1, pc2} = this.state
      pc1.setLocalDescription(desc)
      .then(()=> console.log('pc1 local description success'), err => console.log('pc1 local description failed', toString()))

      pc2
        .setRemoteDescription(desc)
        .then(
            () => {console.log("pc2 setRemoteDescription complete createOffer");
            pc2.createAnswer()
            .then(this.onCreateAnswerSuccess, err => 
                console.log("pc2 failed to set sdp in createAnswer", err.toString())
            )
        },
            err => console.log('pc2 faild to set sdp in create offer', err.toString())
        )
      
  }

  onCreateAnswerSuccess = (desc) =>{
    console.log('coming', desc)
    let {pc1, pc2} = this.state
    pc1.setRemoteDescription(desc)
    .then(()=> console.log('pc1 remote description success'), err =>  console.log('pc1 remote description failed', err.toString()))
 

    pc2.setLocalDescription(desc)
    .then(()=> console.log('pc1 remote description success'), err => console.log('pc1 remote description failed', err.toString()))
  }

  render() {
    return (
      <div>
        <table border="1" width="100%">
        <thead>
          <tr>
            <th>Local Video</th>
            <th>Remote Video</th>
          </tr>
          </thead>
          <tbody>
          <tr>
            <td>
            <video style={{width:600, height:350}} id="local" ref={this.localVideo} autoPlay></video>
            </td>
            <td>
            <video style={{width:600, height:350}} id="remote" ref={this.remoteVideo} autoPlay></video>
            </td>
          </tr>
          <tr>
            <td>
                <textarea id="dataChannelSend" rows="4" cols="60"></textarea>
            </td>
            <td>
              <textarea id="dataChannelReceive" rows="4" cols="60"></textarea>
            </td>
          </tr>
          <tr>
            <td align="center">
                <button>Send</button>
            </td>
          </tr>
          </tbody>
        </table>
        
        
        <input type="text" value={this.state.name} name="name" onChange={this.changeHandler} />
        <button onClick={this.loginHandler}>Login</button>
        <div>
          <button onClick={this.start} disabled={this.state.startBtn}>Start</button>
          <button onClick={this.call} disabled={this.state.callBtn}>Call</button>
          <button onClick={this.hangup} disabled={this.state.hangupBtn}>Hangup</button>
        </div>
      </div>
    )
  }
}
