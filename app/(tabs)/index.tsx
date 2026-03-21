import RegisterDrugsScreen from "@/Dashboard/register_drugs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SearchBar } from "@rneui/base";
import React, { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [activeTab, setActiveTab] = useState<"dashboard" | "register_drugs">(
    "dashboard",
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* SIDEBAR */}
        <View style={[styles.sidebar, { width: isCollapsed ? 80 : 260 }]}>
          {/* TOGGLE BUTTON */}
          <Pressable
            onPress={() => setIsCollapsed(!isCollapsed)}
            style={styles.toggleBtn}
          >
            <MaterialCommunityIcons
              name={isCollapsed ? "menu-open" : "menu"}
              size={24}
              color="#2196F3"
            />
          </Pressable>

          <View style={styles.logoContainer}>
            <Text
              style={[
                styles.logoText,
                isCollapsed && { opacity: 0, height: 0 },
              ]}
            >
              Pharmacy Admin
            </Text>
          </View>

          <NavButton
            icon="view-dashboard-outline"
            label="Dashboard"
            active
            isCollapsed={isCollapsed}
            onPress={() => setActiveTab("dashboard")}
          />
          <NavButton
            icon="pill"
            label="Register Drugs"
            isCollapsed={isCollapsed}
            onPress={() => setActiveTab("register_drugs")}
          />
          <NavButton
            icon="flask-outline"
            label="Scientific Name"
            isCollapsed={isCollapsed}
          />
        </View>

        {/* MAIN CONTENT */}
        <View style={styles.mainContent}>
          <View style={styles.topBar}>
            <SearchBar
              placeholder="Search..."
              containerStyle={styles.searchContainer}
              inputContainerStyle={styles.searchInput}
              value=""
            />
            <Image
              style={styles.profileImage}
              source={require("../../assets/images/profile.jpg")}
            />
          </View>

          <View style={styles.contentArea}>
            {activeTab === "dashboard" && (
              <Text style={styles.welcomeText}>
                {isCollapsed ? "Dashboard" : "Welcome back, Admin"}
              </Text>
            )}

            {activeTab === "register_drugs" && <RegisterDrugsScreen />}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

// Updated NavButton to handle Collapsed State
type NavButtonProps = {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  label: string;
  active?: boolean;
  isCollapsed: boolean;
  onPress?: () => void;
};

const NavButton: React.FC<NavButtonProps> = ({
  icon,
  label,
  active = false,
  isCollapsed,
  onPress,
}) => (
  <Pressable
    onPress={onPress}
    style={({ hovered }) => [
      styles.navItem,
      hovered && styles.navItemHover,
      active && styles.navItemActive,
      isCollapsed && { justifyContent: "center", paddingHorizontal: 0 },
    ]}
  >
    <MaterialCommunityIcons
      name={icon}
      size={24}
      color={active ? "#2196F3" : "#666"}
    />
    {!isCollapsed && (
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>
        {label}
      </Text>
    )}
  </Pressable>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8F9FA" },
  container: { flex: 1, flexDirection: "row", padding: 0 },
  sidebar: {
    backgroundColor: "#FFFFFF",
    borderRightWidth: 1,
    borderRightColor: "#E0E0E0",
    paddingTop: 10,
    paddingHorizontal: 12,
    // Note: for smooth animation on web, consider LayoutAnimation or CSS transitions
  },
  toggleBtn: {
    alignSelf: "flex-end",
    padding: 10,
    marginBottom: 10,
  },
  logoContainer: {
    paddingBottom: 20,
    alignItems: "center",
  },
  logoText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2196F3",
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  navItemHover: { backgroundColor: "#F0F7FF" },
  navItemActive: { backgroundColor: "#E3F2FD" },
  navLabel: {
    marginLeft: 12,
    fontSize: 15,
    color: "#555",
    fontWeight: "500",
  },
  navLabelActive: { color: "#2196F3", fontWeight: "600" },
  mainContent: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    height: 60,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  searchContainer: {
    backgroundColor: "transparent",
    borderBottomColor: "transparent",
    borderTopColor: "transparent",
    width: "50%",
    padding: 0,
  },
  searchInput: { backgroundColor: "#F1F3F4", borderRadius: 10, height: 35 },
  profileImage: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    borderWidth: 1.5,
    borderColor: "#2196F3",
  },
  contentArea: { padding: 20, flex: 1 },
  welcomeText: { fontSize: 22, fontWeight: "bold", color: "#333" },
});
