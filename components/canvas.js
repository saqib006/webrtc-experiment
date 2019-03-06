import React, { Component } from 'react'

export default class canvas extends Component {

    componentDidMount(){
        const video = document.querySelector('video')
        const canvas = window.canvas = document.querySelector('canvas')
        canvas.width = 500;
        canvas.height = 400;
    
        const button = document.querySelector('button')
    
        button.onclick = function(){
          canvas.width = video.width;
          canvas.height = video.height;
          canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
        }
    
        const constraints = {
          audio:false,
          video:true
        }
    
        function handleSuccess(stream){
          window.stream = stream;
          video.srcObject = stream
        }
    
        function handleError(err){
          console.log('media error', err.message, err.name)
        }
    
        navigator.mediaDevices.getUserMedia(constraints).then(handleSuccess).catch(handleError)
    
      }
  render() {
    return (
      <div>
        <h2>webrtc</h2>
          <video autoPlay playsInline></video>
          <button>TakeSnapShot</button>
          <canvas></canvas>
      </div>
    )
  }
}
