window.onload = function() {
  hideVerifiedTweets();

  // Handle dynamic loading of tweets
  setInterval(function() {
    hideVerifiedTweets();
  }, 1000);
};

let whitelist = {};

chrome.storage.sync.get(['whitelist'], function(result) {
  whitelist = result.whitelist || {};
});

function toggleWhitelistUser(username) {
  // If the user is already in the whitelist, remove them
  if (whitelist[username]) {
    delete whitelist[username];
  } else {
    // If the user is not in the whitelist, add them
    whitelist[username] = true;
  }

  // Update the whitelist in chrome.storage.sync
  chrome.storage.sync.set({whitelist: whitelist}, function() {
    // After the storage update has completed, reapply the tweet hiding
    hideVerifiedTweets();
  });
}

function unblur(tweetContainer, blurMask, existingMask) {
  blurMask.style.display = 'none';
  
  if (existingMask) {
    existingMask.style.display = 'none';
  }

  tweetContainer.dataset.unblur = true;
  tweetContainer.style.filter = "none";
  if (tweetContainer.nextSibling) tweetContainer.nextSibling.style.filter = "none";
  if (tweetContainer.parentNode.nextSibling) tweetContainer.parentNode.nextSibling.style.filter = "none";
}

function handleWhitelistedUser(username, tweetContainer, existingMask, blurMask) {
  if (whitelist[username]) {
    if (tweetContainer.dataset.blurred) {
      unblur(tweetContainer, blurMask, existingMask);
    }
    return true;
  } else {
    return false;
  }
}

function hideVerifiedTweets() {
  const verifiedIcons = Array.from(document.querySelectorAll('[data-testid="icon-verified"]'));

  verifiedIcons.forEach(icon => {
    let tweetElement = icon;
    let likeElement = null;

    while (tweetElement && tweetElement.dataset.testid !== "tweet" && !(tweetElement.role === "link" && tweetElement.nodeName === "DIV")) {
      tweetElement = tweetElement.parentElement;
    }

    if (tweetElement) {
      let userNameElement;
      let username = null;

      if (tweetElement.dataset.testid === "tweet") {
        userNameElement = tweetElement.querySelector('[data-testid="User-Name"] a');
        if(userNameElement) {
          username = userNameElement.getAttribute('href').substring(1);
        }
        likeElement = tweetElement.querySelector('[data-testid="like"]');
      } else {
        let usernamePattern = /@([^<]*)<\/span>/;
        let usernameMatch = usernamePattern.exec(tweetElement.innerHTML);
        if (usernameMatch) {
          username = usernameMatch[1];
        }
      }

      const tweetText = tweetElement.querySelector('[data-testid="tweetText"]');
      if (!tweetText) return;
      const tweetContainer = tweetText.parentNode;
      if (tweetContainer) {
        let existingMask = tweetContainer.parentNode.querySelector(".blur-mask");
        let blurMask = document.createElement("div");
        blurMask.classList.add("blur-mask");

        if(likeElement) {
          const parent = likeElement.parentNode;
          if(parent) {
            let existingButton = parent.parentNode.querySelector(".toggle-whitelist-user");
            if (existingButton) {
              existingButton.textContent = whitelist[username] ? "👁️" : "👓";
            } else {
              let toggleButton = document.createElement("div");
              toggleButton.classList.add("toggle-whitelist-user");
              toggleButton.style.display = "flex";
              toggleButton.style.alignItems = "center";
              toggleButton.style.userSelect = "none";
              toggleButton.style.cursor = "pointer";
              toggleButton.textContent = whitelist[username] ? "👁️" : "👓";

              toggleButton.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                tweetContainer.dataset.unblur = false;
                toggleWhitelistUser(username);
                toggleButton.textContent = whitelist[username] ? "👁️" : "👓";
              }
              parent.parentNode.insertBefore(toggleButton, likeElement.nextSibling);
            }
          }
        }

        if (handleWhitelistedUser(username, tweetContainer, existingMask, blurMask)) {
          return;
        }
        if(((tweetContainer.dataset.blurred || tweetContainer.dataset.blurred === 'true') && tweetContainer.style.filter === "blur(10px)") || (tweetContainer.dataset.unblur === true || tweetContainer.dataset.unblur === 'true')) {
          return;
        }
        tweetContainer.dataset.blurred = true;
        let blurMaskText = document.createElement("div");
        blurMaskText.textContent = "Click to show";
        blurMaskText.style.textShadow = "-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white";
        let blurMaskButton = document.createElement("div");
        blurMaskButton.textContent = "Add to whitelist";
        blurMaskButton.style.padding = "0.75rem 1.5rem";
        blurMaskButton.style.borderRadius = "999px";
        blurMaskButton.style.backgroundColor = "rgb(29, 155, 240)";
        blurMaskButton.style.color = "white";
        blurMaskButton.style.cursor = "pointer";
        blurMaskButton.onclick = function(e) {
          e.preventDefault();
          e.stopPropagation();
          toggleWhitelistUser(username);
          unblur(tweetContainer, blurMask, existingMask);
        };
        blurMask.appendChild(blurMaskText);
        blurMask.appendChild(blurMaskButton);
        blurMask.style.position = "absolute";
        blurMask.style.textAlign = "center";
        blurMask.style.zIndex = "1000";
        blurMask.style.display = "flex";
        blurMask.style.gap = "2rem";
        blurMask.style.fontWeight = "bold";
        blurMask.style.fontFamily = "'TwitterChirp',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
        blurMask.style.justifyContent = "center";
        blurMask.style.alignItems = "center";
        tweetContainer.style.filter = "blur(10px)";
        if (tweetContainer.nextSibling) tweetContainer.nextSibling.style.filter = "blur(10px)";
        if (tweetContainer.parentNode.nextSibling) tweetContainer.parentNode.nextSibling.style.filter = "blur(10px)";
        blurMask.style.top = "0";
        blurMask.style.left = "0";
        blurMask.style.width = "100%";
        blurMask.style.height = "100%";
        blurMask.style.cursor = "pointer";
        blurMask.onclick = function(e) {
          e.preventDefault();
          e.stopPropagation();
          unblur(tweetContainer, blurMask, existingMask);
        };

        if (existingMask) {
          existingMask.remove();
        }

        tweetContainer.parentNode.style.position = "relative";
        tweetContainer.parentNode.appendChild(blurMask);
      }
    }
  });
}
