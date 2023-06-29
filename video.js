import { app } from "./main.js";

export default class Video {
  constructor() {
    //HTML
    this.videosEl = document.querySelector(".videos-container");
    this.cloneContainerEl = document.querySelector(".clone-container");
    this.leaveEl = document.getElementById('leave')
    this.formContainerEl = document.getElementById('form-container')
    this.submitButtonEl = document.getElementById('submit')
    this.mailInputEl = document.getElementById('mail')

    this.videoCloneEl

    this.videos = new Map();

    //Handle form
    this.submitButtonEl.addEventListener('click', this.sendMail.bind(this))

    //Handle leave
    this.leaveEl.addEventListener('click', this.leave.bind(this))

    this.id;
    this.videoBuffer;
  }

  displayVideo(videoBuffer, id) {
    this.id = id
    this.videos.set(this.id, videoBuffer)

    const that = this
    //Push the new video in the DOM
    const blob = new Blob([videoBuffer], {
      type: "video/mp4",
    });
    const src = URL.createObjectURL(blob);
    const videoEl = document.createElement("video");
    videoEl.src = src;
    videoEl.controls = false;
    videoEl.width = 250
    videoEl.height = 450
    videoEl.addEventListener("click", (e) => {
      that.displayForm(e, id);
    });

    const container = document.createElement("div");
    container.classList.add("container");

    const idEl = document.createElement("span");
    idEl.classList.add('id')
    idEl.innerHTML = 'ID ' + this.id;

    const selectEl = document.createElement("div");
    selectEl.classList.add('select')
    selectEl.innerHTML = 'Sélectionner';


    this.videosEl.appendChild(container);
    container.appendChild(videoEl);
    container.appendChild(idEl);
    container.appendChild(selectEl);
  }

  displayForm(e, id) {
    this.videoCloneEl = e.target.cloneNode(true)
    this.videoBuffer = this.videos.get(id)

    //Show form
    this.show(this.formContainerEl)

    //Resize video
    this.videoCloneEl.classList.add('videoClone')
    this.cloneContainerEl.appendChild(this.videoCloneEl);
    this.videoCloneEl.controls = true;
  }

  sendMail(e) {
    e.preventDefault();

    console.log('submit')

    app.server.sendMail(this.id, this.mailInputEl.value, this.videoBuffer)

    this.hide(this.formContainerEl)
    this.videoCloneEl.remove()

  }

  leave(e) {
    e.preventDefault()
    this.hide(this.formContainerEl)
    this.videoCloneEl.remove()
  }

  show(node) {
    node.style.visibility = 'visible';
    node.style.pointerEvents = 'all';
    node.style.opacity = '.95';
    node.style.height = '100vh'
  }

  hide(node) {
    node.style.visibility = 'hidden';
    node.style.pointerEvents = 'none';
    node.style.opacity = '0';
    node.style.height = '0vh';
  }


}
