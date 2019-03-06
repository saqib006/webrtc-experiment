import React, { Component } from 'react'
import Nav from '../components/nav';
import {Grid, Button} from '@material-ui/core';
import { log } from 'util';
export default class index extends Component {

  constructor(props){
    super(props)

    this.state = {
      hasMedia:false,
      streaming:null,
      localConnection:null,
      remoteConnection:null
    }

    
    
  }
  

   isMobile = {
    Android: function() {
        return navigator.userAgent.match(/Android/i);
    },
    BlackBerry: function() {
        return navigator.userAgent.match(/BlackBerry/i);
    },
    iOS: function() {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
    },
    Opera: function() {
        return navigator.userAgent.match(/Opera Mini/i);
    },
    Windows: function() {
        return navigator.userAgent.match(/IEMobile/i);
    },
    any: function() {
        return (this.Android() || this.BlackBerry() || this.iOS() || this.Opera() || this.Windows());
    }
};


  successCallback = (stream) =>{
    console.log('str', stream)
    this.setState({streaming:stream})
    let video = document.querySelector("#stream1")
    window.stream = stream;
    if ("srcObject" in video) {
      video.srcObject = stream;
    } else {
      // Avoid using this in new browsers, as it is going away.
      video.src = window.URL.createObjectURL(stream);
    }

    
    
  }

  calling = ()=>{
    let {streaming} = this.state
    if(this.hasRTCPeerConnection()){
      if(navigator.webkitGetUserMedia){
        if(streaming.getVideoTracks().length > 0){
          console.log('using video device',  streaming.getVideoTracks()[0].label)
        }
       if(streaming.getAudioTracks().length > 0){
          console.log('using audio device', streaming.getAudioTracks()[0].label)
        }
      }
      
      this.startPeerConnection(streaming)
    }
    else{
      console.log('browser does not support')
    }
  }

  gotLocalIceCandidate(eve){
    let {remoteConnection} = this.state
    if(eve.candidate){
      remoteConnection.addIceCandidate(new RTCIceCandidate(eve.candidate))
      log('local ice candidate', eve.candidate.candidate)
    }
  }

  onSignalingError(error){
    console.log('faild to create signaling message: ' + error.name)
}

  gotRemoteDescription(description){

    let {remoteConnection, localConnection} = this.state

    remoteConnection.setLocalDescription(description);
    log("Answer from remotepeerconnection:\n" + description.sdp)

    localConnection.setRemoteDescription(description)

}


gotLocalDescription(description){

  let {remoteConnection, localConnection} = this.state
  
  // Add the local description to the local PeerConnection
  localConnection.setLocalDescription(description)
  log("offer from local peerconnection: \n" + description.sdp);
  remoteConnection.setRemoteDescription(description);

  // Create the Answer to the received Offer based on the 'local' description
  remoteConnection.createAnswer(this.gotRemoteDescription, this.onSignalingError)

}

  gotRemoteIceCandidate(event){

    let {localConnection} = this.state
    if (event.candidate) {
    // Add candidate to the local PeerConnection
    localConnection.addIceCandidate(new RTCIceCandidate(event.candidate));
    log("Remote ICE candidate: \n " + event.candidate.candidate);
    }
  }

   gotRemoteStream(eve){
    let video2 = document.querySelector("#stream2")
    if ("srcObject" in video2) {
      video2.srcObject = eve.stream;
    } else {
      // Avoid using this in new browsers, as it is going away.
      video2.src = window.URL.createObjectURL(eve.stream);
    }
    log('recived remote stream')
  }
   startPeerConnection = (stream) => {

    let config = {
      "iceServers":[{"url": "stun:stun.1.google.com:19302"}]
    };
    
        let servers = null,
        localConnection = new RTCPeerConnection(servers),
        remoteConnection = new RTCPeerConnection(servers);

      

  
      
       


   /*     this.setState(prevState => ({
          remoteConnection: {
              ...prevState.remoteConnection,
              onicecandidate: this.gotRemoteIceCandidate
          }
      }))*/



        
    
        //localConnection = new webkitRTCPeerConnection(servers)

        //remoteConnection = new webkitRTCPeerConnection(servers)
     
        //remoteConnection.onicecandidate = this.gotRemoteIceCandidate

        localConnection.onicecandidate = this.gotLocalIceCandidate

        remoteConnection.onaddstream = this.gotRemoteStream

        localConnection.addStream(stream)
        log('added localStream to Local Peer Connection')


        localConnection.createOffer(this.gotLocalDescription, this.onSignalingError)

      
        this.setState({
          localConnection,
          remoteConnection
        })
      

  }

  errCallback(err){
    console.log('navigator error', err)
  }

  hasUserMedia = () => {
    return !!(navigator.getUserMedia || navigator.webkitGetUserMedia
    || navigator.mozGetUserMedia || navigator.msGetUserMedia);
    }


  hasRTCPeerConnection = () => {
    window.RTCPeerConnection = window.RTCPeerConnection ||
    window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
    return !!window.RTCPeerConnection;
  }

  capture = () => {
    let canvas = document.querySelector('canvas');
    let video = document.querySelector("#stream1")
    if(this.state.streaming){
        canvas.width = video.clientWidth
        canvas.height = video.clientHeight
        let contex = canvas.getContext('2d')
        contex.drawImage(video, 0, 0)
    }
    else{
      console.log('browser does not support get user media')
    }
    
  }


 async componentDidMount(){


    let constraints = {
      video: {
          mandatory: {
          //minAspectRatio: 1.777,
          //maxAspectRatio: 1.778,
          minWidth: 640,
          minHeight: 480
          },
          optional: [
            { maxWidth: 640 },
            { maxHeigth: 480 }
            ]
        },
      audio: false
    }


    if (this.isMobile.any()) {
      // The user is using a mobile device, lower our minimum
      resolution
      constraints = {
        video: {
          mandatory: {
          minWidth: 480,
          minHeight: 320,
          maxWidth: 1024,
          maxHeight: 768
          }
        },
      audio: true
      };
    }

    

      if(this.hasUserMedia() === true){
       

       /* navigator.getUserMedia = navigator.getUserMedia ||
        navigator.webkitGetUserMedia || navigator.mozGetUserMedia ||
        navigator.msGetUserMedia;*/

        navigator.getUserMedia = navigator.getUserMedia ||
        navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedi;
        

        console.log('has',navigator.getUserMedia)

        navigator.mediaDevices.getUserMedia(constraints).then(this.successCallback).catch(this.errCallback)
   
      }
      else{
        this.setState({
          hasMedia:false
        })
      }

      navigator.mediaDevices.enumerateDevices().then((devices)=>{
        devices.forEach(device=>{
        console.log('devices',device.kind, device.label, device.deviceId)

        })
      }).catch(err=>{
        console.log(err.name + ":" + err.message)
      })



     


  }

  render() {
    return (

          
    <div>
      <style jsx global>{`
      
      grayscale {
        -webkit-filter: grayscale(1);
        -moz-filter: grayscale(1);
        -ms-filter: grayscale(1);
        -o-filter: grayscale(1);
        filter: grayscale(1);
        }
        .sepia {
        -webkit-filter: sepia(1);
        -moz-filter: sepia(1);
        -ms-filter: sepia(1);
        -o-filter: sepia(1);
        filter: sepia(1);
        }
        .invert {
        -webkit-filter: invert(1);
        -moz-filter: invert(1);
        -ms-filter: invert(1);
        -o-filter: invert(1);
        filter: invert(1);
        }
      
      `}</style>
    <Nav />
      <Grid container justify="center">

        <Grid item sm={6}>
        <video id="stream1" autoPlay></video>
        <Button variant="contained" color="secondary" onClick={this.capture}>Capture</Button>
        <Button variant="contained" color="secondary" onClick={this.calling}>Call</Button>
        </Grid>

        <Grid item sm={6}>
        <canvas style={{width:640, height:480, border:"1px solid black"}}></canvas>
        <video id="stream2" autoPlay></video>
        </Grid>

      </Grid>

    </div>


      

    )
  }
}
