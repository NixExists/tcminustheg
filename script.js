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

const submissionForm = document.getElementById("card-submission-form");

const submissionName = document.getElementById("submission-name");
const submissionDescription = document.getElementById("submission-description");
const submissionRarity = document.getElementById("submission-rarity");
const submissionCollection = document.getElementById("submission-collection");
const submissionImage = document.getElementById("submission-image");

const submissionMessage = document.getElementById("submission-message");

const passwordReset =
    document.getElementById("password-reset");

const newPassword =
    document.getElementById("new-password");

const resetMessage =
    document.getElementById("reset-message");

async function setNewPassword() {

    const password = newPassword.value;

    if (!password) {
        resetMessage.textContent =
            "Enter a new password.";
        return;
    }

    const { error } = await db.auth.updateUser({
        password: password
    });

    if (error) {
        console.error("Password update error:", error);
        resetMessage.textContent = error.message;
        return;
    }

    resetMessage.textContent =
        "Password updated successfully.";

    newPassword.value = "";
}

db.auth.onAuthStateChange(function(event, session) {

    updateAuthUI(session ? session.user : null);

    if (event === "PASSWORD_RECOVERY") {
        passwordReset.style.display = "block";
    } else {
        passwordReset.style.display = "none";
    }

    if (session) {
        checkAdmin(session.user);
    } else {
        adminModeration.style.display = "none";
    }
});

submissionForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    submissionMessage.textContent = "";

    const name = submissionName.value.trim();
    const description = submissionDescription.value.trim();
    const rarity = submissionRarity.value;
    const collection = submissionCollection.value.trim();
    const image = submissionImage.files[0];

    if (!name || !description || !rarity || !collection || !image) {
        submissionMessage.textContent = "Please fill out every field.";
        return;
    }

    const maxFileSize = 50 * 1024;

    if (image.size > maxFileSize) {
        submissionMessage.textContent =
            "The image must be 50 KB or smaller.";
        return;
    }

    const allowedTypes = [
        "image/png",
        "image/jpeg",
        "image/webp"
    ];

    if (!allowedTypes.includes(image.type)) {
        submissionMessage.textContent =
            "Please upload a PNG, JPEG, or WebP image.";
        return;
    }

    const { data: userData, error: userError } =
        await db.auth.getUser();

    if (userError || !userData.user) {
        submissionMessage.textContent =
            "You must be logged in to submit a card.";
        return;
    }

    const userId = userData.user.id;

    const fileExtension =
        image.name.split(".").pop().toLowerCase();

    const filePath =
        `${userId}/${crypto.randomUUID()}.${fileExtension}`;

    const { error: uploadError } =
        await db.storage
            .from("card-submissions")
            .upload(filePath, image);

    if (uploadError) {
        console.error("Image upload error:", uploadError);

        submissionMessage.textContent =
            uploadError.message;

        return;
    }

    const { data, error } = await db.rpc("submit_card", {
        p_name: name,
        p_description: description,
        p_rarity: rarity,
        p_collection_name: collection,
        p_image_url: filePath
    });

    if (error) {
        console.error("Submission error:", error);

        // Remove the uploaded image if the submission failed
        await db.storage
            .from("card-submissions")
            .remove([filePath]);

        submissionMessage.textContent =
            error.message;

        return;
    }

    console.log("Submission created:", data);

    submissionMessage.textContent =
        "Card submitted successfully! It is now awaiting approval.";

    submissionForm.reset();

    if (error) {
        console.error("Submission error:", error);
        submissionMessage.textContent = error.message;
        return;
    }

    console.log("Submission created:", data);

    submissionMessage.textContent =
        "Card submitted successfully! It is now awaiting approval.";

    submissionForm.reset();
});

const adminModeration = document.getElementById("admin-moderation");
const pendingSubmissions =
    document.getElementById("pending-submissions");
const moderationMessage =
    document.getElementById("moderation-message");

async function loadModerationPage() {

    const { data, error } =
        await db.rpc("get_pending_submissions");

    if (error) {
        console.error("Moderation error:", error);
        adminModeration.style.display = "none";
        return;
    }

    adminModeration.style.display = "block";
    pendingSubmissions.innerHTML = "";

    if (data.length === 0) {
        pendingSubmissions.textContent =
            "There are no pending submissions.";
        return;
    }

    for (const submission of data) {

        /*
         * Find the rarity information.
         */
        const rarity =
            rarities.find(r => r.name === submission.rarity);

        if (!rarity) {
            console.error(
                "Unknown rarity:",
                submission.rarity
            );
            continue;
        }


        /*
         * Submission wrapper
         */
        const submissionWrapper =
            document.createElement("div");

        submissionWrapper.classList.add(
            "submission-wrapper"
        );


        /*
         * Submitter information
         */
        const submitter =
            document.createElement("p");

        submitter.textContent =
            `Submitted by: ${submission.submitter_username}`;

        submitter.classList.add(
            "submission-submitter"
        );

        submissionWrapper.appendChild(submitter);


        /*
         * Actual card preview
         */
        const card =
            document.createElement("div");

        card.classList.add("card");
        card.classList.add("submission-preview");

        card.style.setProperty(
            "--rarity-color",
            rarity.color
        );

        card.style.setProperty(
            "--rarity-secondary",
            rarity.colorSecondary
        );


        /*
         * Card name
         */
        const name =
            document.createElement("div");

        name.classList.add("card-name");

        name.textContent =
            submission.name;


        /*
         * Image
         */
        const image =
            document.createElement("div");

        image.classList.add("card-image");


        if (submission.image_url) {

            const { data: imageData, error: imageError } =
                await db.storage
                    .from("card-submissions")
                    .createSignedUrl(
                        submission.image_url,
                        60 * 60
                    );

            if (imageError) {

                console.error(
                    "Image URL error:",
                    imageError
                );

                image.textContent =
                    "Unable to load image.";

            } else {

                const imageElement =
                    document.createElement("img");

                imageElement.src =
                    imageData.signedUrl;

                imageElement.alt =
                    submission.name;

                image.appendChild(
                    imageElement
                );
            }

        } else {

            image.textContent =
                "No image submitted.";

        }


        /*
         * Description area
         */
        const descriptionBox =
            document.createElement("div");

        descriptionBox.classList.add(
            "card-description"
        );


        const description =
            document.createElement("div");

        description.classList.add(
            "description-text"
        );

        description.textContent =
            submission.description;


        /*
         * Card information
         */
        const cardInfo =
            document.createElement("div");

        cardInfo.classList.add(
            "card-info"
        );


        const rarityText =
            document.createElement("span");

        rarityText.textContent =
            submission.rarity;


        const collection =
            document.createElement("span");

        collection.textContent =
            submission.collection_name;


        cardInfo.appendChild(
            rarityText
        );

        cardInfo.appendChild(
            collection
        );


        descriptionBox.appendChild(
            description
        );

        descriptionBox.appendChild(
            cardInfo
        );


        /*
         * Assemble card
         */
        card.appendChild(name);
        card.appendChild(image);
        card.appendChild(descriptionBox);


        /*
         * Moderation buttons
         */
        const controls =
            document.createElement("div");

        controls.classList.add(
            "submission-controls"
        );


        const approveButton =
            document.createElement("button");

        approveButton.textContent =
            "Accept";

        approveButton.addEventListener("click", async function() {

            approveButton.disabled = true;
            rejectButton.disabled = true;

            moderationMessage.textContent =
                "Approving submission...";


            /*
             * Get a temporary URL for the private image.
             */
            const { data: signedData, error: signedError } =
                await db.storage
                    .from("card-submissions")
                    .createSignedUrl(
                        submission.image_url,
                        60 * 5
                    );

            if (signedError) {

                console.error(
                    "Could not access submission image:",
                    signedError
                );

                moderationMessage.textContent =
                    "Could not access the submission image.";

                approveButton.disabled = false;
                rejectButton.disabled = false;

                return;
            }


            /*
             * Download the image from the private bucket.
             */
            const imageResponse =
                await fetch(signedData.signedUrl);

            if (!imageResponse.ok) {

                moderationMessage.textContent =
                    "Could not download the submission image.";

                approveButton.disabled = false;
                rejectButton.disabled = false;

                return;
            }


            const imageBlob =
                await imageResponse.blob();


            /*
             * Give the approved image a permanent path
             * in the public card-images bucket.
             */
            const extension =
                submission.image_url
                    .split(".")
                    .pop()
                    .toLowerCase();

            const newImagePath =
                `${crypto.randomUUID()}.${extension}`;


            const { error: uploadError } =
                await db.storage
                    .from("card-images")
                    .upload(
                        newImagePath,
                        imageBlob,
                        {
                            contentType: imageBlob.type,
                            upsert: false
                        }
                    );


            if (uploadError) {

                console.error(
                    "Approved image upload error:",
                    uploadError
                );

                moderationMessage.textContent =
                    "Could not move the image to the card image storage.";

                approveButton.disabled = false;
                rejectButton.disabled = false;

                return;
            }


            /*
             * Get the public URL of the approved image.
             */
            const { data: publicUrlData } =
                db.storage
                    .from("card-images")
                    .getPublicUrl(newImagePath);

            const publicImageUrl =
                publicUrlData.publicUrl;


            /*
             * Create the official card.
             */
            const { data, error } =
                await db.rpc(
                    "approve_card_submission",
                    {
                        p_submission_id: submission.id,
                        p_image_url: publicImageUrl
                    }
                );


            if (error) {

                console.error(
                    "Approval error:",
                    error
                );

                /*
                 * The card wasn't created, so clean up
                 * the newly uploaded public image.
                 */
                await db.storage
                    .from("card-images")
                    .remove([newImagePath]);

                moderationMessage.textContent =
                    error.message;

                approveButton.disabled = false;
                rejectButton.disabled = false;

                return;
            }


            console.log(
                "Submission approved:",
                data
            );

            // Delete the original private submission image
            if (submission.image_url) {
                const { error: imageDeleteError } =
                    await db.storage
                        .from("card-submissions")
                        .remove([submission.image_url]);

                if (imageDeleteError) {
                    console.error(
                        "Original submission image deletion error:",
                        imageDeleteError
                    );

                    moderationMessage.textContent =
                        "Card approved, but the original submission image could not be deleted.";

                    await loadModerationPage();
                    return;
                }
            }

// Delete the approved submission record
            const { error: deleteError } =
                await db.rpc(
                    "delete_processed_card_submission",
                    {
                        p_submission_id: submission.id
                    }
                );

            if (deleteError) {
                console.error(
                    "Approved submission deletion error:",
                    deleteError
                );

                moderationMessage.textContent =
                    "Card approved and original image deleted, but the submission record could not be deleted.";

                await loadModerationPage();
                return;
            }
            moderationMessage.textContent =
                "Card approved successfully!";

            await loadModerationPage();
        });

        const rejectButton =
            document.createElement("button");

        rejectButton.textContent =
            "Reject";

        rejectButton.addEventListener("click", async function() {
            rejectButton.disabled = true;
            approveButton.disabled = true;

            moderationMessage.textContent = "Rejecting submission...";

            // First mark it as rejected
            const { data, error } =
                await db.rpc("reject_card_submission", {
                    p_submission_id: submission.id
                });

            if (error) {
                console.error("Reject error:", error);
                moderationMessage.textContent = error.message;
                rejectButton.disabled = false;
                approveButton.disabled = false;
                return;
            }

            // Delete the private submission image
            if (submission.image_url) {
                const { error: imageError } =
                    await db.storage
                        .from("card-submissions")
                        .remove([submission.image_url]);

                if (imageError) {
                    console.error(
                        "Rejected image deletion error:",
                        imageError
                    );

                    moderationMessage.textContent =
                        "Submission rejected, but its image could not be deleted.";

                    await loadModerationPage();
                    return;
                }
            }

            // Delete the submission row
            const { error: deleteError } =
                await db.rpc(
                    "delete_processed_card_submission",
                    {
                        p_submission_id: submission.id
                    }
                );

            if (deleteError) {
                console.error(
                    "Rejected submission deletion error:",
                    deleteError
                );

                moderationMessage.textContent =
                    "Submission rejected and image deleted, but the submission record could not be deleted.";

                await loadModerationPage();
                return;
            }

            moderationMessage.textContent =
                "Submission rejected and removed.";

            await loadModerationPage();
        });

        controls.appendChild(
            approveButton
        );

        controls.appendChild(
            rejectButton
        );


        /*
         * Assemble submission
         */
        submissionWrapper.appendChild(
            card
        );

        submissionWrapper.appendChild(
            controls
        );

        pendingSubmissions.appendChild(
            submissionWrapper
        );
    }
}

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

async function checkAuth() {

    const { data, error } =
        await db.auth.getSession();

    if (error) {
        console.error("Auth error:", error);
        return;
    }

    const user = data.session
        ? data.session.user
        : null;

    updateAuthUI(user);

    if (user) {
        await checkAdmin(user);
    } else {
        adminModeration.style.display = "none";
    }
}

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

async function sendPasswordReset() {

    const email = emailInput.value.trim();

    if (!email) {
        authMessage.textContent =
            "Enter your email address first.";
        return;
    }

    console.log("Sending password recovery email...");

    const { error } = await db.auth.resetPasswordForEmail(
        email,
        {
            redirectTo: window.location.origin
        }
    );

    if (error) {
        console.error("Password reset error:", error);
        authMessage.textContent = error.message;
        return;
    }

    console.log("Password recovery email sent.");

    authMessage.textContent =
        "Password recovery email sent.";
}

async function checkAdmin(user) {

    adminModeration.style.display = "none";

    const { data: admin, error } =
        await db.rpc("is_admin");

    if (error) {
        console.error("Admin check error:", error);
        return;
    }

    console.log("User:", user.email);
    console.log("Is admin:", admin);

    if (admin === true) {
        await loadModerationPage();
    }
}

checkAuth();