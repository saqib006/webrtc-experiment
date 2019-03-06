import React, { Component } from 'react'


export default class web extends Component {
    constructor(props){
        super(props)
        this.state = {
            startBtn:false,
            callBtn:false,
            hangUpBtn:true,
            servers:null,
            pc1:null,
            pc2:null,
            localStream:null,
            socket:null
        }

        this.localVideoRef = React.createRef();
        this.remoteVideoRef = React.createRef();

        this.isMobile = {
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
    }

    static getDerivedStateFromProps(props, state){
        return {
            socket:props.socket
        }
    }

    start = () => {

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
        constraints = {
          video: {
            mandatory: {
            minWidth: 480,
            minHeight: 320,
            maxWidth: 480,
            maxHeight: 320
            }
          },
        audio: true
        };
      }

        let {socket} = this.state

        this.setState({
            startBtn:true
        })

        navigator.mediaDevices.getUserMedia(constraints).then(this.gotStream)
        .catch(err => console.log("get user media error", err.name))

        socket.emit('message', "hello world")
        

    }

    gotStream = stream => {
        
        this.localVideoRef.current.srcObject = stream
        this.setState({
            callBtn:false,
            localStream:stream
        })
    }

    gotRemoteStream = event => {
        let remoteVideo = this.remoteVideoRef.current;

        if (remoteVideo.srcObject !== event.streams[0]) {
            remoteVideo.srcObject = event.streams[0];
        }
    };

    call = () => {
        this.setState({
            callBtn:true,
            hangUpBtn:false
        })

        let {localStream} = this.state
        var servers = {
            'iceServers': [
                {'urls': 'stun:stun2.1.google.com:19302'},
                {'urls': 'stun:stun.1.google.com:19302'},
              ]
            },
        pc1 = new RTCPeerConnection(servers),
        pc2 = new RTCPeerConnection(servers)

        pc1.onicecandidate = eve => this.pc1onIceCandidate(pc1, eve)
        pc1.oniceconnectionstatechange = eve => this.onIceStateChange(pc1, eve)

        pc2.onicecandidate = eve => this.pc2onIceCandidate(pc2, eve);
        pc2.oniceconnectionstatechange = eve => this.onIceStateChange(pc2, eve);

        pc2.ontrack = this.gotRemoteStream

        localStream.getTracks().forEach(track => {
            pc1.addTrack(track, localStream)
        });

        pc1.createOffer({
            offerToRecieveAudio:1,
            offerToRecieveVideo:1,
        }).then(this.onCreateOfferSuccess, err  =>{
            console.log('failed to create session description', err.toString())
        })

        this.setState({
            servers,
            pc1,
            pc2,
            localStream
        })
    }

    onCreateOfferSuccess = desc => {
        let {pc1, pc2} = this.state;
        console.log('onCreateOfferSuccess',desc)
        pc1
        .setLocalDescription(desc)
        .then(
            () => console.log("pc1 setLocalDescription complete createOffer"),
            err => console.log('pc1 faild to set sdp in create offer', err.toString())
        )

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

    onCreateAnswerSuccess = desc => {
        let {pc1, pc2} = this.state;
        console.log('onCreateAnswerSuccess', desc)
        pc1.setRemoteDescription(desc)
        .then(
            ()=> console.log("pc1 setRemoteDesctiption complete createAnswer"),
            err => {
                console.log("pc1 faild to set session description in oncreateAnswer", err.toString())
            }
        )

        pc2.setLocalDescription(desc)
        .then(
            ()=> console.log("pc2 setLocalDesctiption complete createAnswer"),
            err => {
                console.log("pc2 faild to set session description in oncreateAnswer", err.toString())
            }
        )
    }

    pc1onIceCandidate = (pc, event) => {
        let { pc2 } = this.state;

        console.log('pc1 event', event)
       

        pc2
            .addIceCandidate(event.candidate)
            .then(
                () => console.log("addIceCandidate success"),
                error =>
                    console.error(
                        "failed to add ICE Candidate 1",
                        error.toString()
                    )
            );
    };


    pc2onIceCandidate = (pc, event) => {
        let { pc1 } = this.state;

        console.log('pc2 event', event)

        pc1
            .addIceCandidate(event.candidate)
            .then(
                () => console.log("addIceCandidate success"),
                error =>
                    console.error(
                        "failed to add ICE Candidate 2",
                        error.toString()
                    )
            );
    };

    onIceStateChange = (pc, event) => {
        console.log("ICE state:", pc.iceConnectionState);
    };

    

    hangUp = () => {
        let {pc1, pc2} = this.state
        pc1.close()
        pc2.close()

        this.setState({
            pc1:null,
            pc2:null,
            hangUpBtn:true,
            callBtn:false
        })
    }

    
  render() {
      const {startBtn, callBtn, hangUpBtn} = this.state
    return (
      <div>
        <video
                    ref={this.localVideoRef}
                    autoPlay
                    muted
                    style={{ width: "240px", height: "180px" }}
                />
                <video
                    ref={this.remoteVideoRef}
                    autoPlay
                    style={{ width: "240px", height: "180px" }}
                />

                <div>
                    <button onClick={this.start} disabled={startBtn}>
                        Start
                    </button>
                    <button onClick={this.call} disabled={callBtn}>
                        Call
                    </button>
                    <button onClick={this.hangUp} disabled={hangUpBtn}>
                        Hang Up
                    </button>
                </div>
      </div>
    )
  }
}
