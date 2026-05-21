import ExpoModulesCore
import Foundation
import SQLite3
import Network

public class BouhNativeModule: Module {
  private var server: SimpleMbtilesServer?

  public func definition() -> ModuleDefinition {
    Name("BouhNativeModule")

    AsyncFunction("startTileServer") { (mbtilesPath: String, port: Int) -> String in
      self.server?.stop()
      let s = SimpleMbtilesServer(path: mbtilesPath, port: UInt16(port))
      try s.start()
      self.server = s
      return "http://127.0.0.1:\(port)"
    }

    AsyncFunction("stopTileServer") { () -> Bool in
      self.server?.stop()
      self.server = nil
      return true
    }

    AsyncFunction("haversineMetersNative") { (lat1: Double, lon1: Double, lat2: Double, lon2: Double) -> Double in
      let r = 6371008.8
      let p1 = lat1 * Double.pi / 180.0
      let p2 = lat2 * Double.pi / 180.0
      let dp = (lat2 - lat1) * Double.pi / 180.0
      let dl = (lon2 - lon1) * Double.pi / 180.0
      let h = pow(sin(dp / 2), 2) + cos(p1) * cos(p2) * pow(sin(dl / 2), 2)
      return 2 * r * atan2(sqrt(h), sqrt(1 - h))
    }

    AsyncFunction("readSpectralAt") { (packagePath: String, lat: Double, lon: Double) -> [String: Double] in
      return SpectralSqliteReader.read(path: packagePath, lat: lat, lon: lon)
    }
  }
}

final class SpectralSqliteReader {
  static func read(path: String, lat: Double, lon: Double) -> [String: Double] {
    var db: OpaquePointer?
    if sqlite3_open_v2(path, &db, SQLITE_OPEN_READONLY, nil) != SQLITE_OK {
      return ["clay": 0, "ironOxide": 0, "silica": 0, "lineamentDensity": 0, "shearIntersection": 0]
    }
    defer { sqlite3_close(db) }
    let sql = "select lat,lon,b2,b4,b6,b7,aster_silica,lineament_density,shear_intersection from spectral_pixels order by ((lat - ?) * (lat - ?) + (lon - ?) * (lon - ?)) asc limit 1"
    var stmt: OpaquePointer?
    if sqlite3_prepare_v2(db, sql, -1, &stmt, nil) != SQLITE_OK {
      return ["clay": 0, "ironOxide": 0, "silica": 0, "lineamentDensity": 0, "shearIntersection": 0]
    }
    defer { sqlite3_finalize(stmt) }
    sqlite3_bind_double(stmt, 1, lat)
    sqlite3_bind_double(stmt, 2, lat)
    sqlite3_bind_double(stmt, 3, lon)
    sqlite3_bind_double(stmt, 4, lon)
    if sqlite3_step(stmt) != SQLITE_ROW {
      return ["clay": 0, "ironOxide": 0, "silica": 0, "lineamentDensity": 0, "shearIntersection": 0]
    }
    let b2 = max(sqlite3_column_double(stmt, 2), 0.000001)
    let b4 = sqlite3_column_double(stmt, 3)
    let b6 = sqlite3_column_double(stmt, 4)
    let b7 = max(sqlite3_column_double(stmt, 5), 0.000001)
    let silica = sqlite3_column_double(stmt, 6)
    return [
      "lat": sqlite3_column_double(stmt, 0),
      "lon": sqlite3_column_double(stmt, 1),
      "b2": b2,
      "b4": b4,
      "b6": b6,
      "b7": b7,
      "clay": b6 / b7,
      "ironOxide": b4 / b2,
      "silica": silica,
      "asterSilica": silica,
      "lineamentDensity": sqlite3_column_double(stmt, 7),
      "shearIntersection": sqlite3_column_double(stmt, 8)
    ]
  }
}

final class SimpleMbtilesServer {
  let path: String
  let port: UInt16
  private var listener: NWListener?

  init(path: String, port: UInt16) {
    self.path = path
    self.port = port
  }

  func start() throws {
    let params = NWParameters.tcp
    let listener = try NWListener(using: params, on: NWEndpoint.Port(rawValue: port)!)
    listener.newConnectionHandler = { connection in
      connection.start(queue: .global())
      self.receive(connection: connection)
    }
    listener.start(queue: .global())
    self.listener = listener
  }

  func stop() {
    listener?.cancel()
    listener = nil
  }

  private func receive(connection: NWConnection) {
    connection.receive(minimumIncompleteLength: 1, maximumLength: 4096) { data, _, _, _ in
      guard let data = data, let request = String(data: data, encoding: .utf8) else {
        connection.cancel()
        return
      }
      let first = request.components(separatedBy: "\r\n").first ?? ""
      let pathPart = first.components(separatedBy: " ").dropFirst().first ?? ""
      let bytes = self.tileBytes(uri: pathPart)
      if let tile = bytes {
        let mime = tile.count > 8 && tile[0] == 0x89 ? "image/png" : "image/jpeg"
        var header = "HTTP/1.1 200 OK\r\nContent-Type: \(mime)\r\nContent-Length: \(tile.count)\r\nConnection: close\r\n\r\n"
        var response = Data(header.utf8)
        response.append(tile)
        connection.send(content: response, completion: .contentProcessed { _ in connection.cancel() })
      } else {
        let body = "BOUH_TILE_NOT_FOUND"
        let header = "HTTP/1.1 404 Not Found\r\nContent-Type: text/plain\r\nContent-Length: \(body.count)\r\nConnection: close\r\n\r\n"
        connection.send(content: Data((header + body).utf8), completion: .contentProcessed { _ in connection.cancel() })
      }
    }
  }

  private func tileBytes(uri: String) -> Data? {
    let parts = uri.trimmingCharacters(in: CharacterSet(charactersIn: "/")).components(separatedBy: "/")
    if parts.count < 5 || parts[0] != "tiles" { return nil }
    guard let z = Int32(parts[2]), let x = Int32(parts[3]), let yXyz = Int32(parts[4].components(separatedBy: ".").first ?? "") else { return nil }
    let yTms = Int32((1 << z) - 1) - yXyz
    var db: OpaquePointer?
    if sqlite3_open_v2(path, &db, SQLITE_OPEN_READONLY, nil) != SQLITE_OK { return nil }
    defer { sqlite3_close(db) }
    let sql = "select tile_data from tiles where zoom_level=? and tile_column=? and tile_row=? limit 1"
    var stmt: OpaquePointer?
    if sqlite3_prepare_v2(db, sql, -1, &stmt, nil) != SQLITE_OK { return nil }
    defer { sqlite3_finalize(stmt) }
    sqlite3_bind_int(stmt, 1, z)
    sqlite3_bind_int(stmt, 2, x)
    sqlite3_bind_int(stmt, 3, yTms)
    if sqlite3_step(stmt) != SQLITE_ROW { return nil }
    let bytes = sqlite3_column_blob(stmt, 0)
    let length = Int(sqlite3_column_bytes(stmt, 0))
    if bytes == nil || length <= 0 { return nil }
    return Data(bytes: bytes!, count: length)
  }
}
