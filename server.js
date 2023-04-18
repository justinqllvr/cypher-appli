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

  handleNewBuffer = async (video) => {
    if (this.buffers.has(video.id)) {
      this.buffers.get(video.id).push(video);
    } else {
      this.buffers.set(video.id, [video]);
    }

    if (video.length > video.index + 1) return;

    const videoBuffer = this.mergeVideoBuffers(video.id);

    // TODO: Upload solo video to solo Drive
    // TODO: Download 5 last solo videos from solo Drive
    // TODO: Merge solos videos in 1 final video
    // TODO: Upload final video to final Drive
    // TODO: Show video to UI

    this.mergeVideos(videoBuffer);
  };

  mergeVideoBuffers(id) {
    const buffers = this.buffers.get(id)
    const mergedBuffer = buffers
      .sort((a, b) => a.index - b.index)
      .map((video) => video.buffer)
      .reduce((a, b) => mergeBuffers(a, b), new Uint8Array())
    this.buffers.delete(id);
    return mergedBuffer;
  }

  async mergeVideos(exampleBuffer) {
    const buffers = Array(3).fill(exampleBuffer);
    
    await this.ffmpeg.load();
    const tempFiles = buffers.map((video, i) => {
      this.ffmpeg.FS("writeFile", `temp_${i}.mp4`, new Uint8Array(video))
      return `temp_${i}.mp4`;
    });

    const inputPaths = [];
    for (const file of tempFiles) {
      inputPaths.push(`file ${file}`);
    }
    this.ffmpeg.FS('writeFile', 'concat_list.txt', inputPaths.join('\n'));
    await this.ffmpeg.run('-f', 'concat', '-safe', '0', '-i', 'concat_list.txt', 'output.mp4');

    const blob = new Blob([this.ffmpeg.FS('readFile', 'output.mp4')], { type: 'video/mp4' })
    const src = URL.createObjectURL(blob);
    const videoEl = document.createElement('video');
    videoEl.src = src;
    videoEl.controls = true;
    this.bodyEl.appendChild(videoEl);
  }
}
