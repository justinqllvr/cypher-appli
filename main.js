import "./style.css";
import { io } from "socket.io-client";

class Server {
  constructor() {
    this.connect();
    this.bodyEl = document.querySelector("body");
    this.videos = [];
  }

  connect() {
    this.socket = io("https://cypher-gobelins.herokuapp.com/", {
      transports: ["websocket", "polling", "flashsocket"],
    });

    this.socket.on("VIDEO_CREATED", (args) => {
      this.videos.push(args);
      const videoList = this.videos
        .map((video, i) => {
          const videoUrl = URL.createObjectURL(
            new Blob(video, { type: "video/webm" })
          );
          return `<video src=${videoUrl} controls="true"></video>`;
        })
        .join("");

      this.bodyEl.innerHTML = videoList;

      console.log(this.videos.length);
      if (this.videos.length >= 2) {
        this.joinVideo();
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

new Server();
