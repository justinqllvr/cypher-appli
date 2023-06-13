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
    console.log("ready to work U_w_U")
  }

  static getInstance() {
    if (!App.instance) App.instance = new App();
    return App.instance;
  }
}

const app = App.getInstance();
export { app };
