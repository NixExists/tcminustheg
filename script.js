const rarities = [
    { name: "Common",
        weight: 100,
        color: "gray",
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

        const card = document.createElement("div");
        card.classList.add("card", "card-back");
        card.textContent = "TC";

        card.addEventListener("click", function() {
            card.classList.remove("card-back");
            card.textContent = randomCard;
            card.style.borderColor = rarity.color;
        });

        result.appendChild(card);
    }
});