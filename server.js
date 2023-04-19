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
    this.blobs = [];
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

    //Merge all buffers from servers to one single buffer
    const videoBuffer = this.mergeVideoBuffers(video.id);


    //Send single video to dropbox
    app.dropbox.uploadSingleVideo(video.id, videoBuffer);

    //Download 5 last solo video from soloDrive and transform them in arrayBuffer
    const files = await app.dropbox.getSingleFiles();

    await Promise.all(
      files.map(async (file) => {
        let blob = await app.dropbox.getSingleBlob(file.path_lower);
        blob = await blob.arrayBuffer()
        this.blobs.push(blob);
      })
    );

    this.blobs.push(videoBuffer)

    // Merge solos videos
    await this.mergeVideos(this.blobs, video.id)

    // TODO: Delete soloVideo when 5+ available
    // TODO: Delete finalVideo after 10 days
    // TODO: Handle Available single videos
    // 

    // this.mergeVideos(videoBuffer);
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

  async mergeVideos(buffers, id) {
    await this.ffmpeg.load();
    const tempFiles = buffers.map((video, i) => {
      this.ffmpeg.FS("writeFile", `temp_${i}.mp4`, new Uint8Array(video));
      return `temp_${i}.mp4`;
    });

    const inputPaths = [];
    for (const file of tempFiles) {
      inputPaths.push(`file ${file}`);
    }
    this.ffmpeg.FS("writeFile", "concat_list.txt", inputPaths.join("\n"));
    await this.ffmpeg.run(
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      "concat_list.txt",
      "output.mp4"
    );

    const blob = new Blob([this.ffmpeg.FS("readFile", "output.mp4")], {
      type: "video/mp4",
    });

    app.dropbox.uploadFinalVideo(id, blob)

    //Test the send mail 
    const path = "/cypher/final/" + id + ".mp4"
    this.socket.emit('SEND_VIDEO_BY_MAIL', path)

    //Push the new video in the DOM
    const src = URL.createObjectURL(blob);
    const videoEl = document.createElement("video");
    videoEl.src = src;
    videoEl.controls = true;
    this.bodyEl.appendChild(videoEl);
  }
}
