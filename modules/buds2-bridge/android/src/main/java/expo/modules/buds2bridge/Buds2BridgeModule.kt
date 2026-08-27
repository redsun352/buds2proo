package expo.modules.buds2bridge

import android.Manifest
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothProfile
import android.content.Context
import android.content.Intent
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
        promise.resolve(baseSnapshot(supported = false, enabled = false, permissionGranted = false, devices = emptyList()))
        return@AsyncFunction
      }

      if (!hasConnectPermission(context)) {
        promise.resolve(baseSnapshot(supported = true, enabled = false, permissionGranted = false, devices = emptyList()))
        return@AsyncFunction
      }

      if (!adapter.isEnabled) {
        promise.resolve(baseSnapshot(supported = true, enabled = false, permissionGranted = true, devices = emptyList()))
        return@AsyncFunction
      }

      val bondedDevices = try {
        adapter.bondedDevices.orEmpty().toList()
      } catch (_: SecurityException) {
        emptyList()
      }

      resolveDevicesWithProfiles(context, adapter, bondedDevices, promise)
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
            deviceMap(
              device = device,
              a2dpConnected = a2dpAddresses.contains(device.address),
              headsetConnected = headsetAddresses.contains(device.address),
            )
          }
          .sortedBy { item -> (item["name"] as? String ?: "").lowercase() }
      }

      promise.resolve(baseSnapshot(supported = true, enabled = true, permissionGranted = true, devices = devices))
    }

    fun completeProfile(profile: Int, proxy: BluetoothProfile?, devices: List<BluetoothDevice>) {
      val shouldResolve = synchronized(lock) {
        if (!completedProfiles.add(profile)) {
          false
        } else {
          val addresses = devices.map { it.address }
          if (profile == BluetoothProfile.A2DP) {
            a2dpAddresses.addAll(addresses)
          } else if (profile == BluetoothProfile.HEADSET) {
            headsetAddresses.addAll(addresses)
          }
          completedProfiles.size == profiles.size
        }
      }

      if (proxy != null) {
        adapter.closeProfileProxy(profile, proxy)
      }
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
  ): Map<String, Any?> {
    return mapOf(
      "nativeModuleAvailable" to true,
      "bluetoothSupported" to supported,
      "bluetoothEnabled" to enabled,
      "permissionGranted" to permissionGranted,
      "devices" to devices,
      "updatedAt" to System.currentTimeMillis(),
    )
  }

  private fun unavailableSnapshot(reason: String): Map<String, Any?> {
    return mapOf(
      "nativeModuleAvailable" to true,
      "bluetoothSupported" to false,
      "bluetoothEnabled" to false,
      "permissionGranted" to false,
      "devices" to emptyList<Map<String, Any?>>(),
      "updatedAt" to System.currentTimeMillis(),
      "reason" to reason,
    )
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

    return mapOf(
      "id" to address,
      "name" to name,
      "deviceType" to deviceTypeName(device.type),
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
  }
}
