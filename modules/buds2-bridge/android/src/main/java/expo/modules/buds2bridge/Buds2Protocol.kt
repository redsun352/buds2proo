package expo.modules.buds2bridge

/**
 * Galaxy Buds2'nin yeni SPP hizmeti için bağımsız RFCOMM çerçevesi.
 * Bu sınıf yalnızca düşük riskli ANC ve sabit ekolayzır ön ayarı komutlarını oluşturur.
 */
object Buds2Protocol {
  const val SERVICE_UUID = "2e73a4ad-332d-41fc-90e2-16bef06523f2"
  const val NOISE_CONTROLS = 120
  const val EQUALIZER = 134
  const val LOCK_TOUCHPAD = 144
  const val SET_TOUCHPAD_OPTION = 146
  private const val MANAGER_INFO = 136
  const val EXTENDED_STATUS_UPDATED = 97
  private const val RESPONSE = 81
  private const val SOM = 0xFD
  private const val EOM = 0xDD

  fun managerInfo(androidSdk: Int): ByteArray = encode(MANAGER_INFO, byteArrayOf(1, 1, androidSdk.toByte()))

  fun noiseControl(mode: String): ByteArray? {
    val value = when (mode) {
      "off" -> 0
      "anc" -> 1
      "ambient" -> 2
      else -> return null
    }
    return encode(NOISE_CONTROLS, byteArrayOf(value.toByte()))
  }

  fun touchLock(locked: Boolean): ByteArray {
    val enabled = if (locked) 0 else 1
    // Buds2 supports tap, double-tap, triple-tap, hold and call touch flags.
    return encode(LOCK_TOUCHPAD, ByteArray(7) { enabled.toByte() })
  }

  fun touchOptions(left: String, right: String): ByteArray? {
    val leftValue = touchActionValue(left) ?: return null
    val rightValue = touchActionValue(right) ?: return null
    return encode(SET_TOUCHPAD_OPTION, byteArrayOf(leftValue, rightValue))
  }

  private fun touchActionValue(action: String): Byte? = when (action) {
    "voice_assistant" -> 1
    "noise_control" -> 2
    "volume" -> 3
    "spotify" -> 4
    "other_left" -> 5
    "other_right" -> 6
    else -> null
  }

  fun equalizer(preset: String): ByteArray? {
    val value = when (preset) {
      // Buds2 family: 0 disables EQ; 1..5 are Bass Boost, Soft, Dynamic, Clear, Treble Boost.
      "normal" -> 0
      "bass_boost" -> 1
      "soft" -> 2
      "dynamic" -> 3
      "clear" -> 4
      "treble_boost" -> 5
      else -> return null
    }
    return encode(EQUALIZER, byteArrayOf(value.toByte()))
  }

  data class ExtendedStatus(
    val batteryLeft: Int,
    val batteryRight: Int,
    val batteryCase: Int,
    val equalizerMode: Int,
  )

  fun wasCommandAccepted(raw: ByteArray, expectedCommandId: Int): Boolean {
    return parseFrames(raw).any { frame ->
      frame.first == RESPONSE && frame.second.size >= 2 &&
        (frame.second[0].toInt() and 0xFF) == expectedCommandId &&
        (frame.second[1].toInt() and 0xFF) == 0
    }
  }

  fun decodeExtendedStatus(raw: ByteArray): ExtendedStatus? {
    val payload = parseFrames(raw).firstOrNull { it.first == EXTENDED_STATUS_UPDATED }?.second ?: return null
    if (payload.size < 10) return null
    return ExtendedStatus(
      batteryLeft = payload[2].toInt() and 0xFF,
      batteryRight = payload[3].toInt() and 0xFF,
      batteryCase = payload[7].toInt() and 0xFF,
      equalizerMode = payload[9].toInt() and 0xFF,
    )
  }

  private fun parseFrames(raw: ByteArray): List<Pair<Int, ByteArray>> {
    val frames = mutableListOf<Pair<Int, ByteArray>>()
    var offset = 0
    while (offset + 6 < raw.size) {
      if ((raw[offset].toInt() and 0xFF) != SOM) {
        offset += 1
        continue
      }
      val size = (raw[offset + 1].toInt() and 0xFF) or ((raw[offset + 2].toInt() and 0x03) shl 8)
      val frameSize = size + 4
      if (size < 3 || offset + frameSize > raw.size) break
      val payloadSize = size - 3
      val messageId = raw[offset + 3].toInt() and 0xFF
      frames += messageId to raw.copyOfRange(offset + 4, offset + 4 + payloadSize)
      offset += frameSize
    }
    return frames
  }

  private fun encode(messageId: Int, payload: ByteArray): ByteArray {
    val size = 1 + payload.size + 2
    val packet = ByteArray(size + 4)
    packet[0] = SOM.toByte()
    packet[1] = (size and 0xFF).toByte()
    packet[2] = ((size shr 8) and 0xFF).toByte()
    packet[3] = messageId.toByte()
    payload.copyInto(packet, destinationOffset = 4)
    val crc = crc16Ccitt(byteArrayOf(messageId.toByte()) + payload)
    packet[4 + payload.size] = (crc and 0xFF).toByte()
    packet[5 + payload.size] = ((crc shr 8) and 0xFF).toByte()
    packet[6 + payload.size] = EOM.toByte()
    return packet
  }

  private fun crc16Ccitt(data: ByteArray): Int {
    var crc = 0
    data.forEach { value ->
      crc = crc xor ((value.toInt() and 0xFF) shl 8)
      repeat(8) {
        crc = if ((crc and 0x8000) != 0) (crc shl 1) xor 0x1021 else crc shl 1
        crc = crc and 0xFFFF
      }
    }
    return crc
  }
}
