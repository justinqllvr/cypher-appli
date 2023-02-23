import "./style.css";
import { io } from "socket.io-client";

const mergeBuffers = (buffer1, buffer2) => {
  var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
  tmp.set(new Uint8Array(buffer1), 0);
  tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
  return tmp.buffer;
};

class Server {
  constructor() {
    this.connect();
    this.bodyEl = document.querySelector("body");
    this.videos = [];
    this.buffers = new Map();
  }

  connect() {
    this.socket = io("https://cypher-gobelins.herokuapp.com/", {
      transports: ["websocket", "polling", "flashsocket"],
    });

    this.socket.on("VIDEO_CREATED", this.handleNewVideo);
  }

  handleNewVideo = (video) => {
    if (this.buffers.has(video.id)) {
      this.buffers.get(video.id).push(video);
    } else {
      this.buffers.set(video.id, [video]);
    }

    this.mergeVideos();
    
    const videoList = this.videos
      .map((video, i) => {
        const videoUrl = URL.createObjectURL(
          new Blob([video], { type: "video/webm" })
        );
        return `<video src=${videoUrl} controls="true"></video>`;
      })
      .join("");

    this.bodyEl.innerHTML = videoList;

    if (this.videos.length >= 2) {
      this.joinVideo();
    }
  }

  mergeVideos() {
    this.buffers.forEach((videos, id) => {
      if (videos.length === videos[0].length) {
        this.videos.push(videos.sort((a, b) => a.index - b.index).map((video) => video.buffer).reduce((a, b) => mergeBuffers(a, b), new Uint8Array()));
        this.buffers.delete(id);
      }
    })
  }

  customVideo() {
    //Crop la vidéo grâce à ffsjpeg
  }

  joinVideo() {
    //Création d'une source pour lier les deux vidéos


  }
}

new Server();
