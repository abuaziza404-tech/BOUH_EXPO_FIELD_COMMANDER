const { withProjectBuildGradle, withAppBuildGradle, withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

function appendOnce(source, needle, insertion) {
  if (source.includes(needle)) return source;
  return source + "\n" + insertion + "\n";
}

module.exports = function withBouhNative(config) {
  config = withProjectBuildGradle(config, (cfg) => {
    cfg.modResults.contents = appendOnce(
      cfg.modResults.contents,
      "mavenCentral()",
      "allprojects { repositories { google(); mavenCentral() } }"
    );
    return cfg;
  });

  config = withAppBuildGradle(config, (cfg) => {
    cfg.modResults.contents = cfg.modResults.contents.replace(
      "dependencies {",
      "dependencies {\n    implementation 'org.nanohttpd:nanohttpd:2.3.1'"
    );
    return cfg;
  });

  config = withDangerousMod(config, ["android", async (cfg) => {
    const source = path.join(cfg.modRequest.projectRoot, "modules", "bouh-native", "android");
    const dest = path.join(cfg.modRequest.platformProjectRoot, "bouh-native");
    if (fs.existsSync(source)) {
      fs.cpSync(source, dest, { recursive: true });
    }
    return cfg;
  }]);

  return config;
};
