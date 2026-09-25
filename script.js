const rarities = [
    { name: "Common",
        weight: 100,
        color: "gray",
        colorSecondary: "gray",
        cards: [
            "Potato",
            "Default",
            "Banana",
            "Anime"
        ]
    },
    { name: "Uncommon",
        weight: 50,
        color: "green",
        colorSecondary: "green",
        cards: [
            "Slime",
            "Squid",
            "Apple",
            "Juice"
        ]

    },
    { name: "Rare",
        weight: 25,
        color: "blue",
        colorSecondary: "blue",
        cards: [
            "Rocket",
            "Moon",
            "Wave",
            "Fog"
        ]
    },
    { name: "Ultra Rare",
        weight: 10,
        color: "purple",
        colorSecondary: "purple",
        cards: [
            "Lava",
            "Space",
            "Nya",
            "Relic"
        ]
    },
    { name: "Epic",
        weight: 5,
        color: "orange",
        colorSecondary: "orange",
        cards: [
            "Mace",
            "Creeper",
            "Alien",
            "TAW"
        ]
    },
    { name: "Legendary",
        weight: 0.5,
        color: "gold",
        colorSecondary: "gold",
        cards: [
            "Ocul Ovi",
            "Herta",
            "Tekkhu",
            "Gio"
        ]
    }
];

function chooseRarity() {
    const totalWeight = rarities.reduce((sum, rarity) => sum + rarity.weight, 0);
    let random = Math.random() * totalWeight;

    for (const rarity of rarities) {
        random -= rarity.weight;
        if (random < 0) {
            return rarity;
        }
    }
    return rarities[rarities.length - 1];
}

const button = document.getElementById("open-pack-button");
const result = document.getElementById("rarity-result");

button.addEventListener("click", function() {
    result.innerHTML = "";

    for (let i = 0; i < 5; i++) {
        const rarity = chooseRarity();
        const cardIndex = Math.floor(Math.random() * rarity.cards.length);
        const randomCard = rarity.cards[cardIndex];

        // Card
        const card = document.createElement("div");
        card.classList.add("card", "card-back");

        // Back of card
        card.textContent = "TC";

        // Reveal card when clicked
        card.addEventListener("click", function() {
            if (!card.classList.contains("card-back")) {
                return;
            }
            card.classList.add("card-flipping");
            setTimeout(function() {
                card.classList.remove("card-back");
                // Clear the "TC"
                card.innerHTML = "";

                // Card name
                const name = document.createElement("div");
                name.classList.add("card-name");
                name.textContent = randomCard;

                // Image placeholder
                const image = document.createElement("div");
                image.classList.add("card-image");
                image.textContent = "IMAGE";

                // Description area
                const descriptionBox = document.createElement("div");
                descriptionBox.classList.add("card-description");

                const description = document.createElement("div");
                description.classList.add("description-text");
                description.textContent = "Card description goes here.";

                // Bottom information
                const cardInfo = document.createElement("div");
                cardInfo.classList.add("card-info");

                const rarityText = document.createElement("span");
                rarityText.textContent = rarity.name;

                const collection = document.createElement("span");
                collection.textContent = "Collection #1";

                cardInfo.appendChild(rarityText);
                cardInfo.appendChild(collection);

                descriptionBox.appendChild(description);
                descriptionBox.appendChild(cardInfo);

                // Put everything into the card
                card.appendChild(name);
                card.appendChild(image);
                card.appendChild(descriptionBox);

                // Rarity colors
                card.style.setProperty("--rarity-color", rarity.color);
                card.style.setProperty("--rarity-secondary", rarity.colorSecondary);

                card.classList.remove("card-flipping");
            }, 300)
        });
        result.appendChild(card);
    }
});