import { Dropbox } from "dropbox";

export default class DropBoxApi {
  constructor() {
    this.bodyEl = document.querySelector("body");

    this.init();
  }

  init() {
    //Connexion to dropbox
    const ACCESS_TOKEN = import.meta.env.VITE_DROPBOX_KEY;
    this.dropbox = new Dropbox({ accessToken: ACCESS_TOKEN });


    //Display all multi videos
    this.displayVideos()

    //Test connexion
    this.getCurrentAccount();
  }

  getSingleFiles = async () => {
    const res = this.dropbox
      .filesListFolder({ path: "/cypher/solo/", limit: 2 })
      .then((response) => {
        return response.result.entries;
      })
      .catch((error) => {
        console.error(error);
      });

    return res;
  };

  getFinalVideos = async () => {
    const res = this.dropbox
      .filesListFolder({ path: "/cypher/final/" })
      .then((response) => {
        return response.result.entries;
      })
      .catch((error) => {
        console.error(error);
      });

    return res;
  };

  getCurrentAccount() {
    this.dropbox
      .usersGetCurrentAccount()
      .then((response) => {
        console.log(response);
      })
      .catch((error) => {
        console.error(error);
      });
  }

  uploadSingleVideo(id, file) {
    this.dropbox
      .filesUpload({ path: "/cypher/solo/" + id + ".mp4", contents: file })
      .then(function (response) {
        console.log(response);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  uploadFinalVideo(id, file) {
    this.dropbox
      .filesUpload({ path: "/cypher/final/" + id + ".mp4", contents: file })
      .then(function (response) {
        console.log(response);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  getSingleBlob = async (path) => {
    const res = this.dropbox
      .filesDownload({ path: path })
      .then((response) => {
        return response.result.fileBlob;
      })
      .catch((error) => {
        console.error(error);
      });

      return res
  };

  async displayVideos() {
    console.log("first")
    const videos = await this.getFinalVideos()

    videos.map(async (file) => {
        let blob = await this.getSingleBlob(file.path_lower);
        const src = URL.createObjectURL(blob);
        const videoEl = document.createElement("video");
        videoEl.src = src;
        videoEl.controls = true;
        this.bodyEl.appendChild(videoEl);
    })
  } 
}
