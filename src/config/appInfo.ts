import appConfig from "../../app.json";

/** The version shown in Settings: the one in app.json, which is what the build is stamped with. */
export const APP_VERSION: string = appConfig.expo.version;
