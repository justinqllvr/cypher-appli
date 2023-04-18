import { io } from "socket.io-client";
import { app } from "./main.js";
import { FFmpeg } from "https://taisukef.github.io/ffmpeg.es.js/ffmpeg.es.js";

const mergeBuffers = (buffer1, buffer2) => {
  console.log(buffer1);
  var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
  tmp.set(new Uint8Array(buffer1), 0);
  tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
  return tmp.buffer;
};

export default class Server {
  constructor() {
    this.connect();
    this.bodyEl = document.querySelector("body");
    this.videos = new Map();
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
    console.log("new Video handled !");
    if (this.buffers.has(video.id)) {
      this.buffers.get(video.id).push(video);
    } else {
      this.buffers.set(video.id, [video]);
    }

    //Si toutes les vidéos ne sont pas arrivées, return nothing
    this.mergeVideos();
    if (!this.videos.has(video.id)) return;

    //Si elles sont toutes arrivées, faire le montage vidéo et upload la vidéo
    this.createCustomVideo(this.videos.get(video.id));

    //Upload de la video
    await app.GoogleApi.uploadVideo(this.videos.get(video.id), video.id);

    // console.log(this.videos, this.videos.get(video.id), video.id);

    // console.log(this.videos)
    // await app.GoogleApi.uploadVideo(this.videos.map((video) => {
    //     return new Blob([video], {type: "video/mp4"})
    // }));

    // console.log(this.videos[this.videoIndex])
    // console.log(this.videoIndex)
  };

  mergeVideos() {
    this.buffers.forEach((videos, id) => {
      if (videos.length === videos[0].length) {
        this.videos.set(
          id,
          videos
            .sort((a, b) => a.index - b.index)
            .map((video) => video.buffer)
            .reduce((a, b) => mergeBuffers(a, b), new Uint8Array())
        );
        this.buffers.delete(id);
      }
    });
  }

  createCustomVideo = async (arrayBufferVideo) => {
    console.log("generating video");
    const arrayBufferList = [];

    const videoList = await app.GoogleApi.getVideoList();

    //Waiting for all buffers
    await Promise.all(
      videoList.map(async (video) => {
        const arrayBuffer = await app.GoogleApi.getSingleArrayBuffer(video.id);
        arrayBufferList.push(arrayBuffer);
      })
    );

    //Merge buffers into one video
    // const videoUrl = await this.mergeArrayBufferInVideo(arrayBufferVideo, arrayBufferList[0]);

    const blobVideo1 = new Blob([arrayBufferList[0]], {
      type: "video/mp4; codecs=avc1.42E01E, mp4a.40.2",
    });
    const blobVideo2 = new Blob([arrayBufferList[1]], {
      type: "video/mp4; codecs=avc1.42E01E, mp4a.40.2",
    });

    const videoUrl1 = URL.createObjectURL(blobVideo1);
    const videoUrl2 = URL.createObjectURL(blobVideo2);

    const videoEl = document.createElement("video");
    const mediaSource = new MediaSource();
    console.log(mediaSource);

    // écouteur d'événement pour quand la source est ouverte
    mediaSource.addEventListener("sourceopen", async () => {
      console.log("in");
      // création d'un flux source et ajout des deux segments vidéo

      const sourceBuffer = mediaSource.addSourceBuffer(
        "video/mp4; codecs=avc1.42E01E, mp4a.40.2"
      );

      const response1 = await fetch(videoUrl1);
      const data1 = await response1.arrayBuffer();
      sourceBuffer.appendBuffer(data1);

      console.log(sourceBuffer)

      // const response2 = await fetch(videoUrl2);
      // const data2 = await response2.arrayBuffer();
      // sourceBuffer.appendBuffer(data2);

      const mergedVideoUrl = URL.createObjectURL(mediaSource);
      // mise à jour de l'élément vidéo pour lire la vidéo fusionnée
      videoEl.src = mergedVideoUrl;
      videoEl.controls = true;

      // ajout de l'élément vidéo au DOM
      document.body.appendChild(videoEl);

      // fetch(videoUrl1)
      //   .then((response) => response.arrayBuffer())
      //   .then(
      //     (data) => console.log(data)
      //     // sourceBuffer.appendBuffer(data)
      //   );
      // fetch(videoUrl2)
      //   .then((response) => response.arrayBuffer())
      //   .then((data) => sourceBuffer.appendBuffer(data));
    });

    const mergedVideoUrl = URL.createObjectURL(mediaSource);
    // mise à jour de l'élément vidéo pour lire la vidéo fusionnée
    videoEl.src = mergedVideoUrl;
    videoEl.controls = true;

    // ajout de l'élément vidéo au DOM
    this.bodyEl.appendChild(videoEl);

    // let finalBuffer = mergeBuffers(arrayBufferList[0], arrayBufferList[1]);
    // console.log(arrayBufferList[0]);
    // console.log(arrayBufferList[1]);
    // console.log(finalBuffer);

    // console.log(arrayBufferList);

    // const blobVideo = new Blob([finalBuffer], { type: "video/mp4" });
    // const videoUrl = URL.createObjectURL(blobVideo);

    // const videoEl = `<video src=${videoUrl} controls="true"></video>`;

    // this.bodyEl.innerHTML = videoEl;

    //Crop la vidéo grâce à ffsjpeg
  };

  mergeArrayBufferInVideo = async (buffer1, buffer2) => {
    const { createFFmpeg } = FFmpeg;
    const ffmpeg = createFFmpeg({
      log: true,
      progress: ({ ratio }) => {
        // console.log(`Progress: ${ratio}`);
      },
    });

    console.log(ffmpeg);

    // Démarrer FFmpeg
    await ffmpeg.load();

    // Convertir la première vidéo en images
    await ffmpeg.FS("writeFile", "video1.mp4", new Uint8Array(buffer1));
    await ffmpeg.run("-i", "video1.mp4", "video1-%d.png");

    // Convertir la deuxième vidéo en images
    await ffmpeg.FS("writeFile", "video2.mp4", new Uint8Array(buffer2));
    await ffmpeg.run("-i", "video2.mp4", "video2-%d.png");

    // Fusionner les tableaux d'images
    const mergedImages = [];
    let numImages = 0;
    while (true) {
      const image1 = await ffmpeg.FS("readFile", `video1-${numImages}.png`);
      const image2 = await ffmpeg.FS("readFile", `video2-${numImages}.png`);
      if (image1 && image2) {
        mergedImages.push(image1);
        mergedImages.push(image2);
      } else if (image1) {
        mergedImages.push(image1);
      } else if (image2) {
        mergedImages.push(image2);
      } else {
        break;
      }
      numImages++;
    }

    // Fusionner les images en une seule vidéo
    await ffmpeg.FS("writeFile", "merged.mp4", new Uint8Array(mergedImages));
    await ffmpeg.run(
      "-i",
      "merged-%d.png",
      "-y",
      "-vcodec",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-crf",
      "23",
      "merged.mp4"
    );

    return URL.createObjectURL(new Blob([ffmpeg.FS("readFile", "merged.mp4")]));
  };

  joinVideo() {
    //Création d'une source pour lier les deux vidéos
  }
}
