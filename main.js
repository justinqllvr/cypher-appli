import "./style.css";
import Server from "./server.js";

class App {
  static instance;
  
  constructor() {
    this.server = new Server();
    console.log("ready to work :3")
  }

  static getInstance() {
    if (!App.instance) App.instance = new App();
    return App.instance;
  }
}

const app = App.getInstance();
export { app };
