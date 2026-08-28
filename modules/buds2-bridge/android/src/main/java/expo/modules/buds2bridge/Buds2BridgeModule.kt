package expo.modules.buds2bridge

import android.Manifest
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothProfile
import android.bluetooth.BluetoothSocket
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
import java.io.ByteArrayOutputStream
import java.io.IOException
import java.util.UUID
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean

class Buds2BridgeModule : Module() {
  private val mainHandler = Handler(Looper.getMainLooper())
  private val controlExecutor = Executors.newSingleThreadExecutor()

  override fun definition() = ModuleDefinition {
    Name("Buds2Bridge")

    AsyncFunction("getBluetoothSnapshot") { promise: Promise ->
      val context = appContext.reactContext
      if (context == null) {
        promise.resolve(unavailableSnapshot("context_unavailable"))
        return@AsyncFunction
      }
      val adapter = bluetoothAdapter(context)
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
      val adapter = bluetoothAdapter(context)
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

    AsyncFunction("applyNoiseControl") { deviceId: String, mode: String, promise: Promise ->
      val frame = Buds2Protocol.noiseControl(mode)
      if (frame == null) {
        promise.resolve(controlResult("noise_control", "blocked", "Geçersiz ANC modu seçildi."))
        return@AsyncFunction
      }
      sendBuds2Command(deviceId, Buds2Protocol.NOISE_CONTROLS, frame, "noise_control", promise)
    }

    AsyncFunction("applyEqualizer") { deviceId: String, preset: String, promise: Promise ->
      val frame = Buds2Protocol.equalizer(preset)
      if (frame == null) {
        promise.resolve(controlResult("equalizer", "blocked", "Geçersiz ekolayzır ön ayarı seçildi."))
        return@AsyncFunction
      }
      sendBuds2Command(deviceId, Buds2Protocol.EQUALIZER, frame, "equalizer", promise)
    }

    Function("openBluetoothSettings") {
      val context = appContext.reactContext ?: return@Function false
      context.startActivity(Intent(Settings.ACTION_BLUETOOTH_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
      true
    }
  }

  private fun bluetoothAdapter(context: Context): BluetoothAdapter? {
    return (context.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager)?.adapter
  }

  private fun hasConnectPermission(context: Context): Boolean {
    return Build.VERSION.SDK_INT < Build.VERSION_CODES.S ||
      context.checkSelfPermission(Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED
  }

  private fun hasScanPermission(context: Context): Boolean {
    return Build.VERSION.SDK_INT < Build.VERSION_CODES.S ||
      context.checkSelfPermission(Manifest.permission.BLUETOOTH_SCAN) == PackageManager.PERMISSION_GRANTED
  }

  private fun sendBuds2Command(
    deviceId: String,
    commandId: Int,
    commandFrame: ByteArray,
    commandName: String,
    promise: Promise,
  ) {
    controlExecutor.execute {
      val context = appContext.reactContext
      if (context == null) {
        promise.resolve(controlResult(commandName, "blocked", "Android bağlamı hazır değil."))
        return@execute
      }
      if (!hasConnectPermission(context)) {
        promise.resolve(controlResult(commandName, "blocked", "Yakındaki cihazlar izni gerekli."))
        return@execute
      }
      val adapter = bluetoothAdapter(context)
      if (adapter == null || !adapter.isEnabled) {
        promise.resolve(controlResult(commandName, "blocked", "Bluetooth kapalı veya kullanılamıyor."))
        return@execute
      }
      val device = try {
        adapter.bondedDevices.orEmpty().firstOrNull { it.address == deviceId }
      } catch (_: SecurityException) {
        null
      }
      if (device == null || !isLikelyBuds2(safeDeviceName(device))) {
        promise.resolve(controlResult(commandName, "blocked", "Bağlı ve eşlenmiş bir Galaxy Buds2 bulunamadı."))
        return@execute
      }

      var socket: BluetoothSocket? = null
      try {
        if (adapter.isDiscovering) adapter.cancelDiscovery()
        socket = device.createInsecureRfcommSocketToServiceRecord(UUID.fromString(Buds2Protocol.SERVICE_UUID))
        socket.connect()
        val output = socket.outputStream
        output.write(Buds2Protocol.managerInfo(Build.VERSION.SDK_INT))
        output.flush()
        output.write(commandFrame)
        output.flush()
        val confirmed = awaitCommandConfirmation(socket, commandId)
        if (confirmed) {
          promise.resolve(controlResult(commandName, "confirmed", "Kulaklık komutu onayladı."))
        } else {
          promise.resolve(controlResult(commandName, "sent_no_ack", "Komut iletildi ancak Buds2 onayı alınamadı. Değişikliği kulaklıktan kontrol edin."))
        }
      } catch (_: IOException) {
        promise.resolve(controlResult(commandName, "failed", "RFCOMM bağlantısı kurulamadı. Galaxy Wearable'ı kapatıp Buds2 bağlıyken yeniden deneyin."))
      } catch (_: SecurityException) {
        promise.resolve(controlResult(commandName, "blocked", "Bluetooth erişimi işlem sırasında engellendi."))
      } finally {
        try {
          socket?.close()
        } catch (_: IOException) {
          // Soket zaten kapatılmış olabilir.
        }
      }
    }
  }

  private fun awaitCommandConfirmation(socket: BluetoothSocket, commandId: Int): Boolean {
    val input = socket.inputStream
    val buffer = mutableListOf<Byte>()
    val deadline = System.currentTimeMillis() + COMMAND_CONFIRMATION_TIMEOUT_MS
    while (System.currentTimeMillis() < deadline) {
      val available = input.available()
      if (available > 0) {
        val chunk = ByteArray(available)
        val count = input.read(chunk)
        if (count > 0) {
          buffer.addAll(chunk.take(count))
          if (Buds2Protocol.wasCommandAccepted(buffer.toByteArray(), commandId)) return true
        }
      }
      try {
        Thread.sleep(COMMAND_POLL_INTERVAL_MS)
      } catch (_: InterruptedException) {
        Thread.currentThread().interrupt()
        return false
      }
    }
    return false
  }

  private fun discoverNearbyDevices(context: Context, adapter: BluetoothAdapter, promise: Promise) {
    val completed = AtomicBoolean(false)
    val discoveredDevices = linkedMapOf<String, BluetoothDevice>()
    try {
      adapter.bondedDevices.orEmpty().forEach { device -> discoveredDevices[device.address] = device }
    } catch (_: SecurityException) {
      // Tarama yeni cihazları yine de ekleyebilir.
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
        // İzin tarama boyunca sistem tarafından geri alınmış olabilir.
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
      val profileDevices = synchronized(lock) {
        bondedDevices.map { device ->
          Triple(device, a2dpAddresses.contains(device.address), headsetAddresses.contains(device.address))
        }
      }
      // The extended-status message carries Buds2-specific battery fields that Android's
      // public Bluetooth API does not expose. Keep the socket work off the main thread.
      controlExecutor.execute {
        val devices = profileDevices
          .map { (device, a2dpConnected, headsetConnected) ->
            val status = if (isLikelyBuds2(safeDeviceName(device))) queryDeviceStatus(device) else null
            deviceMap(device, a2dpConnected, headsetConnected, status)
          }
          .sortedBy { item -> (item["name"] as? String ?: "").lowercase() }
        promise.resolve(baseSnapshot(true, true, true, devices))
      }
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

  private fun controlResult(command: String, status: String, message: String): Map<String, String> {
    return mapOf("command" to command, "status" to status, "message" to message)
  }

  private fun deviceMap(
    device: BluetoothDevice,
    a2dpConnected: Boolean,
    headsetConnected: Boolean,
    status: Buds2Protocol.ExtendedStatus? = null,
  ): Map<String, Any?> {
    val name = safeDeviceName(device).ifBlank { "Adsız Bluetooth cihazı" }
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
      "batteryLevel" to readBatteryLevel(device),
      "batteryLeft" to status?.batteryLeft,
      "batteryRight" to status?.batteryRight,
      "batteryCase" to status?.batteryCase,
      "equalizerMode" to status?.equalizerMode,
    )
  }

  private fun queryDeviceStatus(device: BluetoothDevice): Buds2Protocol.ExtendedStatus? {
    var socket: BluetoothSocket? = null
    return try {
      socket = device.createInsecureRfcommSocketToServiceRecord(UUID.fromString(Buds2Protocol.SERVICE_UUID))
      socket.connect()
      val output = socket.outputStream
      output.write(Buds2Protocol.managerInfo(Build.VERSION.SDK_INT))
      output.flush()
      val input = socket.inputStream
      val buffer = ByteArrayOutputStream()
      val deadline = System.currentTimeMillis() + STATUS_QUERY_TIMEOUT_MS
      var status: Buds2Protocol.ExtendedStatus? = null
      while (System.currentTimeMillis() < deadline && status == null) {
        val available = input.available()
        if (available > 0) {
          val chunk = ByteArray(available)
          val count = input.read(chunk)
          if (count > 0) {
            buffer.write(chunk, 0, count)
            status = Buds2Protocol.decodeExtendedStatus(buffer.toByteArray())
          }
        } else {
          try {
            Thread.sleep(COMMAND_POLL_INTERVAL_MS)
          } catch (_: InterruptedException) {
            Thread.currentThread().interrupt()
            break
          }
        }
      }
      status
    } catch (_: IOException) {
      null
    } catch (_: SecurityException) {
      null
    } finally {
      try {
        socket?.close()
      } catch (_: IOException) {
        // Soket zaten kapatılmış olabilir.
      }
    }
  }

  /**
   * Android exposes this value only on some platform/vendor builds. Reflection keeps
   * the module compatible with older SDKs and returns null instead of inventing data.
   */
  private fun readBatteryLevel(device: BluetoothDevice): Int? {
    return try {
      val method = BluetoothDevice::class.java.getMethod("getBatteryLevel")
      val level = method.invoke(device) as? Int
      level?.takeIf { it in 0..100 }
    } catch (_: ReflectiveOperationException) {
      null
    } catch (_: SecurityException) {
      null
    }
  }

  private fun safeDeviceName(device: BluetoothDevice): String {
    return try {
      device.name ?: ""
    } catch (_: SecurityException) {
      ""
    }
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
    return normalizedName.contains("galaxy buds2") || normalizedName.contains("buds2") || normalizedName.contains("sm-r177")
  }

  private companion object {
    const val PROFILE_QUERY_TIMEOUT_MS = 1200L
    const val DISCOVERY_TIMEOUT_MS = 16_000L
    const val COMMAND_CONFIRMATION_TIMEOUT_MS = 2_000L
    const val STATUS_QUERY_TIMEOUT_MS = 1_500L
    const val COMMAND_POLL_INTERVAL_MS = 50L
  }
}
