const { withAndroidManifest } = require("expo/config-plugins");

function ensurePermission(manifest, name, extra = {}) {
  const permissions = manifest.manifest["uses-permission"] ?? [];
  const alreadyDeclared = permissions.some(
    (permission) => permission.$?.["android:name"] === name,
  );

  if (!alreadyDeclared) {
    permissions.push({
      $: {
        "android:name": name,
        ...extra,
      },
    });
  }

  manifest.manifest["uses-permission"] = permissions;
}

module.exports = function withBuds2Bluetooth(config) {
  return withAndroidManifest(config, (configWithManifest) => {
    const manifest = configWithManifest.modResults;

    ensurePermission(manifest, "android.permission.BLUETOOTH", {
      "android:maxSdkVersion": "30",
    });
    ensurePermission(manifest, "android.permission.BLUETOOTH_ADMIN", {
      "android:maxSdkVersion": "30",
    });
    ensurePermission(manifest, "android.permission.BLUETOOTH_SCAN", {
      "android:usesPermissionFlags": "neverForLocation",
    });
    ensurePermission(manifest, "android.permission.BLUETOOTH_CONNECT");

    return configWithManifest;
  });
};
