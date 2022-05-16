function pull(username) {
  console.log("pull function");
  console.log(username);

  var url = new URL(`${window.origin}/codination/ver1/pull`);
  let repoName = document.getElementById("treeitem").getAttribute("name") ;
  var params = { username: username, repo: repoName };
  Object.keys(params).forEach((key) => url.searchParams.append(key, params[key]));
  console.log(url);
  if(cacheChange) {
    // saveCode
    username = document.querySelector(".dir").getAttribute('id') ;
    console.log(username) ;
    saveCodee(username) ;
    cacheChange = 0 ;
  }
  //commit & push
  push(username) ;

  fetch(url, {
    method: "GET",
  })
    .then(function (response) {
      if (response.status != 200) {
        console.log(`Looks like there was a problem. Status code: ${response.status}`);
        return;
      }
      response.json().then(function (data) {
        console.log("done");
        location.reload();
      });
    })
    .catch(function (error) {
      console.log("Fetch error: " + error);
    });
}

async function push(username) {
  console.log("push function");

  // var url = new URL('http://203.245.41.143:9999/push') ;
  var url = new URL(`${window.origin}/codination/ver1/push`);
  let repoName = document.getElementById("treeitem").getAttribute("name") ;
  var params = { username: username, repo: repoName };
  Object.keys(params).forEach((key) => url.searchParams.append(key, params[key]));
  console.log(url);

  await fetch(url, {
    method: "GET",
  })
    .then(function (response) {
      if (response.status != 200) {
        console.log(`Looks like there was a problem. Status code: ${response.status}`);
        return;
      }
      response.json().then(function (data) {
        console.log("done");
      });
    })
    .catch(function (error) {
      console.log("Fetch error: " + error);
    });
}

function createCodeeFile(fileName, path) {
  const url = new URL(`${window.origin}/codination/ver1/create_codee`);
  console.log(path, fileName);
  const opts = {
    method: "POST",
    body: JSON.stringify({
      path: path,
      fileName: fileName,
    }),
    headers: new Headers({
      "content-type": "application/json",
    }),
  };
  fetch(url, opts)
    .then(function (response) {
      if (response.status != 200) {
        console.log(`Looks like there was a problem. Status code: ${response.status}`);
        return;
      }
      // response.json().then(function (data) {
      //   console.log("done");
      // });
    })
    .catch(function (error) {
      console.log("Fetch error: " + error);
    });
}
