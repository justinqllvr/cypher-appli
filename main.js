import "./style.css";
import Server from "./server.js";
import DropBoxApi from "./DropBoxApi";
import Video from "./video";


class App {
  static instance;
  
  constructor() {
    // this.dropbox = new DropBoxApi()
    this.server = new Server();
    this.video = new Video();

    this.centerTitleClownFiestaCss()
    console.log("ready to work U_w_U")
  }

  static getInstance() {
    if (!App.instance) App.instance = new App();
    return App.instance;
  }

  centerTitleClownFiestaCss() {
    const title = document.getElementsByClassName('title')[0]
    const circle = document.getElementsByClassName('circle')[0]

    title.style.transform = `translateX(${circle.getBoundingClientRect().width / 2}px)`
  }
}

const app = App.getInstance();
export { app };
