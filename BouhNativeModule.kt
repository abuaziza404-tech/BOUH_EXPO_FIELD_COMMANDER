package com.abuaziza.bouh

import android.database.sqlite.SQLiteDatabase
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import fi.iki.elonen.NanoHTTPD
import java.io.File
import kotlin.math.*

class BouhNativeModule : Module() {
  private var server: MbtilesServer? = null

  override fun definition() = ModuleDefinition {
    Name("BouhNativeModule")

    AsyncFunction("startTileServer") { mbtilesPath: String, port: Int ->
      server?.stop()
      server = MbtilesServer(port, mbtilesPath)
      server!!.start(NanoHTTPD.SOCKET_READ_TIMEOUT, false)
      "http://127.0.0.1:$port"
    }

    AsyncFunction("stopTileServer") {
      server?.stop()
      server = null
      true
    }

    AsyncFunction("haversineMetersNative") { lat1: Double, lon1: Double, lat2: Double, lon2: Double ->
      haversine(lat1, lon1, lat2, lon2)
    }

    AsyncFunction("readSpectralAt") { packagePath: String, lat: Double, lon: Double ->
      readSpectralAt(packagePath, lat, lon)
    }
  }

  private fun haversine(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
    val r = 6371008.8
    val p1 = Math.toRadians(lat1)
    val p2 = Math.toRadians(lat2)
    val dp = Math.toRadians(lat2 - lat1)
    val dl = Math.toRadians(lon2 - lon1)
    val h = sin(dp / 2).pow(2.0) + cos(p1) * cos(p2) * sin(dl / 2).pow(2.0)
    return 2.0 * r * atan2(sqrt(h), sqrt(1.0 - h))
  }

  private fun readSpectralAt(packagePath: String, lat: Double, lon: Double): Map<String, Double> {
    val file = File(packagePath)
    if (!file.exists()) {
      return mapOf("clay" to 0.0, "ironOxide" to 0.0, "silica" to 0.0, "lineamentDensity" to 0.0, "shearIntersection" to 0.0)
    }
    val db = SQLiteDatabase.openDatabase(file.absolutePath, null, SQLiteDatabase.OPEN_READONLY)
    val cursor = db.rawQuery(
      "select lat,lon,b2,b4,b6,b7,aster_silica,lineament_density,shear_intersection from spectral_pixels order by ((lat - ?) * (lat - ?) + (lon - ?) * (lon - ?)) asc limit 1",
      arrayOf(lat.toString(), lat.toString(), lon.toString(), lon.toString())
    )
    val result = if (cursor.moveToFirst()) {
      val b2 = cursor.getDouble(2).coerceAtLeast(0.000001)
      val b4 = cursor.getDouble(3)
      val b6 = cursor.getDouble(4)
      val b7 = cursor.getDouble(5).coerceAtLeast(0.000001)
      mapOf(
        "lat" to cursor.getDouble(0),
        "lon" to cursor.getDouble(1),
        "b2" to b2,
        "b4" to b4,
        "b6" to b6,
        "b7" to b7,
        "clay" to (b6 / b7),
        "ironOxide" to (b4 / b2),
        "silica" to cursor.getDouble(6),
        "asterSilica" to cursor.getDouble(6),
        "lineamentDensity" to cursor.getDouble(7),
        "shearIntersection" to cursor.getDouble(8)
      )
    } else {
      mapOf("clay" to 0.0, "ironOxide" to 0.0, "silica" to 0.0, "lineamentDensity" to 0.0, "shearIntersection" to 0.0)
    }
    cursor.close()
    db.close()
    return result
  }
}

class MbtilesServer(private val portNumber: Int, private val mbtilesPath: String) : NanoHTTPD(portNumber) {
  override fun serve(session: IHTTPSession): Response {
    val parts = session.uri.trim('/').split('/')
    if (parts.size < 5 || parts[0] != "tiles") {
      return newFixedLengthResponse(Response.Status.NOT_FOUND, "text/plain", "BOUH_TILE_NOT_FOUND")
    }
    val z = parts[2].toIntOrNull() ?: return newFixedLengthResponse(Response.Status.BAD_REQUEST, "text/plain", "BAD_Z")
    val x = parts[3].toIntOrNull() ?: return newFixedLengthResponse(Response.Status.BAD_REQUEST, "text/plain", "BAD_X")
    val yXyz = parts[4].substringBefore('.').toIntOrNull() ?: return newFixedLengthResponse(Response.Status.BAD_REQUEST, "text/plain", "BAD_Y")
    val yTms = (1 shl z) - 1 - yXyz
    val file = File(mbtilesPath)
    if (!file.exists()) return newFixedLengthResponse(Response.Status.NOT_FOUND, "text/plain", "MBTILES_MISSING")
    val db = SQLiteDatabase.openDatabase(file.absolutePath, null, SQLiteDatabase.OPEN_READONLY)
    val cursor = db.rawQuery("select tile_data from tiles where zoom_level=? and tile_column=? and tile_row=? limit 1", arrayOf(z.toString(), x.toString(), yTms.toString()))
    if (!cursor.moveToFirst()) {
      cursor.close()
      db.close()
      return newFixedLengthResponse(Response.Status.NOT_FOUND, "text/plain", "TILE_EMPTY")
    }
    val bytes = cursor.getBlob(0)
    cursor.close()
    db.close()
    val mime = if (bytes.size > 8 && bytes[0] == 0x89.toByte()) "image/png" else "image/jpeg"
    return newFixedLengthResponse(Response.Status.OK, mime, bytes.inputStream(), bytes.size.toLong())
  }
}
