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

function hideVerifiedTweets() {
  // Find all verified icons
  const verifiedIcons = Array.from(document.querySelectorAll('[data-testid="icon-verified"]'));
  // For each verified icon, find the parent tweet and hide its text
  verifiedIcons.forEach(icon => {
    let tweetElement = icon;
    // Traverse up the DOM to find the parent tweet element stop if data-testid="tweet" or if the element is a div with role="link"
    while (tweetElement && tweetElement.dataset.testid !== "tweet" && !(tweetElement.role === "link" && tweetElement.nodeName === "DIV")) {
      tweetElement = tweetElement.parentElement;
    }
    // Hide the tweet text if it's a tweet from a verified user
    if (tweetElement) {
      let userNameElement;
      let username = null;
      if (tweetElement.dataset.testid === "tweet") {
        userNameElement = tweetElement.querySelector('[data-testid="User-Name"] a');
        if(userNameElement) {
          username = userNameElement.getAttribute('href').substring(1); // Remove the initial "/"
          if(whitelist[username]) {
            // If the user is in the whitelist, skip hiding the tweet
            return;
          }
        }
      } else { // QRT
        //find the pattern @...</span> in the tweetElement innerHTML to extract the username
        let usernamePattern = /@([^<]*)<\/span>/;
        let usernameMatch = usernamePattern.exec(tweetElement.innerHTML);
        if (usernameMatch) {
          username = usernameMatch[1];
          if(whitelist[username]) {
            // If the user is in the whitelist, skip hiding the tweet
            return;
          }
        }
      }
      const tweetText = tweetElement.querySelector('[data-testid="tweetText"]');
      if (tweetText) {
        if (tweetText.dataset.unblur || tweetText.dataset.blurred) {
          return;
        }
        // Create a blur mask for the tweet
        let blurMask = document.createElement("div");
        tweetText.dataset.blurred = true;
        // blurMask.innerHTML = "Cliquez pour afficher le tweet";
        // instead I want a div with the text and a div with a button to toggle the user in the whitelist
        // append the divs to the blurMask
        let blurMaskText = document.createElement("div");
        blurMaskText.innerHTML = "Cliquez pour afficher le tweet";
        let blurMaskButton = document.createElement("div");
        blurMaskButton.innerHTML = "Ajouter à la whitelist";
        blurMaskButton.style.padding = "5px";
        blurMaskButton.style.border = "1px solid black";
        blurMaskButton.style.borderRadius = "5px";
        blurMaskButton.style.cursor = "pointer";
        blurMaskButton.onclick = function(e) {
          e.preventDefault();
          e.stopPropagation();
          toggleWhitelistUser(username);
          blurMask.style.display = 'none';
          tweetText.dataset.unblur = true;
          tweetText.style.filter = "none";
        };
        blurMask.appendChild(blurMaskText);
        blurMask.appendChild(blurMaskButton);
        blurMask.style.position = "absolute";
        blurMask.style.textAlign = "center";
        blurMask.style.zIndex = "1000";
        blurMask.style.display = "flex";
        blurMask.style.gap = "10px";
        blurMask.style.fontWeight = "bold";
        blurMask.style.justifyContent = "center";
        blurMask.style.alignItems = "center";
        // blur filter
        tweetText.style.filter = "blur(10px)";
        blurMask.style.top = "0";
        blurMask.style.left = "0";
        blurMask.style.width = "100%";
        blurMask.style.height = "100%";
        blurMask.style.cursor = "pointer";
        blurMask.onclick = function(e) {
          e.preventDefault();
          e.stopPropagation();
          blurMask.style.display = 'none';
          tweetText.dataset.unblur = true;
          tweetText.style.filter = "none";
        };
        
        // Append the mask to the tweet text
        tweetText.parentNode.style.position = "relative";
        tweetText.parentNode.appendChild(blurMask);
      }
    }
  });
}