const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('mbtiles', 'sqlite', 'gpkg', 'onnx', 'tflite', 'kmz', 'kml', 'gpx', 'shp', 'cpg', 'dbf', 'prj', 'shx');
config.resolver.sourceExts.push('cjs');
module.exports = config;
