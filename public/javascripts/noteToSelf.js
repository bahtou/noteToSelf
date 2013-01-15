// DON'T use "var indexedDB = ..." if you're not in a function.
window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

// References to some window.IDB* objects
window.IDBTransaction = window.IDBTransaction || window.webkiteIDBTransaction || window.msIDBTransaction;
window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

if (!window.indexedDB) {
  window.alert("Your browser doesn't support a stable version of IndexedDB.  Such and such feature will not be available");
}

// ---- GLOBAL ----
var db;
// ----------------

window.onload = init;

function init() {
  var button = document.getElementById("add_button");
  document.getElementById("note_text").focus();
  openDB();
  button.onclick = createSticky;
}

// OPEN the database
function openDB() {
  var request = indexedDB.open("noteToSelf", 1);
  console.log("request", request);

  request.onerror = function(event) {
    console.error("something went wrong on OPEN", event);
  };

  request.onsuccess = function(event) {
    db = event.target.result;
    console.log("openDB:", db);


    // START chrome (obsolete - will be removed -- http://pastebin.com/nnrNkk8T)
    if (typeof db.setVersion === 'function') {
            console.log("for chrome");
            var versionReq = db.setVersion(1);
            versionReq.onsuccess = function (e) {
                    console.log('versionReq', e);

                    indexedDB.db = e.target.source; // instead of result
                    var db = indexedDB.db;
                    console.log('chromeDB', db);

                    if(!db.objectStoreNames.contains("noteToSelf")){
                            db.createObjectStore('noteToSelf', {keyPath: 'timeStamp', autoIncrement: true});
                    }
            };
    }
    // END chrome

    // ADD notes to the DOM
    getStickies();
  };

  request.onupgradeneeded = function(event) {
    console.log("upgrade", event);

    db = event.target.result;
    console.log("db", db);

    if (!db.objectStoreNames.contains("noteToSelf")) {
      var objectStore = db.createObjectStore("noteToSelf", {keyPath: "timeStamp", autoIncrement: true});

      // for (var i in notePad) {
      //   objectStore.add(notePad[i]);
      // }
    }
  };
} //END openDB

// READ/GET stickies
function getStickies() {
  console.log("getting stickies from db");
  var todos, transaction, objectStore, keyRange, cursorRequest;

  transaction = db.transaction("noteToSelf", "readonly");
  objectStore = transaction.objectStore("noteToSelf");
  keyRange = IDBKeyRange.lowerBound(0);
  cursorRequest = objectStore.openCursor(keyRange);

  cursorRequest.onsuccess = function(event) {
    var result = event.target.result;

    if (!!result === false)
      return;

    // console.log("result:", result.value);
    addStickyToDOM(result.value);
    result.continue();
  };
  cursorRequest.onerror = function(event) {
    console.error("get stickies error:", event.target.errorCode);
  };
} //END getStickies

// CREATE sticky
function createSticky() {
  var transaction, objectStore, request, colorSelectObj, index, color, text, stickyObj;
  console.log("creating sticky");

  // get sticky information
  colorSelectObj = document.getElementById("note_color");
  index = colorSelectObj.selectedIndex;
  color = colorSelectObj[index].value;
  text = document.getElementById("note_text").value;
  stickyObj = {
    "note": text,
    "timeStamp": new Date().getTime(),
    "color": color
  };

  transaction = db.transaction("noteToSelf", "readwrite");
  objectStore = transaction.objectStore("noteToSelf");
  request = objectStore.add(stickyObj);

  request.onsuccess = function(event) {
    console.log("sicky created!", event);
    addStickyToDOM(stickyObj);
    var text = document.getElementById("note_text");
    text.value = "";
    text.focus();
  };

  request.onerror = function(event) {
    console.error("create sticky error:", event.target.errorCode);
  };
} //END createSticky

// ADD sticky to DOM
function addStickyToDOM(value) {
  var stickies, sticky, span;

  stickies = document.getElementById("stickies");
  sticky = document.createElement("li");
  span = document.createElement("span");

  sticky.setAttribute("id", value.timeStamp);
  sticky.style.backgroundColor = value.color;
  span.setAttribute("class", "sticky");
  span.innerHTML = value.note;

  sticky.appendChild(span);
  stickies.appendChild(sticky);
  sticky.onclick = deleteSticky;
} //END addStickyToDOM

// DELETE sticky
function deleteSticky(event) {
  var key, transaction, objectStore, request;

  key = event.target.id;
  // If the span element is clicked then key is...
  if (event.target.tagName.toLowerCase() == "span") {
    key = event.target.parentNode.id;
  }

  transaction = db.transaction("noteToSelf", "readwrite");
  objectStore = transaction.objectStore("noteToSelf");
  request = objectStore.delete(+key);
  request.onsuccess = function(event) {
    console.log("note removed from DB!", key);
    removeStickyFromDOM(key);
  };
} //END deleteSticky

// REMOVE sticky from DOM
function removeStickyFromDOM(key) {
  var sticky = document.getElementById(key);
  sticky.parentNode.removeChild(sticky);
  console.log("note removed from DOM!");
} //END removeStickyFromDOM
