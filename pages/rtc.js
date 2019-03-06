import React, { Component } from 'react';
export default class rtc extends Component {

  state = {
    startBtn:false,
    callBtn:true,
    hangupBtn:true,
    localStream:null,
    pc1:null,
    pc2:null,
    servers:null
  }

  localVideo = React.createRef();
  remoteVideo = React.createRef();

  start = () => {
      console.log('requesting media stream')
      navigator.mediaDevices.getUserMedia({video:true, audio:false})
      .then(this.gotUserMedia).catch((err)=>{
        console.log('get user media err', err.name)
      })
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

    let pc1 = new RTCPeerConnection(servers),
        pc2 = new RTCPeerConnection(servers)

    pc1.onicecandidate = eve => this.onIceCandidate(pc1, eve)
    pc2.onicecandidate = eve => this.onIceCandidate(pc2, eve)

    pc1.oniceconnectionstatechange = eve => this.onIceStateChange(pc1, eve)
    pc2.oniceconnectionstatechange = eve => this.onIceStateChange(pc2, eve)

    pc2.ontrack = this.gotRemoteStream

    localStream.getTracks().forEach(track=>{
      pc1.addTrack(track, localStream)
    })

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

    console.log('got remote stream')
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
      .then(()=> console.log('pc1 set local description success'), err => console.log('pc1 local description failed', toString()))

      pc2
        .setRemoteDescription(desc)
        .then(
            () => {console.log("pc2 setRemoteDescription success");
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
        <video style={{width:300, height:150}} id="local" ref={this.localVideo} autoPlay></video>
        <video style={{width:300, height:150}} id="remote" ref={this.remoteVideo} autoPlay></video>
        <div>
          <button onClick={this.start} disabled={this.state.startBtn}>Start</button>
          <button onClick={this.call} disabled={this.state.callBtn}>Call</button>
          <button onClick={this.hangup} disabled={this.state.hangupBtn}>Hangup</button>
        </div>
      </div>
    )
  }
}
