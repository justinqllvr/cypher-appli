import { Dropbox } from "dropbox";
import { app } from "./main.js";

export default class DropBoxApi {
  constructor() {
    this.bodyEl = document.querySelector("body");

    this.init();
  }

  init() {
    //Connexion to dropbox
    const ACCESS_TOKEN = import.meta.env.VITE_DROPBOX_KEY;
    this.dropbox = new Dropbox({ accessToken: ACCESS_TOKEN });

    //Test connexion & display all multiVideos if connected
    this.getCurrentAccount() ? this.displayVideos() : 'DropBox not connected';

  }

  getSingleFiles = async () => {
    const res = this.dropbox
      .filesListFolder({ path: "/cypher/solo/", limit: 4 })
      .then((response) => {
        return response.result.entries;
      })
      .catch((error) => {
        console.error(error);
        return false
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
        return false
      });

    return res;
  };

  getCurrentAccount() {
    const res = this.dropbox
      .usersGetCurrentAccount()
      .then((response) => {
        return true
      })
      .catch((error) => {
        console.log(error)
        return false
      });

      return res
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
        console.log('final video uploaded !')
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
    const videos = await this.getFinalVideos()

    console.log(videos)

    videos && videos.length > 0 ? videos.map(async (file) => {
        const container = document.createElement('div')
        container.classList.add('container')

        let blob = await this.getSingleBlob(file.path_lower);
        const src = URL.createObjectURL(blob);
        const videoEl = document.createElement("video");
        videoEl.src = src;
        // videoEl.controls = true;
        videoEl.addEventListener('click', (e) => {
          this.displayForm(e, file.path_lower)
        } )

        const idEl = document.createElement('span');
        idEl.innerHTML = this.getIdFromString(file.name)

        this.bodyEl.appendChild(container);
        container.appendChild(videoEl);
        container.appendChild(idEl)
    }) : console.log('there is no final videos')
  } 

  displayForm(e, path) {
    const formEl = document.getElementById('form')
    const leaveEl = document.getElementById('leave')
    const videoEl = e.target.cloneNode(true)
    const mailInputEl = document.getElementById('mail')

    //Show form
    this.show(formEl)

    //Resize video
    formEl.appendChild(videoEl)
    videoEl.controls = true;

    //Handle form
    formEl.addEventListener('submit', (e) => {
      e.preventDefault();
      app.server.sendMail(path, mailInputEl.value)

      this.hide(formEl)
      videoEl.remove()
    })

    //Handle leave
    leaveEl.addEventListener('click', (e) => {
      e.preventDefault()
      this.hide(formEl)

      videoEl.remove()
    })
  }

  show(node) {
    node.style.visibility = 'visible';
    node.style.pointerEvents = 'all';
    node.style.opacity = '1';
    node.style.height = '100vh'
  }

  hide(node) {
    node.style.visibility = 'hidden';
    node.style.pointerEvents = 'none';
    node.style.opacity = '0';
    node.style.height = '0vh';
  }

  getIdFromString(string) {
      // Vérification si la chaîne est vide ou null
      if (!string || string.length === 0) {
        return null;
      }
    
      // Recherche du premier chiffre dans la chaîne
      const id = string.match(/\d/);
      
      // Vérification si un chiffre a été trouvé
      if (id !== null) {
        return id[0];
      } else {
        return null;
      }
  }
}
