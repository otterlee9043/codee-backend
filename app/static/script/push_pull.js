function pull(project) {
  console.log("pull function");
  console.log(project);

  var url = new URL(`${window.origin}/codination/ver1/pull`);
  var params = { proj: project };
  Object.keys(params).forEach((key) => url.searchParams.append(key, params[key]));
  console.log(url);
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

function push(project) {
  console.log("push function");

  // var url = new URL('http://203.245.41.143:9999/push') ;
  var url = new URL(`${window.origin}/codination/ver1/push`);
  var params = { proj: project };
  Object.keys(params).forEach((key) => url.searchParams.append(key, params[key]));
  console.log(url);

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
  // readCodeeFile();
}

// async function readCodeeFile() {
//   const codee_path = "home/codination/ver1/app/static/files/user2/OSSLab_0420_test/codee.cd";
//   const url2 = new URL(`${window.origin}/codination/ver1/get_codee/${codee_path}`);
//   let refFile, refFileName;
//   // console.log(path, fileName);
//   const opts2 = {
//     method: "GET",
//   };
//   fetch(url2, opts2)
//     .then(function (response) {
//       if (response.status != 200) {
//         console.log(`Looks like there was a problem. Status code: ${response.status}`);
//         return;
//       }
//       // console.log(response.json());
//       response.json().then(function (data) {
//         localStorage.setItem(codee_path, data[0]);
//       });
//       // refFile = await response.json();
//     })
//     .catch(function (error) {
//       console.log("Fetch error: " + error);
//     });
// }
