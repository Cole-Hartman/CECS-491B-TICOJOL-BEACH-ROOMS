import { Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GoogleSignInButton } from "@/components/social-auth-buttons/google/google-sign-in-button";
import { EmailSignIn } from "@/components/social-auth-buttons/email-sign-in";
import { Colors } from "@/constants/theme";

export default function LoginScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.branding}>
          <Text style={styles.logo}>BeachRooms</Text>
          <Text style={styles.tagline}>Find your study space at CSULB</Text>
        </View>

        <View style={styles.authSection}>
          <EmailSignIn />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <GoogleSignInButton />
        </View>

        <Text style={styles.disclaimer}>
          By signing in, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  branding: {
    alignItems: "center",
    marginBottom: 48,
  },
  logo: {
    fontSize: 42,
    fontWeight: "bold",
    color: Colors.dark.tint,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: Colors.dark.text,
    opacity: 0.8,
  },
  authSection: {
    width: "100%",
    gap: 16,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#444",
  },
  dividerText: {
    color: "#888",
    fontSize: 14,
  },
  disclaimer: {
    marginTop: 32,
    fontSize: 12,
    color: Colors.dark.text,
    opacity: 0.5,
    textAlign: "center",
    paddingHorizontal: 16,
  },
});
