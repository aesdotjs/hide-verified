window.onload = function() {
  hideVerifiedTweets();

  // Handle dynamic loading of tweets
  setInterval(function() {
    hideVerifiedTweets();
  }, 1000);
};

function hideVerifiedTweets() {
  // Find all verified icons
  const verifiedIcons = Array.from(document.querySelectorAll('[data-testid="icon-verified"]'));
  // For each verified icon, find the parent tweet and hide its text
  verifiedIcons.forEach(icon => {
    let tweetElement = icon;
    // Traverse up the DOM to find the parent tweet element
    while (tweetElement && (!tweetElement.dataset || tweetElement.dataset.testid !== "tweet")) {
      tweetElement = tweetElement.parentElement;
    }
    // Hide the tweet text if it's a tweet from a verified user
    if (tweetElement) {
      const tweetText = tweetElement.querySelector('[data-testid="tweetText"]');
      if (tweetText) {
        if (tweetText.dataset.unblur || tweetText.dataset.blurred) {
          return;
        }
        // Create a blur mask for the tweet
        let blurMask = document.createElement("div");
        tweetText.dataset.blurred = true;
        blurMask.innerHTML = "Cliquez pour afficher le tweet";
        blurMask.style.position = "absolute";
        blurMask.style.textAlign = "center";
        blurMask.style.zIndex = "1000";
        blurMask.style.display = "flex";
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