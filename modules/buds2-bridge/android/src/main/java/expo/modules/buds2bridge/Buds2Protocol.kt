package expo.modules.buds2bridge

/**
 * Galaxy Buds2'nin yeni SPP hizmeti için bağımsız RFCOMM çerçevesi.
 * Bu sınıf yalnızca düşük riskli ANC ve sabit ekolayzır ön ayarı komutlarını oluşturur.
 */
object Buds2Protocol {
  const val SERVICE_UUID = "2e73a4ad-332d-41fc-90e2-16bef06523f2"
  const val NOISE_CONTROLS = 120
  const val EQUALIZER = 134
  private const val MANAGER_INFO = 136
  private const val RESPONSE = 81
  private const val SOM = 0xFD
  private const val EOM = 0xDD

  fun managerInfo(androidSdk: Int): ByteArray = encode(MANAGER_INFO, byteArrayOf(1, 2, androidSdk.toByte()))

  fun noiseControl(mode: String): ByteArray? {
    val value = when (mode) {
      "off" -> 0
      "anc" -> 1
      "ambient" -> 2
      else -> return null
    }
    return encode(NOISE_CONTROLS, byteArrayOf(value.toByte()))
  }

  fun equalizer(preset: String): ByteArray? {
    val value = when (preset) {
      "normal" -> 1
      "bass_boost" -> 2
      "soft" -> 3
      "dynamic" -> 4
      else -> return null
    }
    return encode(EQUALIZER, byteArrayOf(value.toByte()))
  }

  fun wasCommandAccepted(raw: ByteArray, expectedCommandId: Int): Boolean {
    var offset = 0
    while (offset + 6 < raw.size) {
      if ((raw[offset].toInt() and 0xFF) != SOM) {
        offset += 1
        continue
      }
      val size = (raw[offset + 1].toInt() and 0xFF) or ((raw[offset + 2].toInt() and 0x03) shl 8)
      val frameSize = size + 4
      if (size < 3 || offset + frameSize > raw.size) return false
      val messageId = raw[offset + 3].toInt() and 0xFF
      val payloadSize = size - 3
      val payloadStart = offset + 4
      if (
        messageId == RESPONSE &&
        payloadSize >= 2 &&
        (raw[payloadStart].toInt() and 0xFF) == expectedCommandId &&
        (raw[payloadStart + 1].toInt() and 0xFF) == 0
      ) {
        return true
      }
      offset += frameSize
    }
    return false
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
