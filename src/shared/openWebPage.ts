import { Linking } from "react-native";

// The legal pages are the website's; open them in the browser rather than keeping a copy in the app.
export const openWebPage = (url: string): void => {
  void Linking.openURL(url).catch(() => undefined);
};
