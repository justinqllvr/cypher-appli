import Server from "./server.js";
import { app } from "./main.js";

export default class GoogleApi {
  constructor() {
    this.init();

    //DOM
    this.authButton = document.getElementById("authorize_button");
    this.authButton.style.visibility = "hidden";

    this.gapiInited = false;
    this.gisInited = false;
    this.tokenClient;
    this.mainFolderId = "";

    this.API_KEY = "AIzaSyDh-p12fJ1fMAe65ltitJxKi_RRedVasYU";
    this.CLIENT_ID =
      "506410782248-ia4icje24v66kiqlboae43qo11qbk435.apps.googleusercontent.com";
    this.SCOPES =
      "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly";
    this.DISCOVERY_DOC =
      "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest";
  }

  //Load 2 Google APIS
  init() {
    // console.log("init GoogleApi");
    this.loadScript("https://apis.google.com/js/api.js", this.gapiLoaded);
    this.loadScript("https://accounts.google.com/gsi/client", this.gisLoaded);
  }

  loadScript(scriptSrc, callback) {
    const script = document.createElement("script");
    script.onload = () => {
      callback();
    };
    script.src = scriptSrc;
    document.head.appendChild(script);
  }

  gapiLoaded = () => {
    gapi.load("client", async () => {
      await gapi.client.init({
        // apiKey: this.API_KEY,
        clientId: this.CLIENT_ID,
        discoveryDocs: [this.DISCOVERY_DOC],
        scope: this.SCOPES,
      });
      gapi.auth2.getAuthInstance().signIn()
      console.log(gapi);
      // this.gapiInited = true;
      // this.maybeEnableButtons();
    });
  };

  gisLoaded = () => {
    // this.tokenClient = google.accounts.oauth2.initTokenClient({
    //   client_id: this.CLIENT_ID,
    //   scope: this.SCOPES,
    //   callback: "", // defined later
    // });
    this.gisInited = true;
    this.maybeEnableButtons();
  };

  //Show connection button
  maybeEnableButtons = () => {
    if (this.gapiInited && this.gisInited) {
      this.authButton.style.visibility = "visible";
      this.authButton.addEventListener("click", this.handleAuthClick);
    }
  };

  handleAuthClick = () => {
    this.tokenClient.callback = async (resp) => {
      if (resp.error !== undefined) {
        throw resp;
      }

      this.authButton.removeEventListener("click", this.handleAuthClick);
      this.getMainFolder("Cypher");
    };

    if (gapi.client.getToken() === null) {
      // Prompt the user to select a Google Account and ask for consent to share their data
      // when establishing a new session.
      this.tokenClient.requestAccessToken({ prompt: "consent" });
    } else {
      // Skip display of account chooser and consent dialog for an existing session.
      this.tokenClient.requestAccessToken({ prompt: "" });
    }
  };

  //FUNCTIONS
  async getMainFolder(folderName) {
    let response;

    try {
      response = await gapi.client.drive.files.list({
        q: `mimeType='application/vnd.google-apps.folder' and trashed=false and name='${folderName}'`,
        fields: "files(id, name, createdTime)",
        spaces: "drive",
      });
      // console.log(response)
    } catch (err) {
      console.log(err.message);
      return;
    }

    this.mainFolderId = response.result.files[0].id;
    // this.getBlobs()

    this.emitInitEnded();
  }

  emitInitEnded() {
    // console.log("Initi ended");
    app.initServer();
    // this.createFile();
  }

  uploadVideo = async (video, id) => {
    let data = new FormData();
    let metadata = {
      name: id,
      mimeType: "video/mp4",
      parents: [this.mainFolderId],
    };
    data.append(
      "metadata",
      new Blob([JSON.stringify(metadata)], { type: "application/json" })
    );
    data.append("file", new Blob([video], { type: "video/mp4" }));

    fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",
      {
        method: "POST",
        headers: new Headers({
          Authorization: "Bearer " + gapi.auth.getToken().access_token,
        }),
        body: data,
      }
    ).then((response) => {
      // console.log(response);
    });
  };

  testData = (blob) => {
    // console.log(blob);
  };

  createFile = async (name) => {
    try {
      // console.log("in Create File");
      //     console.log("createFile")
      //   const params = {
      //     metadata: {
      //       name: name,
      //       mimeType: "application/vnd.google-apps.document",
      //     },
      //     parents: [this.mainFolderId],
      //     fields: id,
      //   };

      const response = await gapi.client.drive.files.create({
        parents: [this.mainFolderId],
        uploadType: "media",
        mimeType: "application/vnd.google-apps.document",
        name: name,
        // randomData: 19,
        media: {
          body: "text de test",
        },
        fields: "id",
      });
      console.log("File uploaded successfully : ", response.result);
    } catch (error) {
      console.log("An error occured :", error);
    }
  };

  getVideoList = async () => {
    let response;

    try {
      response = await gapi.client.drive.files.list({
        q: `'${this.mainFolderId}' in parents and trashed=false`,
        spaces: "Drive",
      });

      return response.result.files;
    } catch (err) {
      console.log(err.message);
      return;
    }
  };

  getSingleArrayBuffer = async (id) => {
    // this.getSingleArrayBuffer(response.result.files[0].id)

    let response;

    // console.log(id)

    try {
      response = await gapi.client.drive.files.get({
        fileId: id,
        alt: "media",
      });

      const videoArrayBuffer = this.base64ToArrayBuffer(
        window.btoa(response.body)
      );

      return videoArrayBuffer;

      const dataUrl =
        "data:" +
        res.headers["Content-Type"] +
        ";base64," +
        window.btoa(res.body);
    } catch (err) {
      console.log(err);
      return;
    }
  };

  base64ToArrayBuffer = (base64) => {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    let bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
  };

  arrayBufferToBase64(buffer) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}

// export default new GoogleApi();
