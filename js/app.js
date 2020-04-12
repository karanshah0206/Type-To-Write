const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const pageContainerEl = document.querySelector('.page');
const textareaEl = document.querySelector('.page > .textarea');
const overlayEl = document.querySelector('.page > .overlay');
const liner = document.getElementById("paper-line-toggle");

function init () {
  document.getElementById("paper-margin-toggle").checked = true;
  document.getElementById("paper-line-toggle").checked = true;
  document.getElementById("paper-lighting-toggle").checked = true;
  document.getElementById("margin-style").value = "double";
  document.querySelector('.page').classList.add('margined-page');
  generateImage();
  textareaEl.style.fontFamily = document.getElementById("handwriting-font").value;
  textareaEl.style.color = document.getElementById("ink-color").value;
  textareaEl.style.fontSize = document.getElementById("font-size").value + "pt";
  textareaEl.style.paddingTop = document.getElementById("top-padding").value + "px";
  textareaEl.style.wordSpacing = document.getElementById("word-spacing").value + "px";
}

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

function applyPaperStyles() {
  textareaEl.style.fontFamily = document.getElementById("handwriting-font").value;
  textareaEl.style.color = document.getElementById("ink-color").value;
  textareaEl.style.fontSize = document.getElementById("font-size").value + "pt";
  textareaEl.style.paddingTop = document.getElementById("top-padding").value + "px";
  textareaEl.style.wordSpacing = document.getElementById("word-spacing").value + "px";

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

function removePaperStyles() {
  pageContainerEl.style.border = '1px solid #ccc';
  pageContainerEl.style.background = 'linear-gradient(to right,#fff, #fff)';
  overlayEl.style.display = 'none';
  textareaEl.classList.remove('paper');
  textareaEl.classList.remove('paper-lined');
}

async function generateImage() {
  applyPaperStyles();

  try{
    const dataURL = await domtoimage.toJpeg(
      document.querySelector(".page"),
      {quality: 0.99}
    )
    
    document.querySelector('.output').innerHTML = '';
    const img = document.createElement('img');
    img.src = dataURL;
    document.querySelector('.output').appendChild(img);

    document.querySelectorAll('a.download-button').forEach(a => {
      a.href = img.src;
      a.download = 'assignment';
      a.classList.remove('disabled');
    })
  }catch(err) {
    alert("Something went wrong :(");
    console.error(err);
  }

  removePaperStyles();

  if(isMobile) {
    smoothlyScrollTo('#output');
  }
}

document.querySelector("#note").addEventListener('paste', (event) => {
  if(!event.clipboardData.types.includes('Files')) {
    event.preventDefault();
    var text = event.clipboardData.getData("text/plain");
    document.execCommand("insertHTML", false, text);
  }
})

document.querySelector('select#handwriting-font').addEventListener('change', e => {
  textareaEl.style.fontFamily = e.target.value;
  if (e.target.value == "'Homemade Apple', cursive") {
    document.getElementById("top-padding").value = 9;
    textareaEl.style.paddingTop = 9;
  }
  if (e.target.value == "'Caveat', cursive") {
    document.getElementById("top-padding").value = 7;
    textareaEl.style.paddingTop = 7;
  }
  if (e.target.value == "'Liu Jian Mao Cao', cursive") {
    document.getElementById("top-padding").value = 6;
    textareaEl.style.paddingTop = 6;
  }
})

document.querySelector('select#ink-color').addEventListener('change', e => {
  textareaEl.style.color = e.target.value;
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
  if(document.getElementById("paper-margin-toggle").checked == true) {
    document.getElementById("margin-style").disabled = false;
    if(document.getElementById("margin-style").value == "double") {
      document.querySelector('.page').classList.remove('margined-page-solid');
      document.querySelector('.page').classList.add('margined-page');
    }
    if(document.getElementById("margin-style").value == "solid") {
      document.querySelector('.page').classList.add('margined-page-solid');
    }
  }
  if(document.getElementById("paper-margin-toggle").checked == false) {
    document.getElementById("margin-style").disabled = true;
    document.querySelector('.page').classList.remove('margined-page');
    document.querySelector('.page').classList.remove('margined-page-solid');
  }
})

document.querySelector('#margin-style').addEventListener('change', e => {
  if(document.getElementById("margin-style").disabled == false) {
    if(document.getElementById("margin-style").value == "double") {
      document.querySelector('.page').classList.remove('margined-page-solid');
      document.querySelector('.page').classList.add('margined-page');
    }
    if(document.getElementById("margin-style").value == "solid") {
      document.querySelector('.page').classList.add('margined-page-solid');
    }
  }
})

document.querySelector('#year').innerHTML = new Date().getFullYear();

document.querySelector('.generate-image').addEventListener('click', generateImage)

function smoothlyScrollTo(hashval) {
  let target = document.querySelector(hashval)
  target.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  })
  history.pushState(null, null, hashval)
}

const anchorlinks = document.querySelectorAll('a[href^="#"]');

for (let item of anchorlinks) { // relitere 
  item.addEventListener('click', (e)=> {
    let hashval = item.getAttribute('href')
    smoothlyScrollTo(hashval);
    e.preventDefault()
  })
}