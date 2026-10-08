import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { colors } from "@/theme/colors";
import type { PaymentInitiation } from "./types";
import { useT } from "@/i18n/useT";

// Mirrors sg-krashi-client/src/shared/components/payment/RazorpayCheckoutButton.tsx
// exactly (same script, same options shape, same "handler fires on modal
// completion only — NOT proof of actual payment success, that's decided by
// the server-side webhook" caveat) — the only difference is *where* checkout.js
// runs. react-native-razorpay (the official native SDK) does not support the
// New Architecture Expo SDK 55+ made mandatory (confirmed via the package's
// own open GitHub issue #510, no fix in progress) — even a custom dev build
// wouldn't help without downgrading the whole app. A WebView running the
// exact same checkout.js the web app already uses has no such incompatibility
// (react-native-webview supports Fabric/the New Architecture) and needs no
// third-party payment wrapper.
const CHECKOUT_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

export interface RazorpaySuccessPayload {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayWebViewProps {
  visible: boolean;
  initiation: PaymentInitiation;
  description: string;
  prefill?: { name?: string; email?: string };
  onSuccess: (payload: RazorpaySuccessPayload) => void;
  onDismiss: () => void;
  onError: (message: string) => void;
}

type BridgeMessage =
  | { type: "success"; payload: RazorpaySuccessPayload }
  | { type: "dismiss" }
  | { type: "error"; message: string };

const buildCheckoutHtml = (
  initiation: PaymentInitiation,
  description: string,
  prefill?: { name?: string; email?: string }
): string => /* i18n-ignore: Razorpay checkout page, not app text (D1) */ `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body style="margin:0;background:#fff;">
    <script src="${CHECKOUT_SCRIPT_SRC}"></script>
    <script>
      function post(message) {
        window.ReactNativeWebView.postMessage(JSON.stringify(message));
      }
      try {
        var options = {
          key: ${JSON.stringify(initiation.razorpayKeyId)},
          amount: ${Math.round(initiation.amount * 100)},
          currency: ${JSON.stringify(initiation.currency)},
          name: "SG Krashi",
          description: ${JSON.stringify(description)},
          order_id: ${JSON.stringify(initiation.gatewayOrderId)},
          prefill: ${JSON.stringify(prefill ?? {})},
          theme: { color: "#2e7d32" },
          handler: function (response) {
            post({ type: "success", payload: response });
          },
          modal: {
            ondismiss: function () {
              post({ type: "dismiss" });
            }
          }
        };
        var rzp = new Razorpay(options);
        rzp.on("payment.failed", function (response) {
          post({ type: "error", message: (response && response.error && response.error.description) || "" });
        });
        rzp.open();
      } catch (e) {
        post({ type: "error", message: String(e) });
      }
    </script>
  </body>
</html>
`;

export const RazorpayWebView = ({
  visible,
  initiation,
  description,
  prefill,
  onSuccess,
  onDismiss,
  onError,
}: RazorpayWebViewProps) => {
  const { t } = useT();
  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data) as BridgeMessage;
      if (message.type === "success") {
        onSuccess(message.payload);
      } else if (message.type === "dismiss") {
        onDismiss();
      } else {
        // Razorpay's own wording is third-party text and can be technical or English-only: it is logged in development
        // builds, and the person gets the app's own sentence.
        if (__DEV__) console.warn("[RazorpayWebView] payment error:", message.message);
        onError(t("errors.paymentFailed"));
      }
    } catch {
      onError(t("payment.readError"));
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onDismiss}>
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => pressed && { opacity: 0.6 }}
          onPress={onDismiss}
          hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
        >
          <Text style={styles.closeText}>{t("common.cancel")}</Text>
        </Pressable>
      </View>
      <WebView
        source={{ html: buildCheckoutHtml(initiation, description, prefill) }}
        onMessage={handleMessage}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 48,
    paddingBottom: 8,
    paddingHorizontal: 16,
    alignItems: "flex-end",
    backgroundColor: colors.background,
  },
  closeText: {
    color: colors.textSecondary,
    fontSize: 15,
  },
});
