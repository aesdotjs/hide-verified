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
        }
      } else { // QRT
        //find the pattern @...</span> in the tweetElement innerHTML to extract the username
        let usernamePattern = /@([^<]*)<\/span>/;
        let usernameMatch = usernamePattern.exec(tweetElement.innerHTML);
        if (usernameMatch) {
          username = usernameMatch[1];
        }
      }
      if(whitelist[username]) {
        // If the user is in the whitelist, skip hiding the tweet
        return;
      }
      const tweetText = tweetElement.querySelector('[data-testid="tweetText"]');
      if (!tweetText) return;
      const tweetContainer = tweetText.parentNode;
      if (tweetContainer) {
        if (tweetContainer.dataset.unblur || tweetContainer.dataset.blurred) {
          return;
        }
        // Create a blur mask for the tweet
        let blurMask = document.createElement("div");
        tweetContainer.dataset.blurred = true;
        function unblur() {
          blurMask.style.display = 'none';
          tweetContainer.dataset.unblur = true;
          tweetContainer.style.filter = "none";
          if (tweetContainer.nextSibling) tweetContainer.nextSibling.style.filter = "none";
          if (tweetContainer.parentNode.nextSibling) tweetContainer.parentNode.nextSibling.style.filter = "none";
        }
        // blurMask.innerHTML = "Cliquez pour afficher le tweet";
        // instead I want a div with the text and a div with a button to toggle the user in the whitelist
        // append the divs to the blurMask
        let blurMaskText = document.createElement("div");
        blurMaskText.innerHTML = "Click to show";
        blurMaskText.style.textShadow = "-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white";
        let blurMaskButton = document.createElement("div");
        blurMaskButton.innerHTML = "Add to whitelist";
        blurMaskButton.style.padding = "0.75rem 1.5rem";
        blurMaskButton.style.borderRadius = "999px";
        blurMaskButton.style.backgroundColor = "rgb(29, 155, 240)";
        blurMaskButton.style.color = "white";
        blurMaskButton.style.cursor = "pointer";
        blurMaskButton.onclick = function(e) {
          e.preventDefault();
          e.stopPropagation();
          toggleWhitelistUser(username);
          unblur();
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
        // blur filter
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
          unblur();
        };
        
        // Append the mask to the tweet text
        tweetContainer.parentNode.style.position = "relative";
        tweetContainer.parentNode.appendChild(blurMask);
      }
    }
  });
}