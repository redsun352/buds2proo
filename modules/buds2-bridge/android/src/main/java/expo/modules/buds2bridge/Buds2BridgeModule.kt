package expo.modules.buds2bridge

import android.Manifest
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothProfile
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.concurrent.atomic.AtomicBoolean

class Buds2BridgeModule : Module() {
  private val mainHandler = Handler(Looper.getMainLooper())

  override fun definition() = ModuleDefinition {
    Name("Buds2Bridge")

    AsyncFunction("getBluetoothSnapshot") { promise: Promise ->
      val context = appContext.reactContext
      if (context == null) {
        promise.resolve(unavailableSnapshot("context_unavailable"))
        return@AsyncFunction
      }

      val bluetoothManager = context.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager
      val adapter = bluetoothManager?.adapter
      if (adapter == null) {
        promise.resolve(baseSnapshot(false, false, false, emptyList()))
        return@AsyncFunction
      }

      if (!hasConnectPermission(context)) {
        promise.resolve(baseSnapshot(true, false, false, emptyList(), "connect_permission_required"))
        return@AsyncFunction
      }

      if (!adapter.isEnabled) {
        promise.resolve(baseSnapshot(true, false, true, emptyList(), "bluetooth_disabled"))
        return@AsyncFunction
      }

      val bondedDevices = try {
        adapter.bondedDevices.orEmpty().toList()
      } catch (_: SecurityException) {
        emptyList()
      }

      resolveDevicesWithProfiles(context, adapter, bondedDevices, promise)
    }

    AsyncFunction("discoverBluetoothDevices") { promise: Promise ->
      val context = appContext.reactContext
      if (context == null) {
        promise.resolve(unavailableSnapshot("context_unavailable"))
        return@AsyncFunction
      }

      val bluetoothManager = context.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager
      val adapter = bluetoothManager?.adapter
      if (adapter == null) {
        promise.resolve(baseSnapshot(false, false, false, emptyList()))
        return@AsyncFunction
      }

      if (!hasConnectPermission(context) || !hasScanPermission(context)) {
        promise.resolve(baseSnapshot(true, adapter.isEnabled, false, emptyList(), "scan_permission_required"))
        return@AsyncFunction
      }

      if (!adapter.isEnabled) {
        promise.resolve(baseSnapshot(true, false, true, emptyList(), "bluetooth_disabled"))
        return@AsyncFunction
      }

      discoverNearbyDevices(context, adapter, promise)
    }

    Function("openBluetoothSettings") {
      val context = appContext.reactContext ?: return@Function false
      val intent = Intent(Settings.ACTION_BLUETOOTH_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
      true
    }
  }

  private fun hasConnectPermission(context: Context): Boolean {
    return Build.VERSION.SDK_INT < Build.VERSION_CODES.S ||
      context.checkSelfPermission(Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED
  }

  private fun hasScanPermission(context: Context): Boolean {
    return Build.VERSION.SDK_INT < Build.VERSION_CODES.S ||
      context.checkSelfPermission(Manifest.permission.BLUETOOTH_SCAN) == PackageManager.PERMISSION_GRANTED
  }

  private fun discoverNearbyDevices(context: Context, adapter: BluetoothAdapter, promise: Promise) {
    val completed = AtomicBoolean(false)
    val discoveredDevices = linkedMapOf<String, BluetoothDevice>()
    try {
      adapter.bondedDevices.orEmpty().forEach { device ->
        discoveredDevices[device.address] = device
      }
    } catch (_: SecurityException) {
      // Tarama yine de yeni cihazları ekleyebilir.
    }

    var receiver: BroadcastReceiver? = null
    fun finish(reason: String) {
      if (!completed.compareAndSet(false, true)) return
      receiver?.let {
        try {
          context.unregisterReceiver(it)
        } catch (_: IllegalArgumentException) {
          // Alıcı zaten kayıttan kaldırılmış olabilir.
        }
      }
      try {
        if (adapter.isDiscovering) adapter.cancelDiscovery()
      } catch (_: SecurityException) {
        // İzin, tarama boyunca sistem tarafından geri alınmış olabilir.
      }
      val devices = discoveredDevices.values
        .map { device -> deviceMap(device, false, false) }
        .sortedBy { item -> (item["name"] as? String ?: "").lowercase() }
      promise.resolve(baseSnapshot(true, true, true, devices, reason))
    }

    receiver = object : BroadcastReceiver() {
      override fun onReceive(receiverContext: Context?, intent: Intent?) {
        when (intent?.action) {
          BluetoothDevice.ACTION_FOUND -> extractDevice(intent)?.let { device ->
            discoveredDevices[device.address] = device
          }
          BluetoothAdapter.ACTION_DISCOVERY_FINISHED -> finish("scan_completed")
        }
      }
    }

    val filter = IntentFilter().apply {
      addAction(BluetoothDevice.ACTION_FOUND)
      addAction(BluetoothAdapter.ACTION_DISCOVERY_FINISHED)
    }

    try {
      val activeReceiver = receiver ?: run {
        finish("scan_receiver_unavailable")
        return
      }
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        context.registerReceiver(activeReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
      } else {
        @Suppress("UnspecifiedRegisterReceiverFlag")
        context.registerReceiver(activeReceiver, filter)
      }
      if (adapter.isDiscovering) adapter.cancelDiscovery()
      if (!adapter.startDiscovery()) {
        finish("scan_unavailable")
        return
      }
      mainHandler.postDelayed({ finish("scan_timeout") }, DISCOVERY_TIMEOUT_MS)
    } catch (_: SecurityException) {
      finish("scan_permission_required")
    }
  }

  @Suppress("DEPRECATION")
  private fun extractDevice(intent: Intent): BluetoothDevice? {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE, BluetoothDevice::class.java)
    } else {
      intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE)
    }
  }

  private fun resolveDevicesWithProfiles(
    context: Context,
    adapter: BluetoothAdapter,
    bondedDevices: List<BluetoothDevice>,
    promise: Promise,
  ) {
    val resolved = AtomicBoolean(false)
    val lock = Any()
    val a2dpAddresses = mutableSetOf<String>()
    val headsetAddresses = mutableSetOf<String>()
    val completedProfiles = mutableSetOf<Int>()
    val profiles = intArrayOf(BluetoothProfile.A2DP, BluetoothProfile.HEADSET)

    fun resolveSnapshot() {
      if (!resolved.compareAndSet(false, true)) return
      val devices = synchronized(lock) {
        bondedDevices
          .map { device ->
            deviceMap(device, a2dpAddresses.contains(device.address), headsetAddresses.contains(device.address))
          }
          .sortedBy { item -> (item["name"] as? String ?: "").lowercase() }
      }
      promise.resolve(baseSnapshot(true, true, true, devices))
    }

    fun completeProfile(profile: Int, proxy: BluetoothProfile?, devices: List<BluetoothDevice>) {
      val shouldResolve = synchronized(lock) {
        if (!completedProfiles.add(profile)) {
          false
        } else {
          val addresses = devices.map { it.address }
          if (profile == BluetoothProfile.A2DP) a2dpAddresses.addAll(addresses)
          if (profile == BluetoothProfile.HEADSET) headsetAddresses.addAll(addresses)
          completedProfiles.size == profiles.size
        }
      }
      if (proxy != null) adapter.closeProfileProxy(profile, proxy)
      if (shouldResolve) resolveSnapshot()
    }

    profiles.forEach { profile ->
      val requested = adapter.getProfileProxy(
        context,
        object : BluetoothProfile.ServiceListener {
          override fun onServiceConnected(connectedProfile: Int, proxy: BluetoothProfile) {
            val devices = try {
              proxy.connectedDevices
            } catch (_: SecurityException) {
              emptyList()
            }
            completeProfile(connectedProfile, proxy, devices)
          }

          override fun onServiceDisconnected(disconnectedProfile: Int) {
            completeProfile(disconnectedProfile, null, emptyList())
          }
        },
        profile,
      )
      if (!requested) completeProfile(profile, null, emptyList())
    }

    mainHandler.postDelayed({ resolveSnapshot() }, PROFILE_QUERY_TIMEOUT_MS)
  }

  private fun baseSnapshot(
    supported: Boolean,
    enabled: Boolean,
    permissionGranted: Boolean,
    devices: List<Map<String, Any?>>,
    reason: String? = null,
  ): Map<String, Any?> {
    return buildMap {
      put("nativeModuleAvailable", true)
      put("bluetoothSupported", supported)
      put("bluetoothEnabled", enabled)
      put("permissionGranted", permissionGranted)
      put("devices", devices)
      put("updatedAt", System.currentTimeMillis())
      if (reason != null) put("reason", reason)
    }
  }

  private fun unavailableSnapshot(reason: String): Map<String, Any?> {
    return baseSnapshot(false, false, false, emptyList(), reason)
  }

  private fun deviceMap(
    device: BluetoothDevice,
    a2dpConnected: Boolean,
    headsetConnected: Boolean,
  ): Map<String, Any?> {
    val name = try {
      device.name ?: "Adsız Bluetooth cihazı"
    } catch (_: SecurityException) {
      "Bluetooth cihazı"
    }
    val address = try {
      device.address
    } catch (_: SecurityException) {
      ""
    }
    val isBonded = try {
      device.bondState == BluetoothDevice.BOND_BONDED
    } catch (_: SecurityException) {
      false
    }

    return mapOf(
      "id" to address,
      "name" to name,
      "deviceType" to deviceTypeName(device.type),
      "isBonded" to isBonded,
      "isLikelyBuds2" to isLikelyBuds2(name),
      "a2dpConnected" to a2dpConnected,
      "headsetConnected" to headsetConnected,
      "batteryLevel" to null,
    )
  }

  private fun deviceTypeName(type: Int): String {
    return when (type) {
      BluetoothDevice.DEVICE_TYPE_CLASSIC -> "classic"
      BluetoothDevice.DEVICE_TYPE_LE -> "low-energy"
      BluetoothDevice.DEVICE_TYPE_DUAL -> "dual"
      else -> "unknown"
    }
  }

  private fun isLikelyBuds2(name: String): Boolean {
    val normalizedName = name.lowercase()
    return normalizedName.contains("galaxy buds2") ||
      normalizedName.contains("buds2") ||
      normalizedName.contains("sm-r177")
  }

  private companion object {
    const val PROFILE_QUERY_TIMEOUT_MS = 1200L
    const val DISCOVERY_TIMEOUT_MS = 16_000L
  }
}
