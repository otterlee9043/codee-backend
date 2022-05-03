function openNav() {
  document.getElementById("mySidebar").style.width = "250px";
  // document.querySelector("body").style.marginLeft = "250px";
  document.querySelector("body").classList.add("projectbar");
}

function closeNav() {
  document.getElementById("mySidebar").style.width = "0";
  // document.querySelector("body").style.marginLeft = "0";
  document.querySelector("body").classList.remove("projectbar");
}
