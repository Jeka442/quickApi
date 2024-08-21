const basePath = "http://localhost:3020/";

const jsonInput = document.getElementById("json-input");
const statusInput = document.getElementById("status");
const delayInput = document.getElementById("delay");
const sync = document.getElementById("sync");
const apiSelect = document.getElementById("api-select");
const editNameBtn = document.getElementById("edit-name");
const addNameBtn = document.getElementById("add-name");
const deleteNameBtn = document.getElementById("delete-name");
const submitDialog = document.querySelector("#submit-name");
const submitNameBtn = document.querySelector("#submit-name > button");
const submitNameInput = document.querySelector("#submit-name > input");

function setToTextarea(obj) {
  jsonInput.value = JSON.stringify(obj, null, 3);
}

function setSync(flag) {
  sync.setAttribute("data-for-sync", `${flag}`);
  apiSelect.disabled = !flag;
  editNameBtn.disabled = !flag;
  addNameBtn.disabled = !flag;
  deleteNameBtn.disabled = !flag;
  if (!flag) {
    submitDialog.style.height = "0";
  }
}
function setLoading(flag) {
  sync.setAttribute("data-for-loading", `${flag}`);
}

async function onLoad() {
  const endpoints = await (await fetch(basePath)).json();
  const options = endpoints.map((endpoint) => {
    return `<option value=${endpoint}>${endpoint}</option>`;
  });
  apiSelect.innerHTML = options;
  setSync(true);
  setLoading(true);
  const data = await getByName(endpoints[0]);
  setToTextarea(data?.obj ?? {});
  delayInput.value = data?.delay ?? 0;
  statusInput.value = data?.status ?? 200;
  setLoading(false);
}
onLoad();

async function getByName(name) {
  const data = await (await fetch(basePath + "name/" + name)).json();
  return data;
}

document.addEventListener("DOMContentLoaded", () => {
  statusInput.addEventListener("change", function (event) {
    setSync(false);
  });

  delayInput.addEventListener("change", function (event) {
    setSync(false);
  });

  jsonInput.addEventListener("keydown", function (event) {
    if (event.key === "Tab") {
      event.preventDefault();
      const start = this.selectionStart;
      const end = this.selectionEnd;
      const space = "   ";
      this.value =
        this.value.substring(0, start) + space + this.value.substring(end);
      this.selectionStart = this.selectionEnd = start + space.length;
    }
    setSync(false);
    document.getElementById("error").style.display = "none";
  });

  jsonInput.addEventListener("dragover", (event) => {
    event.preventDefault();
    event.stopPropagation();
  });

  jsonInput.addEventListener("drop", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.items) {
      for (const item of event.dataTransfer.items) {
        if (item.kind === "file" && item.type === "application/json") {
          const file = item.getAsFile();
          const reader = new FileReader();
          reader.onload = function (e) {
            jsonInput.value = e.target.result;
            setSync(false);
          };
          reader.readAsText(file);
        }
      }
    }
  });
});

function closeWindow() {
  window.electronAPI.closeWindow(); // Calls the function exposed via preload.js
}

function minimize() {
  window.electronAPI.minimizeWindow(); // Calls the function exposed via preload.js
}

function beautify() {
  document.getElementById("error").style.display = "none";
  const elm = document.getElementById("json-input");
  const value = elm.value;
  try {
    const json = JSON.parse(value);
    elm.value = JSON.stringify(json, null, 3);
  } catch {
    document.getElementById("error").style.display = "block";
  }
}
function addName() {
  submitDialog.style.height = "100%";
  submitNameBtn.setAttribute("data-for", "add");
}

function editName() {
  submitDialog.style.height = "100%";
  submitNameBtn.setAttribute("data-for", "edit");
}
async function setJson() {
  try {
    const value = document.getElementById("json-input").value;
    const status = statusInput.value;
    const delay = delayInput.value;
    const name = apiSelect.value;
    if (value && value.length > 0) {
      const json = JSON.parse(value);
      setLoading(true);

      const result = await fetch(basePath + "setData", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name,
          obj: json,
          status: status,
          delay: delay,
        }),
      });
      if (result.status === 200) {
        setSync(true);
      }
      setLoading(false);
    }
  } catch {
    setLoading(false);
    document.getElementById("error").style.display = "block";
  }
}

async function uploadDB() {
  window.electronAPI.uploadDB();
}

window.electronAPI.onUploadDBReply((event, result) => {
  if (result.success) {
    alert(result.message);
    onLoad();
  } else {
    alert("Error: " + result.message);
  }
});


async function downloadDB() {
  window.electronAPI.downloadDB();
}

async function changeApi(e) {
  const data = await getByName(e.value);
  setToTextarea(data?.obj ?? {});
  delayInput.value = data?.delay ?? 0;
  statusInput.value = data?.status ?? 200;
}

async function submitNameHandler(doc) {
  const type = doc.getAttribute("data-for");
  const newName = submitNameInput.value;

  if (type && newName && newName.length > 0) {
    setLoading(true);
    if (type === "add") {
      const result = await fetch(basePath + "name", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newName,
        }),
      });
      switch (result.status) {
        case 201: {
          apiSelect.innerHTML =
            apiSelect.innerHTML +
            `<option value="${newName}">${newName}</option>`;
          apiSelect.value = newName;
          jsonInput.value = "{}";
          delayInput.value = 0;
          statusInput.value = 200;
          break;
        }
        case 409: {
          apiSelect.value = newName;
          break;
        }
        default: {
          alert("something went wrong");
        }
      }
    } else {
      const result = await fetch(basePath + "name", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: apiSelect.value,
          newName: newName,
        }),
      });
      if (result.status === 200) {
        const optionDoc = document.querySelector(
          `option[value="${apiSelect.value}"]`
        );
        optionDoc.value = newName;
        optionDoc.innerHTML = newName;
        apiSelect.value = newName;
      } else {
        submitNameInput.value = "Existed name!";
        setLoading(false);
        return;
      }
    }
    submitNameInput.value = "";
    submitDialog.style.height = "0";
    setLoading(false);
  }
}

async function deleteName() {
  const optionsLength = document.querySelectorAll("option").length;
  if (optionsLength === 1) {
    jsonInput.value = "{}";
    await setJson();

    setLoading(false);
    return;
  }
  setLoading(true);
  const result = await fetch(basePath + apiSelect.value, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (result.status === 200) {
    window.location.reload();
  }
  setLoading(false);
}
