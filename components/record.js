import React, { Component } from 'react'

export default class record extends Component {
    componentDidMount(){
        const mediaSource = new MediaSource();
        mediaSource.addEventListener('sourceopen', handleSourceOpen, false);
    
        let mediaRecorder;
        let recordedBlobs;
        let sourceBuffer;
    
      const errorMsgElement = document.querySelector('span#errorMsg');
      const recordedVideo = document.querySelector('video#recorded');
      const recordButton = document.querySelector('button#record');
    
      recordButton.addEventListener('click', ()=>{
        if(recordButton.textContent === 'Start Recording'){
          startRecording()
        }
        else{
          stopRecording();
          recordButton.textContent = 'Start Recording';
          playButton.disabled = false
          downloadButton.disabled = false
        }
      })
    
      const playButton = document.querySelector('button#play');
      playButton.addEventListener('click', () => {
        const superBuffer = new Blob(recordedBlobs, {type: 'video/webm'});
        recordedVideo.src = null;
        recordedVideo.srcObject = null;
        recordedVideo.src = window.URL.createObjectURL(superBuffer);
        recordedVideo.controls = true;
        recordedVideo.play();
      });
    
      const downloadButton = document.querySelector('button#download');
    downloadButton.addEventListener('click', () => {
      const blob = new Blob(recordedBlobs, {type: 'video/webm'});
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'test.webm';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
    });
    
    
    function handleSourceOpen(event) {
      console.log('MediaSource opened');
      sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vp8"');
      console.log('Source buffer: ', sourceBuffer);
    }
    
    function handleDataAvailable(event) {
      if (event.data && event.data.size > 0) {
        recordedBlobs.push(event.data);
      }
    }
    
    function startRecording() {
      recordedBlobs = [];
      let options = {mimeType: 'video/webm;codecs=vp9'};
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        console.error(`${options.mimeType} is not Supported`);
        errorMsgElement.innerHTML = `${options.mimeType} is not Supported`;
        options = {mimeType: 'video/webm;codecs=vp8'};
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          console.error(`${options.mimeType} is not Supported`);
          errorMsgElement.innerHTML = `${options.mimeType} is not Supported`;
          options = {mimeType: 'video/webm'};
          if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            console.error(`${options.mimeType} is not Supported`);
            errorMsgElement.innerHTML = `${options.mimeType} is not Supported`;
            options = {mimeType: ''};
          }
        }
      }
    
      try {
        mediaRecorder = new MediaRecorder(window.stream, options);
      } catch (e) {
        console.error('Exception while creating MediaRecorder:', e);
        errorMsgElement.innerHTML = `Exception while creating MediaRecorder: ${JSON.stringify(e)}`;
        return;
      }
    
      console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
      recordButton.textContent = 'Stop Recording';
      playButton.disabled = true;
      downloadButton.disabled = true;
      mediaRecorder.onstop = (event) => {
        console.log('Recorder stopped: ', event);
      };
      mediaRecorder.ondataavailable = handleDataAvailable;
      mediaRecorder.start(10); // collect 10ms of data
      console.log('MediaRecorder started', mediaRecorder);
    }
    
    function stopRecording() {
      mediaRecorder.stop();
      console.log('Recorded Blobs: ', recordedBlobs);
    }
    
    function handleSuccess(stream) {
      recordButton.disabled = false;
      console.log('getUserMedia() got stream:', stream);
      window.stream = stream;
    
      const gumVideo = document.querySelector('video#gum');
      gumVideo.srcObject = stream;
    }
    
    async function init(constraints) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        handleSuccess(stream);
      } catch (e) {
        console.error('navigator.getUserMedia error:', e);
        errorMsgElement.innerHTML = `navigator.getUserMedia error:${e.toString()}`;
      }
    }
    
    document.querySelector('button#start').addEventListener('click', async () => {
      const hasEchoCancellation = document.querySelector('#echoCancellation').checked;
      const constraints = {
        audio: {
          echoCancellation: {exact: hasEchoCancellation}
        },
        video: {
          width: 1280, height: 720
        }
      };
      console.log('Using media constraints:', constraints);
      await init(constraints);
    });
    
        
    
      }
  render() {
    return (
      <div>
            <div id="container">

<h1><a href="//webrtc.github.io/samples/" title="WebRTC samples homepage">WebRTC samples</a>
    <span>MediaRecorder</span></h1>

<p>For more information see the MediaStream Recording API <a
        href="http://w3c.github.io/mediacapture-record/MediaRecorder.html"
        title="W3C MediaStream Recording API Editor's Draft">Editor's&nbsp;Draft</a>.</p>

<video id="gum" playsInline autoPlay muted></video>
<video id="recorded" playsInline loop></video>

<div>
    <button id="start">Start camera</button>
    <button id="record" disabled>Start Recording</button>
    <button id="play" disabled>Play</button>
    <button id="download" disabled>Download</button>
</div>

<div>
    <h4>Media Stream Constraints options</h4>
    <p>Echo cancellation: <input type="checkbox" id="echoCancellation"/></p>
</div>

<div>
    <span id="errorMsg"></span>
</div>

<a href="https://github.com/webrtc/samples/tree/gh-pages/src/content/getusermedia/record"
   title="View source for this page on GitHub" id="viewSource">View source on GitHub</a>

</div>
      </div>
    )
  }
}
