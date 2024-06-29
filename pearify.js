const imagesPath = "images/";
var useAlternativeImages;
var flipBlacklist;
var blacklistStatus;
var highestImageIndex;
var isTropassMode = false;

// Config
var extensionIsDisabled = false;
var appearChance = 1.00; // %
var flipChance = 0.25; // %

// Apply the overlay
function applyOverlay(thumbnailElement, overlayImageURL, flip = false) {
    const overlayImage = document.createElement("img");
    overlayImage.src = overlayImageURL;
    overlayImage.style.position = "absolute";
    overlayImage.style.top = overlayImage.style.left = "50%";
    overlayImage.style.width = "100%";
    overlayImage.style.transform = `translate(-50%, -50%) ${flip ? 'scaleX(-1)' : ''}`;
    overlayImage.style.zIndex = "0";
    thumbnailElement.parentElement.insertBefore(overlayImage, thumbnailElement.nextSibling);
}

function findThumbnails() {
    var thumbnailImages = document.querySelectorAll("ytd-thumbnail:not(.ytd-video-preview, .ytd-rich-grid-slim-media) a > yt-image > img.yt-core-image:only-child:not(.yt-core-attributed-string__image-element)");
    var notificationImages = document.querySelectorAll('img.style-scope.yt-img-shadow[width="86"]');

    const allImages = [
        ...Array.from(thumbnailImages),
        ...Array.from(notificationImages),
    ];

    const targetAspectRatio = [16 / 9, 4 / 3];
    const errorMargin = 0.02;

    var listAllThumbnails = allImages.filter(image => {
        if (image.height === 0) return false;

        const aspectRatio = image.width / image.height;
        let isCorrectAspectRatio = (Math.abs(aspectRatio - targetAspectRatio[0]) < errorMargin) || (Math.abs(aspectRatio - targetAspectRatio[1]) < errorMargin);
        return isCorrectAspectRatio;
    });

    var videowallImages = document.querySelectorAll(".ytp-videowall-still-image:not([style*='extension:'])");

    listAllThumbnails = listAllThumbnails.concat(Array.from(videowallImages));

    return listAllThumbnails.filter(image => {
        const parent = image.parentElement;
        const isVideoPreview = parent.closest("#video-preview") !== null || parent.tagName == "YTD-MOVING-THUMBNAIL-RENDERER";
        const isChapter = parent.closest("#endpoint") !== null;

        const processed = Array.from(parent.children).filter(child => {
            return child.src && child.src.includes("extension") || isVideoPreview || isChapter;
        });

        return processed.length == 0;
    });
}

function applyOverlayToThumbnails() {
    let thumbnailElements = findThumbnails();

    thumbnailElements.forEach(thumbnailElement => {
        const loops = Math.random() > 0.001 ? 1 : 20;

        for (let i = 0; i < loops; i++) {
            let flip = Math.random() < flipChance;
            let baseImagePath;
            
            if (isTropassMode) {
                // Randomly choose between the two PNGs
                baseImagePath = Math.random() < 0.5 ? "devious/9.png" : "devious/10.png";
            } else {
                baseImagePath = getRandomImageFromDirectory();
            }

            if (flip && flipBlacklist && flipBlacklist.includes(baseImagePath)) {
                if (useAlternativeImages) {
                    baseImagePath = `textFlipped/${baseImagePath}`;
                }
                flip = false;
            }

            const overlayImageURL = Math.random() < appearChance ? getImageURL(baseImagePath) : "";

            applyOverlay(thumbnailElement, overlayImageURL, flip);
        }
    });
}

function getImageURL(index) {
    return browser.runtime.getURL(`${imagesPath}${index}.png`);
}

async function checkImageExistence(index) {
    const testedURL = getImageURL(index);

    return fetch(testedURL)
        .then(() => true)
        .catch(() => false);
}

const size_of_non_repeat = 8;
const last_indexes = Array(size_of_non_repeat);

function getRandomImageFromDirectory() {
    let randomIndex = -1;

    while (last_indexes.includes(randomIndex) || randomIndex < 0) {
        randomIndex = Math.floor(Math.random() * highestImageIndex) + 1;
    }

    last_indexes.shift();
    last_indexes.push(randomIndex);

    return randomIndex;
}

async function getHighestImageIndex() {
    let i = 4;

    while (await checkImageExistence(i)) {
        i *= 2;
    }

    let min = i <= 4 ? 1 : i / 2;
    let max = i;

    while (min <= max) {
        let mid = Math.floor((min + max) / 2);

        if (await checkImageExistence(mid)) {
            min = mid + 1;
        } else {
            max = mid - 1;
        }
    }

    highestImageIndex = max;
}

function getFlipBlocklist() {
    fetch(browser.runtime.getURL(`${imagesPath}flip_blacklist.json`))
        .then(response => response.json())
        .then(data => {
            useAlternativeImages = data.useAlternativeImages;
            flipBlacklist = data.blacklistedImages;

            blacklistStatus = "Flip blacklist found. " + (useAlternativeImages ? "Images will be substituted." : "Images won't be flipped.");
        })
        .catch(() => {
            blacklistStatus = "No flip blacklist found. Proceeding without it.";
        });
}

async function loadConfig() {
    const df = {
        extensionIsDisabled: extensionIsDisabled,
        appearChance: appearChance,
        flipChance: flipChance
    };

    try {
        const config = await new Promise((resolve, reject) => {
            browser.storage.local.get({
                extensionIsDisabled,
                appearChance,
                flipChance,
                isTropassMode
            }, result => {
                browser.runtime.lastError ? reject(browser.runtime.lastError) : resolve(result);
            });
        });

        extensionIsDisabled = config.extensionIsDisabled || df.extensionIsDisabled;
        appearChance = config.appearChance || df.appearChance;
        flipChance = config.flipChance || df.flipChance;
        isTropassMode = config.isTropassMode || df.isTropassMode;

        if (Object.keys(config).length === 0 && config.constructor === Object) {
            await new Promise((resolve, reject) => {
                browser.storage.local.set(df, () => {
                    browser.runtime.lastError ? reject(browser.runtime.lastError) : resolve();
                });
            });
        }
    } catch (error) {
        console.error("Error loading configuration:", error);
    }
}

async function main() {
    await loadConfig();

    if (!extensionIsDisabled) {
        const logoElement = document.querySelector('#logo-icon.ytd-logo');

        if (logoElement) {
            const logoParent = logoElement.parentElement;

            if (logoParent) {
                logoParent.removeChild(logoElement);

                const newLogo = document.createElement('img');
                newLogo.src = browser.runtime.getURL('logo/peartube-white.png');
                newLogo.alt = 'PearTube';
                newLogo.style.width = '18%'; // Adjusted width
                newLogo.style.left = '10px';
                newLogo.style.position = 'relative';
                newLogo.style.top = '5px';

                logoParent.appendChild(newLogo);
            } else {
                console.error('Parent element not found for the logo.');
            }
        } else {
            console.error('Logo element not found.');
        }

        getFlipBlocklist();
        getHighestImageIndex().then(() => {
            setInterval(applyOverlayToThumbnails, 100);
            console.log("Pearify Loaded Successfully, " + highestImageIndex + " images detected. " + blacklistStatus);
        });
    } else {
        console.log("Pearify is disabled.");
    }
}

main();