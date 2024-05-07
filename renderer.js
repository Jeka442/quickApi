document.addEventListener("DOMContentLoaded", () => {
  const jsonInput = document.getElementById("json-input");
  document.getElementById("json-input").value =
    window.localStorage.getItem("json-input") ?? "";
  setJson();

  jsonInput.addEventListener("keydown", () => {
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
            beautify();
          };
          reader.readAsText(file);
        }
      }
    }
  });
});

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

function setJson() {
  try {
    const value = document.getElementById("json-input").value;
    if (value && value.length > 0) {
      const json = JSON.parse(value);
      window.localStorage.setItem("json-input", value);
      fetch("http://localhost:3020/upload-json", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(json),
      })
        .then((response) => response.json())
        .then((data) => console.log(data))
        .catch((err) => console.error("Error posting JSON", err));
    }
  } catch {
    document.getElementById("error").style.display = "block";
  }
}
