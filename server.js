import { io } from "socket.io-client";
import { app } from "./main.js";

const mergeBuffers = (buffer1, buffer2) => {
  var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
  tmp.set(new Uint8Array(buffer1), 0);
  tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
  return tmp.buffer;
};

export default class Server {
  constructor() {
    this.connect();
    this.bodyEl = document.querySelector("body");
    this.videos = [];
    this.buffers = new Map();
    this.videoIndex = 0;
  }

  connect() {
    this.socket = io("https://cypher-gobelins.herokuapp.com/", {
      transports: ["websocket", "polling", "flashsocket"],
    });

    this.socket.on("VIDEO_CREATED", this.handleNewVideo);
  }

  handleNewVideo = async (video) => {
    if (this.buffers.has(video.id)) {
      this.buffers.get(video.id).push(video);
    } else {
      this.buffers.set(video.id, [video]);
    }

    this.mergeVideos();

    const blobVideo = new Blob([this.videos[this.videoIndex]], { type: "video/mp4" });
    const videoUrl = URL.createObjectURL(blobVideo);

    const videoEl = `<video src=${videoUrl} controls="true"></video>`



    // console.log(this.videos)
    // await app.GoogleApi.uploadVideo(this.videos.map((video) => {
    //     return new Blob([video], {type: "video/mp4"})
    // }));
    
    // console.log(this.videos[this.videoIndex])
    // console.log(this.videoIndex)
    await app.GoogleApi.uploadVideo(blobVideo, video.id);

    await app.GoogleApi.getBlobs();

    

    this.videoIndex++
  };

  mergeVideos() {
    this.buffers.forEach((videos, id) => {
      if (videos.length === videos[0].length) {
        this.videos.push(
          videos
            .sort((a, b) => a.index - b.index)
            .map((video) => video.buffer)
            .reduce((a, b) => mergeBuffers(a, b), new Uint8Array())
        );
        this.buffers.delete(id);
      }
    });
  }

  customVideo() {
    //Crop la vidéo grâce à ffsjpeg
  }

  joinVideo() {
    //Création d'une source pour lier les deux vidéos
  }
}
