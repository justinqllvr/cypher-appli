import "./style.css";
import GoogleApi from "./GoogleApi.js";
import Server from "./server.js";

class App {
  static instance;

  constructor() {
    this.init();
  }

  init() {
    this.GoogleApi = new GoogleApi();
  }

  async initServer() {
    this.server = await new Server();
    console.log("ready to work :D")
  }

  static getInstance() {
    if (!App.instance) App.instance = new App();
    return App.instance;
  }
}

const app = App.getInstance();
export { app };
