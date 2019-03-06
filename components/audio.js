import React, { Component } from 'react'

export default class Audio extends Component {
    componentDidMount(){
        const audio = document.querySelector('audio')
        const constraints = window.constraints = {
          audio: true,
          video:false
        }
    
        function handleSuccess(stream){
          const audioTracks = stream.getAudioTracks();
          console.log('gt stream', audioTracks)
          stream.oninactive = function(){
            console.log('stream ended')
          }
          window.stream = stream;
          audio.srcObject = stream
        }
    
        function handleError(err){
          console.log('navigator errror', err.message, err.name)
        }
        navigator.mediaDevices.getUserMedia(constraints).then(handleSuccess).catch(handleError)
      }
  render() {
    return (
      <div>
        <audio controls autoplay></audio>
      </div>
    )
  }
}
