import { io } from "socket.io-client";
import { app } from "./main.js";
import { createFFmpeg } from "@ffmpeg/ffmpeg";

const mergeBuffers = (buffer1, buffer2) => {
  var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
  tmp.set(new Uint8Array(buffer1), 0);
  tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
  return tmp.buffer;
};

export default class Server {
  constructor() {
    this.connect();
    this.ffmpeg = createFFmpeg({ log: true });

    this.bodyEl = document.querySelector("body");
    this.buffers = new Map();
  }

  connect() {
    this.socket = io("https://cypher-gobelins.herokuapp.com/", {
      transports: ["websocket", "polling", "flashsocket"],
    });

    this.socket.on("VIDEO_CREATED", this.handleNewBuffer);
  }

  sendMail(id, mail, buffer) {
    for (let i = 0; i < Math.ceil(buffer.byteLength / 1_000_000); i++) {
      this.socket.emit("SEND_VIDEO_BY_MAIL", {
        id,
        index: i,
        length: Math.ceil(buffer.byteLength / 1_000_000),
        buffer: buffer.slice(i * 1_000_000, (i + 1) * 1_000_000),
        email: mail,
      });
    }
  }

  handleNewBuffer = async (video) => {
    console.log("new video received, id : " + video.id);
    if (this.buffers.has(video.id)) {
      this.buffers.get(video.id).push(video);
    } else {
      this.buffers.set(video.id, [video]);
    }

    if (video.length > video.index + 1) return;

    //Merge all buffers from servers to one single buffer
    const videoBuffer = this.mergeVideoBuffers(video.id);
    this.cropVideo(videoBuffer, video.id)
  };

  mergeVideoBuffers(id) {
    const buffers = this.buffers.get(id);
    const mergedBuffer = buffers
      .sort((a, b) => a.index - b.index)
      .map((video) => video.buffer)
      .reduce((a, b) => mergeBuffers(a, b), new Uint8Array());
    this.buffers.delete(id);
    return mergedBuffer;
  }

  async cropVideo(videoBuffer, id) {
    const cropWidth = 1080;
    const cropHeight = 1920; 

    if(!this.ffmpeg.isLoaded()) await this.ffmpeg.load();
    

    this.ffmpeg.FS("writeFile", "video1.mp4", new Uint8Array(videoBuffer))
    // Cropping de la vidéo
    await this.ffmpeg.run(
        "-i",
        "video1.mp4",
        "-vf",
        `crop=1/3.25*in_w:in_h`,
        "output.mp4"
      )

      const croppedVideoBuffer = this.ffmpeg.FS("readFile", "output.mp4");
      console.log(croppedVideoBuffer)
      app.video.displayVideo(croppedVideoBuffer, id);
      this.ffmpeg.FS("unlink", "output.mp4");
  }
}
