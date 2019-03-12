import React, { Component } from 'react'
import io from 'socket.io-client';
export default class chat extends Component {
    state = {
        socket:null,
        localUser:'',
        remoteUser:'',
        localStream:null,
        remoteSrteam:null,
        pc:null,
        isChannelReady:false,
        isInitiator:false
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
        localStream:stream
        })
        console.log('adding local stream')
        this.createPeerConnection()
    }
    componentDidMount(){
        let socket = io()
        this.setState({socket})

        let {localUser, remoteUser, pc} = this.state

        socket.on('user', (user)=>{
            let name = user.name
            if(name !== localUser)
            {
                this.setState({remoteUser:name})
            }
            console.log('users',user)
            
        })

        socket.on('message', data=>{
            if(data.type === "offer"){
                console.log('incoming offer', data)
                this.state.pc.setRemoteDescription(new RTCSessionDescription(data.sdp)).then(()=>{
                    this.doAnswer(data.sdp)
                })
            }
            else if(data.type === "candidate"){
                console.log('candidate', data)
                let candidate = new RTCIceCandidate({sdpMLineIndex:data.label, candidate:data.candidate})
                this.state.pc.addIceCandidate(candidate)

            }
            else if(data.type === "answer"){
                this.state.pc.setRemoteDescription(new RTCSessionDescription(data))
            }
        })

       
    }

    enterRoom = () => {
        let {socket} = this.state
        let name = prompt("Enter Your Name")
        if(name !== ''){
            this.setState({
                localUser:name
            })

            socket.emit('user', name)
          
        }
    }

    doAnswer = (data) => {
        let { socket, pc } = this.state
        console.log('doing answer', pc, data)
        pc.createAnswer().then(desc => {
            console.log('here is answer',desc)
            pc.setLocalDescription(desc)
            socket.emit('message', desc)
        }).catch(err=>{
            console.log('answer err', err)
        })
    }

    calling = () => {
        let {socket, remoteUser, pc} = this.state
        console.log(pc)
        pc.createOffer().then(offer=>{
            console.log('offer', pc)
            return pc.setLocalDescription(offer)
            
            
        })
        .then(()=>{
            console.log('sending offer')
            socket.emit('message', {type:"offer", sdp:pc.localDescription})
        })
        .catch(err=>{
            console.log('offer err', err)
        })
       // socket.emit('message', {target:remoteUser, msg:'hi'})

    }

   
        createPeerConnection = () => {
            let { localStream } = this.state
                let servers = {
                    'iceServers': [
                        {'urls': 'stun:stun2.1.google.com:19302'},
                        {'urls': 'stun:stun.1.google.com:19302'},
                      ]
                    }
                    
                    let pc = new RTCPeerConnection(servers);
                    console.log('creating peer', pc)
                    localStream.getTracks().forEach(track=>{
                        pc.addTrack(track, localStream)
                    })
                    pc.onicecandidate = eve => this.handleIceCandidate(pc, eve)
                    pc.ontrack = this.gotRemoteStream
                    this.setState({pc})
        
            }

            handleIceCandidate = (pc1, eve) => {
                let { pc, socket } = this.state
                 console.log('ice', pc1, eve, pc)
                 if(eve.candidate){
                     socket.emit('message',{
                         
                    type:'candidate',
                    label:eve.candidate.sdpMLineIndex,
                    id:eve.candidate.sdpMid,
                    candidate:eve.candidate.candidate              
            
                     })
                 }
            }

            gotRemoteStream = (eve) => {
                console.log('got remote stream', eve)
                let remoteVideo = this.remoteVideo.current
                if ("srcObject" in remoteVideo) {
                    remoteVideo.srcObject = eve.streams[0];
                } else {
                // Avoid using this in new browsers, as it is going away.
                remoteVideo.src = window.URL.createObjectURL(eve.streams[0]);
                }
            }
    
  render() {
    return (
      <div>
          <p>{this.state.localUser} &nbsp; {this.state.remoteUser}</p>
         <video id="local" ref={this.localVideo} autoPlay></video>
        <video  id="remote" ref={this.remoteVideo} autoPlay></video>

        <button onClick={this.enterRoom}>Room</button>
        <button onClick={this.initMedia}>init</button>
        <button onClick={this.calling}>call</button>
      </div>
    )
  }
}
