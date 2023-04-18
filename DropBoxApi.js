import { Dropbox } from "dropbox";

export default class DropBoxApi {
  constructor() {
    this.init();
  }

  init() {
    //Connexion to dropbox
    console.log();
    const ACCESS_TOKEN = import.meta.env.VITE_DROPBOX_KEY;
    this.dropbox = new Dropbox({ accessToken: ACCESS_TOKEN });
    console.log(this.dropbox);
    this.getCurrentAccount();
    this.getAllFiles();
  }

  getAllFiles() {
    this.dropbox
      .filesListFolder({path: '/cypher'})
      .then((response) => {
        console.log(response);
      })
      .catch((error) => {
        console.error(error);
      });
  }

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
}
