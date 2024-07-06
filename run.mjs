import webExt from 'web-ext';
import path from 'path';

async function deployExtension() {
    // Path to adb binary (optional parameter, auto-detected if missing)
    const adbBin = "C://Program Files//ADB//adb.exe";

    try {
        // Import adbUtils dynamically to avoid the previous import error
        const adbUtils = await import('web-ext/util/adb');

        // Get an array of device ids (Array<string>)
        const deviceIds = await adbUtils.listADBDevices(adbBin);
        if (deviceIds.length === 0) {
            console.log("No devices found");
            return;
        }
        const deviceId = deviceIds[0]; // Use the first connected device

        // Get an array of Firefox APKs (Array<string>)
        const firefoxAPKs = await adbUtils.listADBFirefoxAPKs(deviceId, adbBin);
        if (firefoxAPKs.length === 0) {
            console.log("No Firefox APKs found on the device");
            return;
        }
        const firefoxApk = firefoxAPKs[0]; // Use the first available Firefox APK

        const sourceDir = path.resolve('.'); // Assuming this script is in the extension root directory

        // Run web-ext with the target set to Firefox on Android
        webExt.cmd.run({
            target: 'firefox-android',
            firefoxApk,
            adbDevice: deviceId,
            sourceDir
        }).then((extensionRunner) => {
            console.log("Extension deployed successfully!");
        }).catch((error) => {
            console.error("Failed to deploy extension:", error);
        });
    } catch (error) {
        console.error("An error occurred:", error);
    }
}

deployExtension();
