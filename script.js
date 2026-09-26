const DB_URL = "https://wuljxybhgrwwrfhpllkx.supabase.co";
const DB_KEY = "sb_publishable_uz9kBfHAR98yY26-HT7n0A_iX5RcUZu";

const db = window.supabase.createClient(
    DB_URL,
    DB_KEY
);
const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const signUpButton = document.getElementById("sign-up-button");
const loginButton = document.getElementById("login-button");
const logoutButton = document.getElementById("logout-button");

const authMessage = document.getElementById("auth-message");

const loggedOut = document.getElementById("logged-out");
const loggedIn = document.getElementById("logged-in");
const userEmail = document.getElementById("user-email");

signUpButton.addEventListener("click", async function() {
    const email = emailInput.value;
    const password = passwordInput.value;

    const { data, error } = await db.auth.signUp({
        email: email,
        password: password,

        options: {
            data: {
                username: usernameInput.value
            }
        }
    });

    if (error) {
        authMessage.textContent = error.message;
        return;
    }

    authMessage.textContent =
        "Account created! Check your email to verify your account.";
});

loginButton.addEventListener("click", async function() {
    const email = emailInput.value;
    const password = passwordInput.value;

    const { data, error } = await db.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        authMessage.textContent = error.message;
        return;
    }

    authMessage.textContent = "Logged in!";
});

logoutButton.addEventListener("click", async function() {
    const { error } = await db.auth.signOut();

    if (error) {
        console.error(error);
    }
});

function updateAuthUI(user) {
    if (user) {
        loggedOut.style.display = "none";
        loggedIn.style.display = "block";

        userEmail.textContent = user.email;
    } else {
        loggedOut.style.display = "block";
        loggedIn.style.display = "none";

        userEmail.textContent = "";
    }
}

db.auth.onAuthStateChange(function(event, session) {
    updateAuthUI(session ? session.user : null);
});

async function checkAuth() {
    const { data } = await db.auth.getSession();

    updateAuthUI(data.session ? data.session.user : null);
}

checkAuth();

const rarities = [
    { name: "Common",
        weight: 100,
        color: "gray",
        colorSecondary: "gray"
    },
    { name: "Uncommon",
        weight: 50,
        color: "green",
        colorSecondary: "green"
    },
    { name: "Rare",
        weight: 25,
        color: "blue",
        colorSecondary: "blue"
    },
    { name: "Ultra Rare",
        weight: 10,
        color: "purple",
        colorSecondary: "purple"
    },
    { name: "Epic",
        weight: 5,
        color: "orange",
        colorSecondary: "orange"
    },
    { name: "Legendary",
        weight: 0.5,
        color: "gold",
        colorSecondary: "gold"
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

button.addEventListener("click", async function() {
    result.innerHTML = "";

    for (let i = 0; i < 5; i++) {
        const rarity = chooseRarity();
        const randomCard = await getRandomCard(rarity.name);

        // Card
        const card = document.createElement("div");
        card.classList.add("card", "card-back");

        // Back of card
        card.textContent = "TC";

        // Reveal card when clicked
        card.addEventListener("click", async function() {
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
                name.textContent = randomCard.name;

                // Image placeholder
                const image = document.createElement("div");
                image.classList.add("card-image");
                const imageElement = document.createElement("img");
                imageElement.src = randomCard.image_url;
                imageElement.alt = randomCard.name;

                image.appendChild(imageElement);

                // Description area
                const descriptionBox = document.createElement("div");
                descriptionBox.classList.add("card-description");

                const description = document.createElement("div");
                description.classList.add("description-text");
                description.textContent = randomCard.description;

                // Bottom information
                const cardInfo = document.createElement("div");
                cardInfo.classList.add("card-info");

                const rarityText = document.createElement("span");
                rarityText.textContent = rarity.name;

                const collection = document.createElement("span");
                collection.textContent = randomCard.collections.name;

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
async function getRandomCard(rarityName) {
    const { data, error } = await db
        .from("cards")
        .select(`
        *,
        collections (
            name
        )
    `)
        .eq("rarity", rarityName);

    if (error) {
        console.error("Error getting cards:", error);
        return null;
    }

    if (data.length === 0) {
        console.error(`No cards found for rarity: ${rarityName}`);
        return null;
    }

    const randomIndex = Math.floor(Math.random() * data.length);

    return data[randomIndex];
}