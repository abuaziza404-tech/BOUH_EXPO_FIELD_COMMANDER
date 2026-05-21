#!/usr/bin/env python3
import argparse
from pathlib import Path
import math
import numpy as np
from PIL import Image

try:
    import rasterio
    from rasterio.warp import transform_bounds
    from rasterio.windows import from_bounds
    import mercantile
except Exception as exc:
    raise SystemExit("Install dependencies: pip install rasterio mercantile pillow numpy\n" + str(exc))

WEBMERCATOR_HALF = 20037508.342789244
TILE_SIZE = 256

def lonlat_to_mercator(lon, lat):
    lat = max(min(lat, 85.05112878), -85.05112878)
    x = lon * WEBMERCATOR_HALF / 180.0
    y = math.log(math.tan((90.0 + lat) * math.pi / 360.0)) * WEBMERCATOR_HALF / math.pi
    return x, y

def elevation_to_terrain_rgb(elevation):
    value = np.rint((elevation + 10000.0) / 0.1).astype(np.int64)
    value = np.clip(value, 0, 16777215)
    r = (value // 65536).astype(np.uint8)
    g = ((value // 256) % 256).astype(np.uint8)
    b = (value % 256).astype(np.uint8)
    return np.dstack([r, g, b])

def tile_bounds_mercator(z, x, y):
    n = 2 ** z
    tile_span = (WEBMERCATOR_HALF * 2) / n
    minx = -WEBMERCATOR_HALF + x * tile_span
    maxx = minx + tile_span
    maxy = WEBMERCATOR_HALF - y * tile_span
    miny = maxy - tile_span
    return minx, miny, maxx, maxy

def main():
    parser = argparse.ArgumentParser(description="Convert SRTM/DEM GeoTIFF to Mapbox Terrain-RGB XYZ tiles.")
    parser.add_argument("--dem", required=True, help="Input DEM GeoTIFF path.")
    parser.add_argument("--out", required=True, help="Output tile directory.")
    parser.add_argument("--minzoom", type=int, default=5)
    parser.add_argument("--maxzoom", type=int, default=14)
    parser.add_argument("--bounds", default="", help="lon_min,lat_min,lon_max,lat_max. Empty uses DEM bounds.")
    args = parser.parse_args()

    dem_path = Path(args.dem)
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    with rasterio.open(dem_path) as src:
        if args.bounds:
            lon_min, lat_min, lon_max, lat_max = [float(v) for v in args.bounds.split(",")]
        else:
            lon_min, lat_min, lon_max, lat_max = transform_bounds(src.crs, "EPSG:4326", *src.bounds, densify_pts=21)

        for z in range(args.minzoom, args.maxzoom + 1):
            tiles = list(mercantile.tiles(lon_min, lat_min, lon_max, lat_max, [z]))
            for tile in tiles:
                b = mercantile.bounds(tile)
                try:
                    win = from_bounds(b.west, b.south, b.east, b.north, transform=src.transform)
                    arr = src.read(1, window=win, out_shape=(TILE_SIZE, TILE_SIZE), boundless=True, fill_value=0, resampling=rasterio.enums.Resampling.bilinear)
                except Exception:
                    arr = np.zeros((TILE_SIZE, TILE_SIZE), dtype=np.float32)
                arr = np.nan_to_num(arr.astype(np.float32), nan=0.0, posinf=0.0, neginf=0.0)
                rgb = elevation_to_terrain_rgb(arr)
                tile_dir = out / str(z) / str(tile.x)
                tile_dir.mkdir(parents=True, exist_ok=True)
                Image.fromarray(rgb, "RGB").save(tile_dir / f"{tile.y}.png", optimize=True)
            print(f"z={z} tiles={len(tiles)}")

if __name__ == "__main__":
    main()
