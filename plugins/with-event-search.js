const { withDangerousMod, withAppBuildGradle, withXcodeProject } = require('expo/config-plugins');
const fs = require('fs/promises');
const path = require('path');

function withEventSearch(config) {
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const root = config.modRequest.platformProjectRoot;
      const jni = path.join(root, 'app/src/main/jni');
      await fs.mkdir(jni, { recursive: true });
      await fs.copyFile(
        path.join(config.modRequest.projectRoot, 'native/event-search/NativeEventSearch.h'),
        path.join(jni, 'NativeEventSearch.h'),
      );
      await fs.copyFile(
        path.join(config.modRequest.projectRoot, 'native/event-search/NativeEventSearch.cpp'),
        path.join(jni, 'NativeEventSearch.cpp'),
      );
      const rnSetup = path.join(
        config.modRequest.projectRoot,
        'node_modules/react-native/ReactAndroid/cmake-utils/default-app-setup',
      );
      await fs.copyFile(path.join(rnSetup, 'OnLoad.cpp'), path.join(jni, 'OnLoad.cpp'));
      let cmake = await fs.readFile(path.join(rnSetup, 'CMakeLists.txt'), 'utf8');
      cmake +=
        '\n# Gather local C++ TurboModule implementation.\ntarget_sources(${CMAKE_PROJECT_NAME} PRIVATE NativeEventSearch.cpp)\ntarget_include_directories(${CMAKE_PROJECT_NAME} PUBLIC .)\n';
      await fs.writeFile(path.join(jni, 'CMakeLists.txt'), cmake);
      const onLoadPath = path.join(jni, 'OnLoad.cpp');
      let onLoad = await fs.readFile(onLoadPath, 'utf8');
      onLoad = '#include <NativeEventSearch.h>\n' + onLoad;
      onLoad = onLoad.replace(
        '  // And we fallback to the CXX module providers autolinked\n  return autolinking_cxxModuleProvider(name, jsInvoker);',
        '  if (name == facebook::react::NativeEventSearch::kModuleName) {\n    return std::make_shared<facebook::react::NativeEventSearch>(jsInvoker);\n  }\n\n  // And we fallback to the CXX module providers autolinked\n  return autolinking_cxxModuleProvider(name, jsInvoker);',
      );
      await fs.writeFile(onLoadPath, onLoad);
      return config;
    },
  ]);
  config = withAppBuildGradle(config, (config) => {
    let gradle = config.modResults.contents;
    if (!gradle.includes('src/main/jni/CMakeLists.txt')) {
      gradle = gradle.replace(/(externalNativeBuild\s*\{\s*cmake\s*\{[^}]*path[^}]*\}\s*\})/, '$1');
      gradle = gradle.replace(
        /(android\s*\{)/,
        '$1\n    externalNativeBuild { cmake { path "src/main/jni/CMakeLists.txt" } }',
      );
    }
    config.modResults.contents = gradle;
    return config;
  });
  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectName = config.modRequest.projectName;
      const appDir = path.join(config.modRequest.platformProjectRoot, projectName);
      const nativeDir = path.join(config.modRequest.projectRoot, 'native/event-search');
      await fs.copyFile(
        path.join(nativeDir, 'NativeEventSearch.h'),
        path.join(appDir, 'NativeEventSearch.h'),
      );
      await fs.copyFile(
        path.join(nativeDir, 'NativeEventSearch.cpp'),
        path.join(appDir, 'NativeEventSearch.cpp'),
      );
      await fs.writeFile(
        path.join(appDir, 'NativeEventSearchProvider.mm'),
        `#import <ReactCommon/RCTTurboModule.h>\n#import <ReactCommon/CallInvoker.h>\n#import "NativeEventSearch.h"\n\n@interface NativeEventSearchProvider : NSObject <RCTModuleProvider>\n@end\n@implementation NativeEventSearchProvider\n- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params {\n  return std::make_shared<facebook::react::NativeEventSearch>(params.jsInvoker);\n}\n@end\n`,
      );
      return config;
    },
  ]);
  return withXcodeProject(config, (config) => {
    const project = config.modResults;
    const group =
      project.pbxGroupByName(project.productName) ||
      project.pbxGroupByName(config.modRequest.projectName);
    const groupKey = group?.uuid || project.getFirstProject().firstProject.mainGroup;
    for (const file of ['NativeEventSearchProvider.mm', 'NativeEventSearch.cpp']) {
      if (!project.hasFile(`${config.modRequest.projectName}/${file}`))
        project.addSourceFile(
          `${config.modRequest.projectName}/${file}`,
          { target: project.getFirstTarget().uuid },
          groupKey,
        );
    }
    return config;
  });
}
module.exports = withEventSearch;
