const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const pageContainerEl = document.querySelector('.page');
const textareaEl = document.querySelector('.page > .textarea');
const overlayEl = document.querySelector('.page > .overlay');
const liner = document.getElementById("paper-line-toggle");
var dateTilt = 310;
var today = new Date();
var dateState = 1;
var dateBool = true;
var imgURL;

// Initialize
function init () {
  document.getElementById('equation-hover').style.display = "none";
  document.getElementById("paper-margin-toggle").checked = true;
  document.getElementById("paper-line-toggle").checked = true;
  document.getElementById("paper-lighting-toggle").checked = true;
  document.getElementById("paper-date-toggle").checked = false;
  document.getElementById("date-day").value = today.getDate();
  document.getElementById("date-day").disabled = true;
  document.getElementById("date-month").value = today.getMonth();
  document.getElementById("date-month").disabled = true;
  document.getElementById("date-year").value = today.getFullYear();
  document.getElementById("date-year").disabled = true;
  document.getElementById("date-format").disabled = true;
  dateTilt = randomNr();
  document.getElementById('date-container').style.transform = "rotate(" + dateTilt + "deg)";
  document.getElementById('date-container').style.visibility = "hidden";
  document.querySelector('.page').classList.add('margined-page');
  generateImage();
  textareaEl.style.fontFamily = document.getElementById("handwriting-font").value;
  textareaEl.style.color = document.getElementById("ink-color").value;
  textareaEl.style.fontSize = document.getElementById("font-size").value + "pt";
  textareaEl.style.paddingTop = document.getElementById("top-padding").value + "px";
  textareaEl.style.wordSpacing = document.getElementById("word-spacing").value + "px";
}

// Random Tilt Generator
function genRand () {
  dateTilt = randomNr();
}
function randomNr(){
  return Math.floor(Math.random() * (350 - 300 + 1)) + 300;
}

// Font Upload Processing
function readFile(fileObj) {
  const reader = new FileReader();
  reader.onload = e => {
    const newFont = new FontFace('temp-font', e.target.result);
    newFont.load()
      .then(loadedFace => {
        document.fonts.add(loadedFace);
        textareaEl.style.fontFamily = 'temp-font';
      })
  }
  reader.readAsArrayBuffer(fileObj)
}

// Artifiial Paper Styling
function applyPaperStyles() {
  textareaEl.style.color = document.getElementById("ink-color").value;
  textareaEl.style.fontSize = document.getElementById("font-size").value + "pt";
  textareaEl.style.paddingTop = document.getElementById("top-padding").value + "px";
  textareaEl.style.wordSpacing = document.getElementById("word-spacing").value + "px";

  if(document.getElementById("paper-date-toggle").checked == true) {
    dateTilt = randomNr();
    document.getElementById('date-container').style.transform = "rotate(" + dateTilt + "deg)";
  }

  pageContainerEl.style.border = 'none';
  if(document.getElementById("paper-lighting-toggle").checked == true) {
    pageContainerEl.style.background = 'linear-gradient(to right,#eee, #ddd)';
    overlayEl.style.background = `linear-gradient(${Math.random()*360}deg, #0008, #0000)`
    overlayEl.style.display = 'block';
  }
  if(document.getElementById('paper-lighting-toggle').checked == false) {
    pageContainerEl.style.background = '#EDEDED';
  }
  if (liner.checked == false) {
    textareaEl.classList.remove('paper-lined');
    textareaEl.classList.add('paper');
  }
  if (liner.checked == true) {
    textareaEl.classList.remove('paper');
    textareaEl.classList.add('paper-lined');
  }
}

// Removing Artificial Paper Styling
function removePaperStyles() {
  pageContainerEl.style.border = '1px solid #ccc';
  pageContainerEl.style.background = 'linear-gradient(to right,#fff, #fff)';
  overlayEl.style.display = 'none';
  textareaEl.classList.remove('paper');
  textareaEl.classList.remove('paper-lined');
}

// Generate Output Image
async function generateImage() {
  applyPaperStyles();

  try{
    const canvas = await html2canvas(document.querySelector(".page"), {
      scrollX: 0,
      scrollY: -window.scrollY
    })
    
    document.querySelector('.output').innerHTML = '';
    const img = document.createElement('img');
    img.src = canvas.toDataURL("img/jpeg");
    document.querySelector('.output').appendChild(img);

    document.querySelectorAll('a.download-button').forEach(a => {
      a.href = img.src;
      imgURL = a.href;
      a.download = 'assignment';
      a.classList.remove('disabled');
    })
    document.querySelectorAll('a.pdf-button').forEach(a => {
      a.classList.remove('disabled');
    })
  }catch(err) {
    alert("An Error Occured: " + err);
  }

  removePaperStyles();

  if(isMobile) {
    smoothlyScrollTo('#output');
  }
}

// PDF Generator
function pdfGenerator() {
  var doc = new jsPDF();
  doc.addImage(imgURL, 10, 10);
  doc.save('assignment.pdf');
}

// Equation Functionality
function eqcopier(superc) {
  document.getElementById("eqcop").style.visibility = "visible";
  var eqtb = document.getElementById("eqcop");
  eqtb.value = superc;
  eqtb.select();
  eqtb.setSelectionRange(0, 99999);
  try {
    document.execCommand("copy");
  } catch { 
    alert("Cannot COPY!");
  }
  document.getElementById("eqcop").style.visibility = "hidden";
  document.getElementById('equation-hover').style.display = "none";
}

// Listeners
document.querySelector("#note").addEventListener('paste', (event) => {
  if(!event.clipboardData.types.includes('Files')) {
    event.preventDefault();
    var text = event.clipboardData.getData("text/plain");
    document.execCommand("insertHTML", false, text);
  }
})

document.querySelector('select#handwriting-font').addEventListener('change', e => {
  textareaEl.style.fontFamily = e.target.value;
  document.getElementById("date-container").style.fontFamily = e.target.value;
  if (e.target.value == "'Homemade Apple', cursive") {
    document.getElementById("top-padding").value = 2;
    textareaEl.style.paddingTop = 2;
  }
  if (e.target.value == "'Cedarville Cursive', cursive") {
    document.getElementById("top-padding").value = 2;
    textareaEl.style.paddingTop = 2;
  }
  if (e.target.value == "'Caveat', cursive") {
    document.getElementById("top-padding").value = 7;
    textareaEl.style.paddingTop = 7;
  }
  if (e.target.value == "'Liu Jian Mao Cao', cursive") {
    document.getElementById("top-padding").value = 6;
    textareaEl.style.paddingTop = 6;
  }
  if (e.target.value == "'Shadows Into Light', cursive") {
    document.getElementById("top-padding").value = 4;
    textareaEl.style.paddingTop = 4;
  }
  if (e.target.value == "'Satisfy', cursive") {
    document.getElementById("top-padding").value = 7;
    textareaEl.style.paddingTop = 7;
  }
  if (e.target.value == "'Zeyada', cursive") {
    document.getElementById("top-padding").value = 7;
    textareaEl.style.paddingTop = 7;
  }
  if (e.target.value == "'Gaegu', cursive") {
    document.getElementById("top-padding").value = 9;
    textareaEl.style.paddingTop = 9;
  }
})

document.querySelector('select#ink-color').addEventListener('change', e => {
  textareaEl.style.color = e.target.value;
  document.getElementById("date-container").style.color = e.target.value;
})

document.querySelector('input#font-size').addEventListener('change', e => {
  textareaEl.style.fontSize = e.target.value + 'pt';
})

document.querySelector('input#top-padding').addEventListener('change', e => {
  textareaEl.style.paddingTop = e.target.value + 'px';
})

document.querySelector('input#word-spacing').addEventListener('change', e => {
  textareaEl.style.wordSpacing = e.target.value + 'px';
})

document.querySelector('#font-file').addEventListener('change', e => {
  readFile(e.target.files[0])
})

document.querySelector('#paper-margin-toggle').addEventListener('change', e => {
  document.querySelector('.page').classList.toggle('margined-page');
  dateState += 1;
  if(dateState%2 == 0) {
    document.getElementById("paper-date-toggle").disabled = false;
    document.getElementById("paper-date-toggle").checked = dateBool;
  }
  else {
    document.getElementById("paper-date-toggle").disabled = true;
    dateBool = document.getElementById("paper-date-toggle").checked;
    document.getElementById("paper-date-toggle").checked = false;
  }
})

document.querySelector("#paper-date-toggle").addEventListener('change', e => {
  if (document.getElementById("paper-date-toggle").checked == false) {
    document.getElementById("date-day").disabled = true;
    document.getElementById("date-month").disabled = true;
    document.getElementById("date-year").disabled = true;
    document.getElementById("date-format").disabled = true;
    document.getElementById("date-container").style.visibility = "hidden";
  }
  if (document.getElementById("paper-date-toggle").checked == true) {
    document.getElementById("date-day").disabled = false;
    document.getElementById("date-month").disabled = false;
    document.getElementById("date-year").disabled = false;
    document.getElementById("date-format").disabled = false;
    document.getElementById("date-container").style.visibility = "visible";
    if(document.getElementById("date-format").value == "day") {
      document.getElementById("date-container").innerHTML = document.getElementById("date-day").value + "/" + document.getElementById("date-month").value + "/" + document.getElementById("date-year").value;
    }
    if(document.getElementById("date-format").value == "month") {
      document.getElementById("date-container").innerHTML = document.getElementById("date-month").value + "/" + document.getElementById("date-day").value + "/" + document.getElementById("date-year").value;
    }
  }
})

document.querySelector('.equation-palette').addEventListener('click', e => {
  if(document.getElementById('equation-hover').style.display == "none") {
    document.getElementById('equation-hover').style.display = "unset";
  }
  else if(document.getElementById('equation-hover').style.display != "none") {
    document.getElementById('equation-hover').style.display = "none";
  }
})

document.querySelector('.close-icon').addEventListener('click', e => {
  document.getElementById('equation-hover').style.display = "none";
})

document.querySelector("#date-day").addEventListener('change', e => {
  if(document.getElementById("date-day").value > 31) {
    document.getElementById("date-day").value = 31;
  }
  if(document.getElementById("date-day").value < 1) {
    document.getElementById("date-day").value = 1;
  }
  if(document.getElementById("date-format").value == "day") {
    document.getElementById("date-container").innerHTML = document.getElementById("date-day").value + "/" + document.getElementById("date-month").value + "/" + document.getElementById("date-year").value;
  }
  if(document.getElementById("date-format").value == "month") {
    document.getElementById("date-container").innerHTML = document.getElementById("date-month").value + "/" + document.getElementById("date-day").value + "/" + document.getElementById("date-year").value;
  }
})

document.querySelector("#date-month").addEventListener('change', e => {
  if(document.getElementById("date-month").value > 12) {
    document.getElementById("date-month").value = 12;
  }
  if(document.getElementById("date-month").value < 1) {
    document.getElementById("date-month").value = 1;
  }
  if(document.getElementById("date-format").value == "day") {
    document.getElementById("date-container").innerHTML = document.getElementById("date-day").value + "/" + document.getElementById("date-month").value + "/" + document.getElementById("date-year").value;
  }
  if(document.getElementById("date-format").value == "month") {
    document.getElementById("date-container").innerHTML = document.getElementById("date-month").value + "/" + document.getElementById("date-day").value + "/" + document.getElementById("date-year").value;
  }
})

document.querySelector("#date-year").addEventListener('change', e => {
  if(document.getElementById("date-year").value > 9999) {
    document.getElementById("date-year").value = 9999;
  }
  if(document.getElementById("date-year").value < 1000) {
    document.getElementById("date-year").value = 1000;
  }
  if(document.getElementById("date-format").value == "day") {
    document.getElementById("date-container").innerHTML = document.getElementById("date-day").value + "/" + document.getElementById("date-month").value + "/" + document.getElementById("date-year").value;
  }
  if(document.getElementById("date-format").value == "month") {
    document.getElementById("date-container").innerHTML = document.getElementById("date-month").value + "/" + document.getElementById("date-day").value + "/" + document.getElementById("date-year").value;
  }
})

document.querySelector("#date-format").addEventListener('change', e => {
  if(document.getElementById("date-format").value == "day") {
    document.getElementById("date-container").innerHTML = document.getElementById("date-day").value + "/" + document.getElementById("date-month").value + "/" + document.getElementById("date-year").value;
  }
  if(document.getElementById("date-format").value == "month") {
    document.getElementById("date-container").innerHTML = document.getElementById("date-month").value + "/" + document.getElementById("date-day").value + "/" + document.getElementById("date-year").value;
  }
})

document.querySelector('.generate-image').addEventListener('click', generateImage)

// Footer Copyright
document.querySelector('#year').innerHTML = today.getFullYear();

// Smooth Scroll
function smoothlyScrollTo(hashval) {
  let target = document.querySelector(hashval)
  target.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  })
  history.pushState(null, null, hashval)
}

// Anchoring
const anchorlinks = document.querySelectorAll('a[href^="#"]');

for (let item of anchorlinks) { 
  item.addEventListener('click', (e)=> {
    let hashval = item.getAttribute('href')
    smoothlyScrollTo(hashval);
    e.preventDefault()
  })
}

// Information Panel
function infotab () {
  document.getElementById('info-tab').classList.toggle('info-hider');
  if(document.getElementById('info-tab').classList.contains('info-hider') == true) {
    document.getElementById('info-image').src = 'img/information-button.png';
    document.getElementById('top-most').classList.remove('info-hider');
  }
  else {
    document.getElementById('info-image').src = 'img/cross-button.png';
    document.getElementById('top-most').classList.add('info-hider');
  }
}
