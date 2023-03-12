function openDir(id) {
  document.getElementById(id).style.height = "250px";
}

function isValidFilename(filename) {
  // Check for invalid characters
  if (/[\\/:\*\?"<>\|]/.test(filename)) {
    return false;
  }

  // Check for empty filename
  if (filename.length === 0) {
    return false;
  }

  return true;
}

document.querySelector("#create-button").addEventListener("click", function (event) {
  event.preventDefault();
  createCodee(event);
});

async function createCodee(event) {
  const codeeName = document.getElementById("codee_name").value.trim();
  const saveLocation = document.getElementById("codee_path").value;
  const refPath = document.getElementById("ref_path").value;
  if (isValidFilename(codeeName)) {
    const opts = {
      method: "POST",
      body: JSON.stringify({
        repo: repo,
        codee_name: codeeName,
        save_location: saveLocation,
        ref_path: refPath,
      }),
      headers: new Headers({
        "content-type": "application/json",
      }),
    };

    await fetch("/create_codee", opts)
      .then(function (response) {
        if (response.status !== 200) {
          console.log(`Looks like there was a problem. Status code: ${response.status}`);
          return;
        }
      })
      .catch(function (error) {
        console.log("Fetch error: " + error);
      });
    location.reload();
  } else {
    alert('codee 파일 이름에는 다음 문자를 사용할 수 없습니다. \n \\ / : * ? " < > |');
    document.getElementById("codee_name").focus();
  }
}

async function updateCodee() {
  jsonData["data"] = JSON.stringify(refData);
  const codee_content = JSON.stringify(jsonData);

  const opts = {
    method: "POST",
    body: JSON.stringify({
      repo: repo,
      codee_path: content, // 현재 위치
      codee_content: codee_content,
    }),
    headers: new Headers({
      "content-type": "application/json",
    }),
  };

  await fetch(`/update_codee`, opts)
    .then((resp) => {
      if (resp.status !== 200) {
        console.log(`Looks like there was a problem. Status code: ${resp.status}`);
      }
    })
    .catch((error) => {
      console.log("Fetch error: " + error);
    });
}
