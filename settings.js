var extensionIsDisabled;
var appearChance;
var flipChance;
var isTropassMode = false; // Initial state of TROPASS MODE

// Function to load settings from Firefox storage
function loadSettings() {
    browser.storage.local.get({
        extensionIsDisabled: false,
        appearChance: 1.00,
        flipChance: 0.25,
        isTropassMode: false // Include isTropassMode in storage retrieval
    }, function (data) {
        extensionIsDisabled = data.extensionIsDisabled;
        appearChance = data.appearChance;
        flipChance = data.flipChance;
        isTropassMode = data.isTropassMode; // Update isTropassMode from storage
        document.getElementById('disableExtension').checked = !extensionIsDisabled;
        document.getElementById('appearChance').value = appearChance * 100;
        document.getElementById('flipChance').value = flipChance * 100;
    });
}

// Function to save settings to Firefox storage
function saveSettings() {
    const data = {
        extensionIsDisabled: !document.getElementById('disableExtension').checked,
        appearChance: parseInt(document.getElementById('appearChance').value) / 100,
        flipChance: parseInt(document.getElementById('flipChance').value) / 100,
        isTropassMode: isTropassMode // Ensure isTropassMode is saved
    };

    browser.storage.local.set(data, () => {
        if (browser.runtime.lastError) {
            console.error("Error saving settings:", browser.runtime.lastError);
        } else {
            console.log("Settings saved successfully.");
        }
    });
}

// Function to toggle TROPASS MODE
function toggleTropassMode() {
    isTropassMode = !isTropassMode; // Toggle the mode

    browser.storage.local.set({ isTropassMode }, () => {
        if (browser.runtime.lastError) {
            console.error("Error saving TROPASS MODE:", browser.runtime.lastError);
        } else {
            console.log("TROPASS MODE toggled successfully:", isTropassMode);
            // Apply settings immediately after toggle
            applyOverlayToThumbnails();
        }
    });
}

// Function to apply overlay based on current settings
function applyOverlayToThumbnails() {
    // This function should contain your logic to apply overlays
    // Based on the current state of isTropassMode
    // Ensure to integrate with your existing code
    // Example:
    if (isTropassMode) {
        console.log("Applying TROPASS MODE overlay");
        // Apply TROPASS MODE specific overlay
    } else {
        console.log("Applying normal overlay");
        // Apply normal overlay
    }
}

// Function to change extension name in heading
function changeNameInHeading() {
    // Get the extension name
    let extensionName = browser.runtime.getManifest().name;

    // Remove "youtube" (case-insensitive) from the extension name and trim
    extensionName = extensionName.replace(/youtube/i, '').trim();

    // Replace "Pearify" in the title with the cleaned extension name
    const titleElement = document.getElementById('extension-title');
    titleElement.textContent = titleElement.textContent.replace('Pearify', extensionName);
}

// Add event listeners after DOM content is loaded
document.addEventListener('DOMContentLoaded', function () {
    loadSettings(); // Load settings from storage
    changeNameInHeading(); // Change extension name in heading
    
    // Add event listeners for settings inputs
    document.getElementById('disableExtension').addEventListener('input', saveSettings);
    document.getElementById('appearChance').addEventListener('input', saveSettings);
    document.getElementById('flipChance').addEventListener('input', saveSettings);
    
    // Add event listener for help button to toggle TROPASS MODE
    document.getElementById('help-button').addEventListener('click', toggleTropassMode);
});

// Initialize the application
function initializeApp() {
    // Additional initialization if needed
}

// Start the application
initializeApp();
