import 'dotenv/config'; 

export default {
  expo: {
    name: "Spotsync",
    slug: "mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "mobile",
    userInterfaceStyle: "automatic",
    newArchEnabled: true, 
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.tamago5.mobile",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false 
      }
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#000000",
        foregroundImage: "./assets/images/spotsync-logo-white.png" 
      },
      edgeToEdgeEnabled: true, 
      predictiveBackGestureEnabled: false,
      package: "com.tamago5.mobile"
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/icon.png",
           // FIX: Removed extra quote after imageWidth
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#ffffff" // Consider if dark mode splash should differ
          }
        }
      ]
      // Add other plugins here if needed
    ],
    experiments: {
       // FIX: Removed extra quote after typedRoutes
      typedRoutes: true,
       // FIX: Removed extra quote after reactCompiler
      reactCompiler: true // Ensure you understand the implications of experimental features
    },
    extra: {
      openaiApiKey: process.env.OPENAI_API_KEY || null, 

      router: {},
      eas: {
        projectId: "f6870e59-c6b8-402d-87f8-b700521e8e8b"
      }
    }
  }
};