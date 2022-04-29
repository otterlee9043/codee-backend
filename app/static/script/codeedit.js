let codee;

const cd = document.getElementById("cd");
if (cd) {
  const cdpath = filepath;
  const refFilepath = document.getElementById("filename").innerText;
  const opts = {
    method: "POST",
    body: JSON.stringify({
      filepath: cdpath,
    }),
  };
  // cd_path -> cd_data
  // file_path -> code
  fetch(`${window.origin}/codination/ver1/show_ref_file`, opts)
    .then(function (response) {
      if (response.status !== 200) {
        console.log(`Looks like there was a problem. Status code: ${response.status}`);
        return;
      }
      response.json().then(function (data) {
        console.log(data);
        const code_tag = document.getElementById("code");
        // change the name
        console.log(code_tag);
        code_tag.className = get_extension(filename);
        console.log(get_extension(filename));
        code_tag.textContent = data.ref_data;
        console.log("done1");
        codee = data.cd_data;
        hljs.highlightAll();
        hljs.initLineNumbersOnLoad();

        addEventInMenumar(code_tag);
      });
    })
    .catch(function (error) {
      console.log("Fetch error: " + error);
    });
  // console.log("done2");
  // const numbers = document.querySelectorAll(".hljs-ln-numbers");
  // console.log(numbers);
  // Array.from(numbers).map((item, index) => {
  //   const number = parseInt(item.getAttribute("data-line-number"));
  //   console.log(number);
  //   item.parentElement.id = `L${number}`;
  //   console.log(item.parentElement.id);
  // });
  console.log(codee);
} else {
  console.log("not CD file!");
}
