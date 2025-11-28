document.addEventListener("DOMContentLoaded", () => {
  // --- CONFIG & STATE ---
  const allGifts = [
    { id: "main1", name: "Bean Bag Chair", type: "main", image: "images/bean-bag.jpg" },
    { id: "side1", name: "Mystery Box", type: "side", image: "images/deco-box.png" },
    { id: "side2", name: "Hoodie", type: "side", image: "images/hoodie.jpg" },
    { id: "side3", name: "Customised Tumbler", type: "side", image: "images/tumbler.jpg" },
    { id: "side4", name: "Perfume", type: "side", image: "images/perfume.jpg" }
    // { id: "jackpot1", name: "Jackpot!", type: "jackpot", image: "images/jackpot.jpg" }
  ];

  const cards = document.querySelectorAll(".scratch-card");
  const mainTitle = document.getElementById("main-title");

  // Modals
  const confirmationModal = document.getElementById("confirmation-modal");
  const btnYes = document.getElementById("modal-btn-yes");
  const btnNo = document.getElementById("modal-btn-no");
  const gameOverModal = document.getElementById("game-over-modal");
  const closeGameOverBtn = document.getElementById("close-game-over-btn");

  // Game Over Controls
  const revealAllBtn = document.getElementById("reveal-all-btn");
  const downloadBtn = document.getElementById("download-btn");
  const shareBtn = document.getElementById("share-btn");
  const certificate = document.getElementById("winnings-certificate");

  const selectionsAllowed = 3;
  let cardToScratch = null;
  let gameHasEnded = false;
  let wonGiftTypes = [];

  // --- GAME LIFECYCLE ---
  function startGame() {
    const savedState = localStorage.getItem("scratchGameState");
    if (savedState) {
      restoreGameState(JSON.parse(savedState));
    } else {
      initNewGame();
    }
  }

  function initNewGame() {
    const shuffledGifts = shuffle([...allGifts]);
    const cardStates = [];

    cards.forEach((card, index) => {
      const gift = shuffledGifts[index];
      const cardState = { ...gift, scratched: false, index };
      cardStates.push(cardState);
      applyCardState(card, cardState);
      card.addEventListener("click", handleCardSelection);
    });

    requestAnimationFrame(drawAllCanvases);
    localStorage.setItem("scratchGameState", JSON.stringify({ gifts: cardStates }));
  }

  function restoreGameState(savedState) {
    mainTitle.textContent = "Welcome Back!";
    gameHasEnded = true;

    savedState.gifts.forEach((cardState, index) => {
      if(cards[index]) {
        const card = cards[index];
        applyCardState(card, cardState);
        // Reveal all cards, but only highlight the ones that were scratched by the user
        card.classList.add("fully-scratched");
        if (cardState.scratched) {
          card.classList.add("is-scratched");
        }
      }
    });
    
    requestAnimationFrame(drawAllCanvases);
    document.body.classList.add("selection-done");
    populateCertificate();
    showGameOverModal(true);
  }

  // --- INITIALIZATION & DRAWING HELPERS ---
  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function applyCardState(card, cardState) {
    card.dataset.giftId = cardState.id;
    card.dataset.giftName = cardState.name;
    card.dataset.giftType = cardState.type;
    card.dataset.giftImage = cardState.image;
    if (cardState.index !== undefined) card.dataset.cardIndex = cardState.index;

    const prizeContent = card.querySelector(".prize-content");
    prizeContent.querySelector("img").src = cardState.image;
    prizeContent.querySelector("p").textContent = cardState.name;
  }

  function drawAllCanvases() {
      cards.forEach(card => {
        const prizeContent = card.querySelector('.prize-content');
        prizeContent.classList.remove("is-hidden");
        if (card.classList.contains('fully-scratched')) {
            const canvas = card.querySelector(".scratch-surface");
            if(canvas) canvas.style.opacity = 0;
        } else {
            const canvas = card.querySelector(".scratch-surface");
            if (canvas) {
                const ctx = canvas.getContext("2d");
                const width = card.clientWidth;
                const height = card.clientHeight;
                if (width > 0 && height > 0) {
                    canvas.width = width;
                    canvas.height = height;
                    drawScratchSurface(ctx, width, height);
                }
            }
        }
      });
  }

  function drawScratchSurface(ctx, width, height) {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate(Math.PI / 4);
    const diagonal = Math.sqrt(width * width + height * height);
    ctx.translate(-diagonal / 2, -diagonal / 2);
    const emojiSize = width / 9;
    const step = emojiSize * 2;
    ctx.font = `${emojiSize}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let y = step / 2; y < diagonal; y += step) {
      for (let x = step / 2; x < diagonal; x += step) {
        ctx.fillText("🎁", x, y);
      }
    }
    ctx.restore();
  }

  // --- EVENT HANDLING ---
  function handleCardSelection(e) {
    const selectedCard = e.currentTarget;
    if (selectedCard.classList.contains("is-scratched") || gameHasEnded) return;
    cardToScratch = selectedCard;
    confirmationModal.querySelector("#modal-text").textContent = `Are you sure you want to scratch this card? ${selectionsAllowed - wonGiftTypes.length} choice(s) remaining.`;
    confirmationModal.classList.add("visible");
  }

  btnYes.addEventListener("click", () => {
    if (!cardToScratch) return;
    confirmationModal.classList.remove("visible");

    // if (cardToScratch.dataset.giftType === 'jackpot') {
    //   const sideCard = findUnscratchedCardOfType('side');
    //   if (sideCard) swapCardData(cardToScratch, sideCard);
    // }
    
    const currentPickType = cardToScratch.dataset.giftType;
    const mainGiftsWon = wonGiftTypes.filter(t => t === 'main').length;

    if (mainGiftsWon === 1 && currentPickType === 'main') {
        const sideCard = findUnscratchedCardOfType('side');
        if (sideCard) swapCardData(cardToScratch, sideCard);
    }
    else if (wonGiftTypes.length === selectionsAllowed - 1 && mainGiftsWon === 0 && currentPickType !== 'main') {
        const mainCard = findUnscratchedCardOfType('main');
        if (mainCard) swapCardData(cardToScratch, mainCard);
    }
    
    wonGiftTypes.push(cardToScratch.dataset.giftType);
    cardToScratch.classList.add("is-scratched");
    cardToScratch.removeEventListener("click", handleCardSelection);

    if (wonGiftTypes.length < selectionsAllowed) {
      mainTitle.textContent = `Pick ${selectionsAllowed - wonGiftTypes.length} more card(s)...`;
    }

    setupScratching(cardToScratch);
  });

  btnNo.addEventListener("click", () => {
    confirmationModal.classList.remove("visible");
    cardToScratch = null;
  });

  closeGameOverBtn.addEventListener("click", () => gameOverModal.classList.remove("visible"));
  gameOverModal.addEventListener("click", (e) => {
    if (e.target === gameOverModal) gameOverModal.classList.remove("visible");
  });

  revealAllBtn.addEventListener("click", () => {
    cards.forEach((card) => {
      if (!card.classList.contains("is-scratched")) {
        card.classList.add("fully-scratched");
      }
    });
    revealAllBtn.style.display = "none";
  });

  downloadBtn.addEventListener("click", () => {
    html2canvas(certificate, { backgroundColor: null, useCORS: true }).then((canvas) => {
      const link = document.createElement("a");
      link.download = "my-winnings.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    });
  });

  shareBtn.addEventListener("click", async () => {
    if (navigator.share) {
      try {
        const canvas = await html2canvas(certificate, { backgroundColor: null, useCORS: true });
        canvas.toBlob(async (blob) => {
          const file = new File([blob], "my-winnings.png", { type: "image/png" });
          await navigator.share({
            title: "My Winnings!",
            text: "Check out the awesome gifts I won!",
            files: [file],
          });
        }, "image/png");
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      alert("Web Share API is not supported in your browser. Try downloading the image instead!");
    }
  });

  // --- CORE LOGIC & GAME STATE ---
  function findUnscratchedCardOfType(type) {
    return [...cards].find(c => !c.classList.contains("is-scratched") && c.dataset.giftType === type && c !== cardToScratch);
  }

  function swapCardData(cardA, cardB) {
    const tempDataset = { ...cardA.dataset };
    Object.assign(cardA.dataset, cardB.dataset);
    Object.assign(cardB.dataset, tempDataset);
    
    applyCardState(cardA, cardA.dataset);
    applyCardState(cardB, cardB.dataset);

    const canvasA = cardA.querySelector('.scratch-surface');
    if (canvasA) drawScratchSurface(canvasA.getContext('2d'), canvasA.width, canvasA.height);
    const canvasB = cardB.querySelector('.scratch-surface');
    if (canvasB) drawScratchSurface(canvasB.getContext('2d'), canvasB.width, canvasB.height);
  }

  function endGame() {
    if (gameHasEnded) return;
    gameHasEnded = true;

    document.body.classList.add("selection-done");
    mainTitle.textContent = "Here are your gifts!";
    saveFinalState();

    setTimeout(() => {
      populateCertificate();
      showGameOverModal();
    }, 5000);
  }

  function populateCertificate() {
    const wonGifts = [];
    cards.forEach((card) => {
      if (card.classList.contains("is-scratched")) {
        wonGifts.push({
          name: card.dataset.giftName,
          image: card.dataset.giftImage,
        });
      }
    });

    const container = certificate.querySelector(".won-gifts-container");
    container.innerHTML = "";
    wonGifts.forEach((gift) => {
      const giftEl = document.createElement("div");
      giftEl.classList.add("won-gift");
      giftEl.innerHTML = `<img src="${gift.image}" alt="${gift.name}"><p>${gift.name}</p>`;
      container.appendChild(giftEl);
    });
  }

  function showGameOverModal(isRestored = false) {
    gameOverModal.classList.add("visible");
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
      zIndex: 1001,
    });

    if (isRestored) {
      revealAllBtn.style.display = "none";
    }
    if (!navigator.share) {
      shareBtn.style.display = "none";
    }
  }

  function saveFinalState() {
    const finalState = { gifts: [] };
    cards.forEach((card) => {
      const cardState = {
        id: card.dataset.giftId,
        name: card.dataset.giftName,
        type: card.dataset.giftType,
        image: card.dataset.giftImage,
        index: card.dataset.cardIndex,
        scratched: card.classList.contains("is-scratched"),
      };
      finalState.gifts.push(cardState);
    });
    localStorage.setItem("scratchGameState", JSON.stringify(finalState));
  }

  function setupScratching(card) {
    const canvas = card.querySelector(".scratch-surface");
    const ctx = canvas.getContext("2d");
    ctx.globalCompositeOperation = "destination-out";
    let isDrawing = false;

    function scratch(x, y) {
      if (!isDrawing) return;
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2, true);
      ctx.fill();
      checkScratchedArea(card, canvas, ctx);
    }

    canvas.addEventListener("mousedown", (e) => {
      isDrawing = true;
      scratch(e.offsetX, e.offsetY);
    });
    canvas.addEventListener("mousemove", (e) => scratch(e.offsetX, e.offsetY));
    canvas.addEventListener("mouseup", () => (isDrawing = false));
    canvas.addEventListener("mouseleave", () => (isDrawing = false));
  }

  function checkScratchedArea(card, canvas, ctx) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparentPixels = 0;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) transparentPixels++;
    }
    if ((transparentPixels / (canvas.width * canvas.height)) * 100 > 50) {
      if (!card.classList.contains("fully-scratched")) {
        card.classList.add("fully-scratched");

        const fullyScratchedCount = document.querySelectorAll(".is-scratched.fully-scratched").length;
        if (fullyScratchedCount === selectionsAllowed) {
          endGame();
        }
      }
    }
  }

  startGame();
});